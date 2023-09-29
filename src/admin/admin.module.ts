import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { MongooseModule } from '@nestjs/mongoose';
import { TaskCommentsController } from 'src/task-comments/task-comments.controller';
import { TaskCommentsService } from 'src/task-comments/task-comments.service';
import { File, FileSchema } from 'src/tasks/schemas/file.schema';
import { TaskList, TaskListSchema } from 'src/tasks/schemas/task-list.schema';
import { Task, TaskSchema } from 'src/tasks/schemas/task.schema';
import { TasksController } from 'src/tasks/tasks.controller';
import { TasksService } from 'src/tasks/tasks.service';
import { User, UserSchema } from 'src/user/schemas/user.schema';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { AdminTasksController } from './admin.tasks.controller';
import { AdminTaskCommentsController } from './admin.tasks-comment.controller';
import { AdminTaskReminderController } from './admin.task-reminder.controller';
import { AdminTaskReminderService } from './admin.task-reminder.service';
import {
  TaskReminder,
  TaskReminderSchema,
} from './schemas/task-reminder.schema';
import { UserService } from 'src/user/user.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Task.name, schema: TaskSchema },
      { name: File.name, schema: FileSchema },
      { name: TaskList.name, schema: TaskListSchema },
      { name: TaskReminder.name, schema: TaskReminderSchema },
    ]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get('JWT_SECRET'),
        signOptions: { expiresIn: '7d' },
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [
    TasksService,
    AdminService,
    TaskCommentsService,
    AdminTaskReminderService,
    UserService,
  ],
  controllers: [
    TasksController,
    AdminTasksController,
    AdminController,
    TaskCommentsController,
    AdminTaskCommentsController,
    AdminTaskReminderController,
  ],
  exports: [AdminService],
})
export class AdminModule {}
