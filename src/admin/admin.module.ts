import { TasksController } from 'src/tasks/tasks.controller';
import { TasksService } from 'src/tasks/tasks.service';
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { User, UserSchema } from 'src/user/schemas/user.schema';
import { Task, TaskSchema } from 'src/tasks/schemas/task.schema';
import { File, FileSchema } from 'src/tasks/schemas/file.schema';
import { TaskList, TaskListSchema } from 'src/tasks/schemas/task-list.schema';
import { AdminService } from './admin.service';
import { AdminTasksController } from './admin.tasks.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Task.name, schema: TaskSchema },
      { name: File.name, schema: FileSchema },
      { name: TaskList.name, schema: TaskListSchema },
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
  providers: [TasksService, AdminService],
  controllers: [TasksController, AdminTasksController],
  exports: [AdminService],
})
export class AdminModule {}
