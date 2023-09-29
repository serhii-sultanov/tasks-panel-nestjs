import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { SchedulerRegistry } from '@nestjs/schedule';
import { CronJob } from 'cron';
import Mailgun from 'mailgun.js';
import { Model } from 'mongoose';
import { TaskReminder } from 'src/admin/schemas/task-reminder.schema';
import { User } from 'src/user/schemas/user.schema';
import { remindTemplate } from 'src/utils/html-templates/remindTemplate';
import { taskItemTemplate } from 'src/utils/html-templates/taskItemTemplate';
import { taskListTemplate } from 'src/utils/html-templates/taskListTemplate';
import { TaskList } from './schemas/task-list.schema';
import { Task } from './schemas/task.schema';

@Injectable()
export class TaskReminderService {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(Task.name) private taskModel: Model<Task>,
    @InjectModel(TaskReminder.name)
    private taskReminderModel: Model<TaskReminder>,
    private schedulerRegistry: SchedulerRegistry,
    private readonly config: ConfigService,
  ) {}

  private MAILGUN_API_KEY = this.config.get<string>('MAILGUN_API_KEY');
  private MAILGUN_DOMAIN = this.config.get<string>('MAILGUN_DOMAIN');
  private client = new Mailgun(FormData).client({
    username: 'api',
    key: this.MAILGUN_API_KEY,
  });

  async getTaskReminder() {
    try {
      const reminder = await this.taskReminderModel.find();
      if (!reminder.length) {
        return '0 0 */3 * * *';
      }

      return `0 0 */${reminder[0].dayBetween} * * *`;
    } catch (err) {
      return '0 0 */3 * * *';
    }
  }

  async getClients() {
    try {
      const clients = await this.userModel
        .find()
        .select('-password')
        .populate({
          path: 'taskLists',
          model: 'TaskList',
          populate: {
            path: 'task_list',
            model: 'Task',
            match: { status: 'waiting for client' },
            options: { sort: { createdAt: 1 } },
          },
        })
        .exec();

      if (!clients) {
        return;
      }

      clients.forEach((client) => {
        const { firstName, email, taskLists } = client;
        if (!taskLists.length) {
          return;
        }

        const template = this.getTemplate(taskLists, client.id);
        if (!template) {
          return;
        }

        const messageData = {
          from: 'Sender <nextech.crew@gmail.com>',
          to: [client.email],
          subject: 'Automatically reminder',
          html: remindTemplate(firstName, email, template),
        };

        this.client.messages.create(this.MAILGUN_DOMAIN, messageData);
      });
    } catch (error) {
      return;
    }
  }

  getTemplate(taskLists: TaskList[], clientId: string) {
    const tasksTemplate = (taskList: TaskList) => {
      const { task_list_name, task_list } = taskList;

      if (!task_list.length) {
        return '';
      }

      const taskTemplate = task_list
        .map((task) => {
          const newComment = {
            user_id: clientId,
            comment: 'Automatically reminder email sent to client - success',
            isSystem: true,
          };

          (async () =>
            await this.taskModel.findByIdAndUpdate(
              task.id,
              {
                $push: { task_comments: newComment },
              },
              { new: true },
            ))();

          return taskItemTemplate(task.task_title);
        })
        .join('');

      return taskListTemplate(task_list_name, taskTemplate);
    };
    return taskLists.map(tasksTemplate).join('');
  }

  async sendTaskReminders() {
    const remind = new CronJob(await this.getTaskReminder(), async () => {
      await this.getClients();
    });

    this.schedulerRegistry.addCronJob('remind', remind);
    remind.start();
  }
}
