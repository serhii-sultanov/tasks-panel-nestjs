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
import Mailgun from 'mailgun.js';
import * as fs from 'fs';
import mongoose, { Model, ObjectId } from 'mongoose';
import { File } from 'src/tasks/schemas/file.schema';
import { TaskList } from 'src/tasks/schemas/task-list.schema';
import { Task } from 'src/tasks/schemas/task.schema';
import { Message } from 'src/types/type';
import { User } from 'src/user/schemas/user.schema';
import { AdminRegisterUserDto } from './dto/admin-register-client.dto';
import { ChangeClientRoleDto } from './dto/change-client-role.dto';
import { DeleteTaskListDto } from './dto/delete-tasklist.dto';

@Injectable()
export class AdminService {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(TaskList.name) private taskListModel: Model<TaskList>,
    @InjectModel(Task.name) private taskModel: Model<Task>,
    @InjectModel(File.name) private fileModel: Model<File>,
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
        from: 'Excited User <nextech.crew@gmail.com>',
        to: ['marchuk1992@gmail.com'],
        subject: `Your new account in TAX CO.`,
        template: 'task-client-comment',
        't:variables': JSON.stringify({
          clientName: registerUserDto.email,
          message: `${
            adminName ? adminName : 'Max'
          } TAX CO has registered you on the platform. Here are your login details: Login: ${
            registerUserDto.email
          }, Pass: ${registerUserDto.password}".`,
        }),
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
}
