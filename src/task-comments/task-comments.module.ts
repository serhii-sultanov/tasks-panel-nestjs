import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { MongooseModule } from '@nestjs/mongoose';
import { File, FileSchema } from 'src/tasks/schemas/file.schema';
import { Task, TaskSchema } from 'src/tasks/schemas/task.schema';
import { User, UserSchema } from 'src/user/schemas/user.schema';
import { TaskCommentsController } from './task-comments.controller';
import { TaskCommentsService } from './task-comments.service';
import { Activity, ActivitySchema } from 'src/admin/schemas/activity.schema';
import { TaskList, TaskListSchema } from 'src/tasks/schemas/task-list.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Task.name, schema: TaskSchema },
      { name: File.name, schema: FileSchema },
      { name: TaskList.name, schema: TaskListSchema },
      { name: Activity.name, schema: ActivitySchema },
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
  controllers: [TaskCommentsController],
  providers: [TaskCommentsService],
  exports: [TaskCommentsService],
})
export class TaskCommentsModule {}
