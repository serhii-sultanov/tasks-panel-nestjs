import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { UserModule } from 'src/user/user.module';
import { TasksController } from './tasks.controller';
import { TasksService } from './tasks.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Task, TaskSchema } from './schemas/task.schema';
import { File, FileSchema } from './schemas/file.schema';
import { User, UserSchema } from 'src/user/schemas/user.schema';
import { TaskList, TaskListSchema } from './schemas/task-list.schema';
import { TaskReminderService } from './task-reminder.service';
import {
  TaskReminder,
  TaskReminderSchema,
} from 'src/admin/schemas/task-reminder.schema';

@Module({
  imports: [
    UserModule,
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: TaskList.name, schema: TaskListSchema },
      { name: Task.name, schema: TaskSchema },
      { name: File.name, schema: FileSchema },
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
  controllers: [TasksController],
  providers: [TasksService, TaskReminderService],
  exports: [TasksService, TaskReminderService],
})
export class TasksModule {}
