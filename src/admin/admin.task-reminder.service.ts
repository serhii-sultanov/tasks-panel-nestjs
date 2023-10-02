import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { SchedulerRegistry } from '@nestjs/schedule';
import { Model } from 'mongoose';
import { TaskReminderService } from 'src/tasks/task-reminder.service';
import { Message } from 'src/types/type';
import { UpdateTaskReminderDto } from './dto/update-task-reminder.dto';
import { TaskReminder } from './schemas/task-reminder.schema';

@Injectable()
export class AdminTaskReminderService {
  constructor(
    @InjectModel(TaskReminder.name)
    private taskReminderModel: Model<TaskReminder>,
    private schedulerRegistry: SchedulerRegistry,
    private taskReminderService: TaskReminderService,
  ) {}

  async updateTaskReminder(
    updateTaskReminderDto: UpdateTaskReminderDto,
  ): Promise<Message> {
    try {
      if (updateTaskReminderDto.reminderId) {
        await this.taskReminderModel
          .findByIdAndUpdate(updateTaskReminderDto.reminderId, {
            $set: { dayBetween: updateTaskReminderDto.dayBetween },
          })
          .exec();
        this.schedulerRegistry.deleteCronJob('remind');
        await this.taskReminderService.sendTaskReminders();

        return { message: 'Task reminder has been successfully updated.' };
      } else {
        await this.taskReminderModel.create({
          dayBetween: updateTaskReminderDto.dayBetween,
        });

        this.schedulerRegistry.deleteCronJob('remind');
        await this.taskReminderService.sendTaskReminders();
        return { message: 'Task reminder has been successfully created.' };
      }
    } catch (err) {
      throw new ConflictException('Error occured when updating task reminder');
    }
  }

  async getTaskReminder(): Promise<TaskReminder[]> {
    try {
      const reminder = await this.taskReminderModel.find();
      return reminder;
    } catch (err) {
      throw new ConflictException('Error occured when getting task reminder');
    }
  }
}
