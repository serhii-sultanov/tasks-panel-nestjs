import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import * as bcrypt from 'bcryptjs';
import * as fs from 'fs';
import Mailgun from 'mailgun.js';
import mongoose, { Model } from 'mongoose';
import { File } from 'src/tasks/schemas/file.schema';
import { TaskList } from 'src/tasks/schemas/task-list.schema';
import { Task } from 'src/tasks/schemas/task.schema';
import { Message } from 'src/types/type';
import { User } from 'src/user/schemas/user.schema';
import { userAuthTemplate } from 'src/utils/html-templates/userAuthTemplate';
import { AdminRegisterUserDto } from './dto/admin-register-client.dto';
import { ChangeClientRoleDto } from './dto/change-client-role.dto';
import { DeleteFileDto } from './dto/delete-file.dto';
import { DeleteTaskDto } from './dto/delete-task.dto';
import { DeleteTaskListDto } from './dto/delete-tasklist.dto';
import { Activity } from './schemas/activity.schema';

@Injectable()
export class AdminService {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(TaskList.name) private taskListModel: Model<TaskList>,
    @InjectModel(Task.name) private taskModel: Model<Task>,
    @InjectModel(File.name) private fileModel: Model<File>,
    @InjectModel(Activity.name) private activityModel: Model<Activity>,
    @InjectConnection() private readonly connection: mongoose.Connection,
    private readonly config: ConfigService,
  ) {}

  private MAILGUN_API_KEY = this.config.get<string>('MAILGUN_API_KEY');
  private MAILGUN_DOMAIN = this.config.get<string>('MAILGUN_DOMAIN');
  private client = new Mailgun(FormData).client({
    username: 'api',
    key: this.MAILGUN_API_KEY,
  });

  async newClientRegistration(
    registerUserDto: AdminRegisterUserDto,
    adminName: string,
  ): Promise<Message> {
    const existUser = await this.userModel.findOne({
      email: registerUserDto.email,
    });
    if (existUser) {
      throw new BadRequestException('This email is already existed!');
    }

    try {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(registerUserDto.password, salt);
      await this.userModel.create({
        email: registerUserDto.email,
        password: hashedPassword,
        role: registerUserDto.role ? registerUserDto.role : 'user',
      });

      const messageData = {
        from: 'Sender <nextech.crew@gmail.com>',
        to: [registerUserDto.email],
        subject: `Your new account in TAX CO.`,
        html: userAuthTemplate(
          registerUserDto.email,
          registerUserDto.password,
          adminName,
        ),
      };
      await this.client.messages.create(this.MAILGUN_DOMAIN, messageData);

      return { message: 'Client has been successfully created' };
    } catch (err) {
      throw new InternalServerErrorException(
        'An error occurred when saving the new Client.',
      );
    }
  }

  async getPaginatedClients(page: number, pageSize: number) {
    try {
      const totalClients = await this.userModel.find();
      if (!totalClients.length) {
        throw new NotFoundException('Clients not found');
      }

      const skip = (page - 1) * pageSize;
      const clientsPerPage = await this.userModel
        .find()
        .select('-password')
        .skip(skip)
        .limit(pageSize)
        .populate({
          path: 'taskLists',
          model: 'TaskList',
          populate: {
            path: 'task_list',
            model: 'Task',
          },
        })
        .exec();

      if (!clientsPerPage.length) {
        throw new NotFoundException('Clients not found');
      }

      return {
        clientsPerPage,
        totalClients: totalClients.length,
      };
    } catch (err) {
      throw new ConflictException('Get paginated client error.');
    }
  }

  async searchUsers(query: string): Promise<User[]> {
    try {
      const users = await this.userModel.find({
        $or: [
          { firstName: { $regex: query, $options: 'i' } },
          { lastName: { $regex: query, $options: 'i' } },
          { email: { $regex: query, $options: 'i' } },
        ],
      });
      return users;
    } catch (error) {
      throw new InternalServerErrorException(
        'An error occurred when searching users.',
      );
    }
  }

  async deleteClient(clientId: string): Promise<Message> {
    const transactionSession = await this.connection.startSession();
    try {
      transactionSession.startTransaction();
      const user = await this.userModel
        .findById(clientId)
        .populate({
          path: 'taskLists',
          model: 'TaskList',
          populate: {
            path: 'task_list',
            model: 'Task',
            populate: {
              path: 'task_files',
              model: 'File',
            },
          },
        })
        .session(transactionSession)
        .exec();

      if (!user) {
        throw new NotFoundException('User not found');
      }

      const fileArr = [];

      for (const taskList of user.taskLists) {
        for (const task of taskList.task_list) {
          for (const comment of task.task_comments) {
            for (const fileId of comment.files_id) {
              const file = await this.fileModel
                .findById(fileId)
                .session(transactionSession)
                .exec();
              if (file) {
                await this.fileModel
                  .findByIdAndDelete(file.id)
                  .session(transactionSession);
                const filePath = file.file_path;
                fileArr.push(filePath);
              }
            }
          }
          for (const fileId of task.task_files) {
            const file = await this.fileModel
              .findById(fileId)
              .session(transactionSession)
              .exec();
            if (file) {
              await this.fileModel
                .findByIdAndDelete(file.id)
                .session(transactionSession);
              const filePath = file.file_path;
              fileArr.push(filePath);
            }
          }
          await this.taskModel
            .findByIdAndDelete(task.id)
            .session(transactionSession);
        }
        await this.taskListModel
          .findByIdAndDelete(taskList.id)
          .session(transactionSession);
      }

      await this.activityModel
        .deleteMany({ user_id: clientId })
        .session(transactionSession);

      await this.userModel
        .findByIdAndDelete(clientId)
        .session(transactionSession);

      await transactionSession.commitTransaction();

      fileArr.forEach((file) => fs.unlinkSync(file));

      return { message: 'Client has been successfully deleted' };
    } catch (err) {
      await transactionSession.abortTransaction();
      throw new ConflictException('Error when deleting User account');
    } finally {
      transactionSession.endSession();
    }
  }

  async changeClientRole(
    clientId: string,
    changeClientRoleDto: ChangeClientRoleDto,
  ): Promise<Message> {
    try {
      await this.userModel.findByIdAndUpdate(clientId, {
        $set: { role: changeClientRoleDto.newRole },
      });
      return { message: 'Client role has been successfully changed.' };
    } catch (err) {
      throw new ConflictException('Error when changing the client role');
    }
  }

  async deleteTaskList(
    taskListId: string,
    deleteTaskListDto: DeleteTaskListDto,
  ): Promise<Message> {
    const transactionSession = await this.connection.startSession();

    try {
      transactionSession.startTransaction();
      const taskList = await this.taskListModel
        .findById(taskListId)
        .populate({
          path: 'task_list',
          model: 'Task',
          populate: {
            path: 'task_files',
            model: 'File',
          },
        })
        .session(transactionSession)
        .exec();

      if (!taskList) {
        throw new NotFoundException('Task list not found');
      }
      const fileArr = [];

      for (const task of taskList.task_list) {
        for (const comment of task.task_comments) {
          for (const fileId of comment.files_id) {
            const file = await this.fileModel
              .findById(fileId)
              .session(transactionSession)
              .exec();
            if (file) {
              await this.fileModel
                .findByIdAndDelete(file.id)
                .session(transactionSession);
              const filePath = file.file_path;
              fileArr.push(filePath);
            }
          }
        }
        for (const fileId of task.task_files) {
          const file = await this.fileModel
            .findById(fileId)
            .session(transactionSession)
            .exec();
          if (file) {
            await this.fileModel
              .findByIdAndDelete(file.id)
              .session(transactionSession);
            const filePath = file.file_path;
            fileArr.push(filePath);
          }
        }
        await this.taskModel
          .findByIdAndDelete(task.id)
          .session(transactionSession);
      }

      await this.userModel
        .findByIdAndUpdate(deleteTaskListDto.userId, {
          $pull: { taskLists: taskList.id },
        })
        .session(transactionSession);

      await this.activityModel
        .deleteMany({ taskList_id: taskListId })
        .session(transactionSession);

      await this.taskListModel
        .findByIdAndDelete(taskListId)
        .session(transactionSession);

      await transactionSession.commitTransaction();

      fileArr.forEach((file) => fs.unlinkSync(file));

      return { message: 'Task list has been successfully deleted' };
    } catch (err) {
      await transactionSession.abortTransaction();

      throw new ConflictException('Error occured when deleting task list');
    } finally {
      transactionSession.endSession();
    }
  }

  async deleteTask(
    taskId: string,
    deleteTaskDto: DeleteTaskDto,
  ): Promise<Message> {
    const transactionSession = await this.connection.startSession();

    try {
      transactionSession.startTransaction();
      const task = await this.taskModel
        .findById(taskId)
        .populate({
          path: 'task_files',
          model: 'File',
        })
        .session(transactionSession)
        .exec();

      if (!task) {
        throw new NotFoundException('Task not found');
      }
      const fileArr = [];

      for (const comment of task.task_comments) {
        for (const fileId of comment.files_id) {
          const file = await this.fileModel
            .findById(fileId)
            .session(transactionSession)
            .exec();
          if (file) {
            await this.fileModel
              .findByIdAndDelete(file.id)
              .session(transactionSession);
            const filePath = file.file_path;
            fileArr.push(filePath);
          }
        }
      }
      for (const fileId of task.task_files) {
        const file = await this.fileModel
          .findById(fileId)
          .session(transactionSession)
          .exec();
        if (file) {
          await this.fileModel
            .findByIdAndDelete(file.id)
            .session(transactionSession);
          const filePath = file.file_path;
          fileArr.push(filePath);
        }
      }

      await this.taskListModel
        .findByIdAndUpdate(deleteTaskDto.taskListId, {
          $pull: { task_list: task.id },
        })
        .session(transactionSession);

      await this.activityModel
        .deleteMany({ task_id: taskId })
        .session(transactionSession);

      await this.taskModel
        .findByIdAndDelete(taskId)
        .session(transactionSession);

      fileArr.forEach((file) => fs.unlinkSync(file));

      await transactionSession.commitTransaction();

      return { message: 'Task has been successfully deleted' };
    } catch (err) {
      await transactionSession.abortTransaction();
      throw new ConflictException('Error occured when deleting task');
    } finally {
      transactionSession.endSession();
    }
  }

  async deleteFile(
    fileId: string,
    deleteFileDto: DeleteFileDto,
  ): Promise<Message> {
    const transactionSession = await this.connection.startSession();
    try {
      transactionSession.startTransaction();
      const file = await this.fileModel
        .findById(fileId)
        .session(transactionSession);
      if (!file) {
        throw new NotFoundException('File not found');
      }

      await this.taskModel
        .findByIdAndUpdate(deleteFileDto.taskId, {
          $pull: { task_files: file.id },
        })
        .session(transactionSession);

      await this.fileModel
        .findByIdAndDelete(fileId)
        .session(transactionSession);

      await transactionSession.commitTransaction();

      fs.unlinkSync(file.file_path);
      return { message: 'File has been successfully deleted' };
    } catch (err) {
      await transactionSession.abortTransaction();
      throw new ConflictException('Error occured when deleting file');
    } finally {
      transactionSession.endSession();
    }
  }
}
