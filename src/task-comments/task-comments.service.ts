import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import * as fs from 'fs';
import mongoose, { Model } from 'mongoose';
import { File } from 'src/tasks/schemas/file.schema';
import { Task } from 'src/tasks/schemas/task.schema';
import { User } from 'src/user/schemas/user.schema';
import { LeaveCommentDto } from './dto/leave-comment.dto';
import { Message } from 'src/types/type';
import { EditCommentDto } from './dto/edit-task-comment.dto';

@Injectable()
export class TaskCommentsService {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(Task.name) private taskModel: Model<Task>,
    @InjectModel(File.name) private fileModel: Model<File>,
    @InjectConnection() private readonly connection: mongoose.Connection,
  ) {}

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
  ) {
    const transactionSession = await this.connection.startSession();
    try {
      transactionSession.startTransaction();
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
    try {
      await this.taskModel.findByIdAndUpdate(
        taskId,
        { $pull: { task_comments: { id: commentId } } },
        { new: true },
      );
      return { message: 'Task comment has been successfully deleted' };
    } catch (err) {
      throw new ConflictException('Error when deleting task comment');
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
