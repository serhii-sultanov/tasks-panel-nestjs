import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import * as fs from 'fs';
import mongoose, { Model } from 'mongoose';
import { Message } from 'src/types/type';
import { User } from 'src/user/schemas/user.schema';
import { ChangeStatusDto } from './dto/change-status.dto';
import { CreateTaskDto } from './dto/create-task.dto';
import { EditTaskDto } from './dto/edit-task.dto';
import { EditTaskListDto } from './dto/edit-taskList.dto';
import { File } from './schemas/file.schema';
import { TaskList } from './schemas/task-list.schema';
import { Task } from './schemas/task.schema';
import { ConfigService } from '@nestjs/config';
import Mailgun from 'mailgun.js';

@Injectable()
export class TasksService {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(Task.name) private taskModel: Model<Task>,
    @InjectModel(TaskList.name) private taskListModel: Model<TaskList>,
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

  async createTask(
    createTaskDto: CreateTaskDto,
    files: Express.Multer.File[],
    adminName: string,
  ): Promise<Message> {
    const transactionSession = await this.connection.startSession();
    try {
      transactionSession.startTransaction();
      const client = await this.userModel
        .findById(createTaskDto.user_id)
        .session(transactionSession);

      if (!client) {
        throw new NotFoundException('Client Not Found');
      }

      const isTaskList = await this.taskListModel
        .findOne({
          user_id: createTaskDto.user_id,
          task_list_name: createTaskDto.task_list_name,
        })
        .populate('task_list')
        .session(transactionSession);

      const newFilesData = files.map((file) => {
        return {
          file_originalName: file.originalname,
          file_size: file.size,
          file_path: file.path,
          file_contentType: file.mimetype,
        };
      });
      const newFiles = await this.fileModel.create(newFilesData, {
        session: transactionSession,
      });

      if (!isTaskList) {
        const createTask = new this.taskModel({
          task_title: createTaskDto.task_title,
          task_description: createTaskDto.task_description,
          task_files: newFiles,
          task_comments: [],
        });
        await createTask.save({ session: transactionSession });

        const taskList = new this.taskListModel({
          user_id: createTaskDto.user_id,
          task_list_name: createTaskDto.task_list_name,
          task_list: [createTask],
        });

        await taskList.save({ session: transactionSession });

        await this.userModel.findByIdAndUpdate(
          createTaskDto.user_id,
          { $push: { taskLists: taskList } },
          { session: transactionSession },
        );

        const messageData = {
          from: 'Excited User <nextech.crew@gmail.com>',
          to: ['marchuk1992@gmail.com'],
          subject: `Added new task list - ${createTaskDto.task_list_name} with task ${createTaskDto.task_title}`,
          template: 'test',
          't:variables': JSON.stringify({
            clientName: client.firstName ? client.firstName : client.email,
            adminName: adminName ? adminName : 'Max',
            taskListName: createTaskDto.task_list_name,
          }),
        };

        await this.client.messages.create(this.MAILGUN_DOMAIN, messageData);

        await transactionSession.commitTransaction();

        return { message: 'Task list and task has been succesfully created' };
      }

      const isTask = isTaskList.task_list.find(
        (task) => task.task_title === createTaskDto.task_title,
      );

      if (isTask) {
        await this.taskModel.findByIdAndUpdate(
          isTask.id,
          {
            $set: { task_description: createTaskDto.task_description },
            $push: { task_files: { $each: newFiles } },
          },
          { new: true, session: transactionSession },
        );

        const messageData = {
          from: 'Excited User <nextech.crew@gmail.com>',
          to: ['marchuk1992@gmail.com'],
          subject: `In the task (${isTask.task_title}) has been loaded new file(s)`,
          template: 'test',
          't:variables': JSON.stringify({
            clientName: client.firstName ? client.firstName : client.email,
            adminName: adminName ? adminName : 'Max',
            taskListName: isTaskList.task_list_name,
          }),
        };

        await this.client.messages.create(this.MAILGUN_DOMAIN, messageData);

        await transactionSession.commitTransaction();
        return { message: 'Task Updated' };
      } else {
        const createTask = new this.taskModel({
          task_title: createTaskDto.task_title,
          task_description: createTaskDto.task_description,
          task_files: newFiles,
          task_comments: [],
        });
        await createTask.save({ session: transactionSession });
        await this.taskListModel.updateOne(
          {
            user_id: createTaskDto.user_id,
            task_list_name: createTaskDto.task_list_name,
          },
          { $push: { task_list: createTask } },
          { session: transactionSession },
        );

        const messageData = {
          from: 'Excited User <nextech.crew@gmail.com>',
          to: ['marchuk1992@gmail.com'],
          subject: 'New task added',
          template: 'test',
          't:variables': JSON.stringify({
            clientName: client.firstName ? client.firstName : client.email,
            adminName: adminName ? adminName : 'Max',
            taskListName: isTaskList.task_list_name,
          }),
        };

        await this.client.messages.create(this.MAILGUN_DOMAIN, messageData);

        await transactionSession.commitTransaction();
        return { message: 'Task created and added into Task List' };
      }
    } catch (err) {
      await transactionSession.abortTransaction();
      for (const file of files) {
        const filePath = file.path;
        fs.unlinkSync(filePath);
      }
      throw new ConflictException('Error when creating new task');
    } finally {
      transactionSession.endSession();
    }
  }

  async downloadFile(fileId: string): Promise<File> {
    try {
      const file = await this.fileModel.findById(fileId);
      if (!file) {
        throw new NotFoundException('File not found');
      }

      return file;
    } catch (err) {
      throw new ConflictException('Error when load file');
    }
  }

  async changeTaskStatus(
    taskId: string,
    changeStatusDto: ChangeStatusDto,
    adminName: string,
  ) {
    try {
      const client = await this.userModel.findById(changeStatusDto.userId);
      if (!client) {
        throw new NotFoundException('Client for this task not found');
      }

      const task = await this.taskModel.findByIdAndUpdate(
        taskId,
        {
          $set: { status: changeStatusDto.status },
        },
        { new: true },
      );

      const messageData = {
        from: 'Excited User <nextech.crew@gmail.com>',
        to: ['marchuk1992@gmail.com'],
        subject: `Task (${task.task_title}) change status`,
        template: 'test2',
        't:variables': JSON.stringify({
          clientName: client.firstName ? client.firstName : client.email,
          adminName: adminName ? adminName : 'Max',
          status: changeStatusDto.status,
        }),
      };

      await this.client.messages.create(this.MAILGUN_DOMAIN, messageData);

      return task;
    } catch (err) {
      throw new ConflictException('Error when change task status');
    }
  }

  async editTaskList(taskListId: string, editTaskListDto: EditTaskListDto) {
    try {
      const taskList = await this.taskListModel.findByIdAndUpdate(
        taskListId,
        {
          $set: { task_list_name: editTaskListDto.newTaskListName },
        },
        { new: true },
      );
      return taskList;
    } catch (err) {
      throw new ConflictException('Error when edit task list name');
    }
  }

  async editTask(taskId: string, editTaskDto: EditTaskDto) {
    try {
      const task = await this.taskModel.findByIdAndUpdate(
        taskId,
        {
          $set: {
            task_title: editTaskDto.newTitle,
            task_description: editTaskDto.newDescription,
          },
        },
        { new: true },
      );
      return task;
    } catch (err) {
      throw new ConflictException('Error when edit task title & description');
    }
  }
}
