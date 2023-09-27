import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import * as fs from 'fs';
import Mailgun from 'mailgun.js';
import mongoose, { Model } from 'mongoose';
import { File } from 'src/tasks/schemas/file.schema';
import { Task } from 'src/tasks/schemas/task.schema';
import { Message } from 'src/types/type';
import { User } from 'src/user/schemas/user.schema';
import { EditCommentDto } from './dto/edit-task-comment.dto';
import { LeaveCommentDto } from './dto/leave-comment.dto';

@Injectable()
export class TaskCommentsService {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
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

  async getTaskComments(taskId: string) {
    try {
      const taskComments = await this.taskModel.findById(taskId).populate({
        path: 'task_comments',
        options: { sort: { createdAt: 1 } },
        populate: [
          { path: 'user_id', select: '-password -taskLists' },
          { path: 'files_id' },
        ],
      });

      return taskComments.task_comments;
    } catch (err) {
      throw new InternalServerErrorException(
        'Error occured when getting task comments.',
      );
    }
  }

  async leaveTaskComment(
    role: string,
    userId: string,
    leaveCommentDto: LeaveCommentDto,
    files: Express.Multer.File[],
    adminName: string,
  ) {
    const transactionSession = await this.connection.startSession();
    try {
      transactionSession.startTransaction();
      const client = await this.userModel
        .findById(leaveCommentDto.clientId)
        .session(transactionSession);
      if (!client) {
        throw new NotFoundException('Client Not Found');
      }
      const user = await this.userModel
        .findById(userId)
        .session(transactionSession);
      if (!user) {
        throw new NotFoundException('User Not Found');
      }
      const task = await this.taskModel
        .findById(leaveCommentDto.task_id)
        .session(transactionSession);
      if (!task) {
        throw new NotFoundException('Task Not Found');
      }
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

      const newComment = {
        user_id: user,
        comment: leaveCommentDto.comment,
        files_id: newFiles,
      };

      if (role === 'admin') {
        await this.taskModel.findByIdAndUpdate(
          leaveCommentDto.task_id,
          {
            $push: { task_comments: newComment },
          },
          { new: true, session: transactionSession },
        );

        const messageData = {
          from: 'Excited User <nextech.crew@gmail.com>',
          to: ['marchuk1992@gmail.com'],
          subject: `Admin left comment into your task ${task.task_title}`,
          template: 'task-client-comment',
          't:variables': JSON.stringify({
            clientName: client.firstName ? client.firstName : client.email,
            message: `${
              adminName ? adminName : 'Max'
            } from TAX CO left comment into your task - "${task.task_title}".`,
          }),
        };
        await this.client.messages.create(this.MAILGUN_DOMAIN, messageData);

        await transactionSession.commitTransaction();

        return { message: 'Comment has been successfully sended.' };
      } else {
        await this.taskModel.findByIdAndUpdate(
          leaveCommentDto.task_id,
          {
            $push: { task_comments: newComment },
            $set: { status: 'needs review' },
          },
          { new: true, session: transactionSession },
        );

        const messageData = {
          from: 'Excited User <nextech.crew@gmail.com>',
          to: ['nextech.crew@gmail.com'],
          subject: `Client ${
            user.firstName ? user.firstName : user.email
          } left comment`,
          template: 'task-comment',
          't:variables': JSON.stringify({
            adminName: adminName ? adminName : 'Max',
            message: `Client left comment into task - "${task.task_title}". Task status: Needs review.`,
          }),
        };

        await this.client.messages.create(this.MAILGUN_DOMAIN, messageData);

        await transactionSession.commitTransaction();

        return { message: 'Comment has been successfully sended.' };
      }
    } catch (err) {
      await transactionSession.abortTransaction();
      for (const file of files) {
        const filePath = file.path;
        fs.unlinkSync(filePath);
      }
      throw new ConflictException('Error when leaving new comment');
    } finally {
      transactionSession.endSession();
    }
  }

  async deleteTaskComment(taskId: string, commentId: string): Promise<Message> {
    const transactionSession = await this.connection.startSession();
    try {
      transactionSession.startTransaction();
      const task = await this.taskModel
        .findById(taskId)
        .session(transactionSession);
      if (!task) {
        throw new NotFoundException('Task not found');
      }
      const comment = task.task_comments.find(
        (comment) => comment.id.toString() === commentId,
      );
      if (!comment) {
        throw new NotFoundException('Comment not found');
      }

      const files = await this.fileModel.find({
        _id: { $in: comment.files_id },
      });
      if (files?.length) {
        await this.fileModel.deleteMany(
          { _id: { $in: comment.files_id } },
          { session: transactionSession },
        );

        await this.taskModel.findByIdAndUpdate(
          taskId,
          { $pull: { task_comments: { id: commentId } } },
          { new: true, session: transactionSession },
        );

        await transactionSession.commitTransaction();
        files.forEach((file) => {
          fs.unlinkSync(file.file_path);
        });
        return { message: 'Task comment has been successfully deleted' };
      }

      await this.taskModel.findByIdAndUpdate(
        taskId,
        { $pull: { task_comments: { id: commentId } } },
        { new: true, session: transactionSession },
      );

      await transactionSession.commitTransaction();
      return { message: 'Task comment has been successfully deleted' };
    } catch (err) {
      await transactionSession.abortTransaction();
      throw new ConflictException('Error when deleting task comment');
    } finally {
      transactionSession.endSession();
    }
  }

  async editTaskComment(
    taskId: string,
    commentId: string,
    editCommentDto: EditCommentDto,
  ) {
    try {
      await this.taskModel.findOneAndUpdate(
        {
          _id: taskId,
          task_comments: { $elemMatch: { id: commentId } },
        },
        { $set: { 'task_comments.$.comment': editCommentDto.updatedComment } },
        { new: true },
      );

      return { message: 'Task comment has been successfully edited.' };
    } catch (err) {
      throw new ConflictException('Error when editing task comment');
    }
  }
}
