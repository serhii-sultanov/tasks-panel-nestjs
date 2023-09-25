import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import mongoose, { Model } from 'mongoose';
import { File } from 'src/tasks/schemas/file.schema';
import { Task } from 'src/tasks/schemas/task.schema';
import { User } from 'src/user/schemas/user.schema';

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
        populate: [
          { path: 'user_id', select: '-password' },
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
}
