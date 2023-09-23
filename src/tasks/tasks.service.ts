import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from 'src/user/schemas/user.schema';
import { Task } from './schemas/task.schema';
import { TaskList } from './schemas/task-list.schema';
import { File } from './schemas/file.schema';
import { CreateTaskDto } from './dto/create-task.dto';

@Injectable()
export class TasksService {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(Task.name) private taskModel: Model<Task>,
    @InjectModel(TaskList.name) private taskListModel: Model<TaskList>,
    @InjectModel(File.name) private fileModel: Model<File>,
  ) {}

  async createTask(createTaskDto: CreateTaskDto): Promise<any> {}
}
