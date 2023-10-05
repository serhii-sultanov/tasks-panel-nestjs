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
import { Activity } from 'src/admin/schemas/activity.schema';
import { File } from 'src/tasks/schemas/file.schema';
import { TaskList } from 'src/tasks/schemas/task-list.schema';
import { Task } from 'src/tasks/schemas/task.schema';
import { Message } from 'src/types/type';
import { User } from 'src/user/schemas/user.schema';
import { adminCommentTemplate } from 'src/utils/html-templates/adminCommentTemplate';
import { clientCommentTemplate } from 'src/utils/html-templates/clientCommentTemplate';
import { EditCommentDto } from './dto/edit-task-comment.dto';
import { LeaveCommentDto } from './dto/leave-comment.dto';

@Injectable()
export class TaskCommentsService {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(Task.name) private taskModel: Model<Task>,
    @InjectModel(File.name) private fileModel: Model<File>,
    @InjectModel(TaskList.name) private taskListModel: Model<TaskList>,
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

  async getTask(taskId: string): Promise<Task> {
    try {
      const task = await this.taskModel.findById(taskId).populate([
        {
          path: 'task_comments',
          options: { sort: { createdAt: 1 } },
          populate: [
            { path: 'user_id', select: '-password -taskLists' },
            { path: 'files_id' },
          ],
        },
        { path: 'task_files', model: 'File' },
      ]);

      return task;
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
  ): Promise<Message> {
    const transactionSession = await this.connection.startSession();
    try {
      transactionSession.startTransaction();

      const task = await this.taskModel
        .findById(leaveCommentDto.task_id)
        .session(transactionSession);

      if (!task) {
        throw new NotFoundException('Task Not Found');
      }
      const client = await this.userModel
        .findById(task.user_id)
        .session(transactionSession);

      if (!client) {
        throw new NotFoundException('Client Not Found');
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

      const newClientComment = {
        user_id: client,
        comment: leaveCommentDto.comment,
        files_id: newFiles,
        activity_id: new mongoose.Types.ObjectId(),
      };

      if (role === 'admin') {
        const user = await this.userModel
          .findById(userId)
          .session(transactionSession);
        if (!user) {
          throw new NotFoundException('User Not Found');
        }
        const newAdminComment = {
          user_id: user,
          comment: leaveCommentDto.comment,
          files_id: newFiles,
        };

        await this.taskModel.findByIdAndUpdate(
          leaveCommentDto.task_id,
          {
            $push: { task_comments: newAdminComment },
          },
          { new: true, session: transactionSession },
        );

        const messageData = {
          from: 'Sender <nextech.crew@gmail.com>',
          to: [client.email],
          subject: `Admin left comment to task ${task.task_title}`,
          html: adminCommentTemplate(
            client.firstName,
            client.email,
            adminName,
            task.task_title,
          ),
        };

        await this.client.messages.create(this.MAILGUN_DOMAIN, messageData);
        await transactionSession.commitTransaction();
        return { message: 'Comment has been successfully sended.' };
      } else {
        await this.taskModel.findByIdAndUpdate(
          leaveCommentDto.task_id,
          {
            $push: { task_comments: newClientComment },
            $set: { status: 'needs review' },
          },
          { new: true, session: transactionSession },
        );

        const taskList = await this.taskListModel
          .findOne({ task_list: { $in: [task.id] } })
          .session(transactionSession);

        const newActivity = new this.activityModel({
          user_id: client.id,
          taskList_id: taskList.id,
          task_id: task.id,
          activity_files: newFiles,
          activity_comment: newClientComment.activity_id,
        });

        await newActivity.save({ session: transactionSession });

        const messageData = {
          from: 'Sender <nextech.crew@gmail.com>',
          to: ['nextech.crew@gmail.com'],
          subject: `Client ${
            client.firstName ? client.firstName : client.email
          } left comment to task.`,
          html: clientCommentTemplate(
            client.firstName,
            client.lastName,
            client.businessName,
            client.email,
            'Max Iv',
            task.task_title,
          ),
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
        .populate({
          path: 'task_comments',
          model: 'User',
        })
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

        if (comment.user_id.role !== 'admin') {
          await this.activityModel.deleteOne({
            activity_comment: comment.activity_id,
          });
        }

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

      if (comment.user_id.role !== 'admin') {
        await this.activityModel.deleteOne({
          activity_comment: comment.activity_id,
        });
      }

      await this.taskModel.findByIdAndUpdate(
        taskId,
        { $pull: { task_comments: { id: commentId } } },
        { new: true, session: transactionSession },
      );

      await transactionSession.commitTransaction();
      return { message: 'Task comment has been successfully deleted' };
    } catch (err) {
      console.log(err);
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
