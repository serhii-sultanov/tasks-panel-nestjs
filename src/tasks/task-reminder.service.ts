import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import Mailgun from 'mailgun.js';
import { Model } from 'mongoose';
import { User } from 'src/user/schemas/user.schema';
import { Task } from './schemas/task.schema';
import { SchedulerRegistry } from '@nestjs/schedule';
import { CronJob } from 'cron';
import { TaskList } from './schemas/task-list.schema';

@Injectable()
export class TaskReminderService {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(Task.name) private taskModel: Model<Task>,
    private schedulerRegistry: SchedulerRegistry,
    private readonly config: ConfigService,
  ) {}

  private MAILGUN_API_KEY = this.config.get<string>('MAILGUN_API_KEY');
  private MAILGUN_DOMAIN = this.config.get<string>('MAILGUN_DOMAIN');
  private client = new Mailgun(FormData).client({
    username: 'api',
    key: this.MAILGUN_API_KEY,
  });

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
      return `0 */${taskComments.task_comments[0].comment} * * * *`;
    } catch (err) {
      return '0 */3 * * * *';
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
        const { firstName, lastName, email, taskLists } = client;

        if (!taskLists.length) {
          return;
        }

        const template = this.getTemplate(taskLists, client.id);

        const clientFullName =
          firstName || lastName ? `${firstName} ${lastName}` : email;

        if (!template) {
          return;
        }

        const messageData = {
          from: 'Sender <nextech.crew@gmail.com>',
          to: ['marchuk1992@gmail.com'],
          subject: 'Automatically reminder',
          html: `
          <div
            style="
              background-color: #edf2f8;
              max-width: 600px;
              margin: 0 auto;
              font-family: Arial, Helvetica, sans-serif;
              color: rgb(66, 83, 78);
              padding: 15px;
            "
          >
            <h1
              style="
                font-size: 20px;
                margin-top: 0;
                text-align: center;
                font-weight: bold;
              "
            >
              TAX CO
            </h1>
            <div
              style="
                background-color: rgb(255, 255, 255);
                padding: 20px;
                font-size: 14px;
              "
            >
              <p style="margin-top: 0">Hello ${clientFullName},</p>
              <p style="margin-top: 0">
                Max Iv from TAX CO has been requested that you complete these tasks
                for:
              </p>
              ${template}
              <p style="margin-top: 0; margin-bottom: 30px">
                Please go to your client portal to manage these tasks, send documents
                and ask your accountant questions.
              </p>
              <a
                style="
                  display: block;
                  margin-bottom: 30px;
                  margin: 0 auto;
                  padding: 10px;
                  width: 240px;
                  background-color: rgb(28, 146, 91);
                  text-align: center;
                  color: white;
                  text-decoration: none;
                  border-radius: 6px;
                "
                href="https://docs.nestjs.com/"
                target="_blank"
                >View and Manage Tasks</a
              >
            </div>
          </div>`,
        };

        this.client.messages.create(this.MAILGUN_DOMAIN, messageData);
      });
    } catch (error) {
      return;
    }
  }

  getTemplate(taskLists: TaskList[], clientId: string) {
    const taskListTemplate = (taskList: TaskList) => {
      const { task_list_name, task_list } = taskList;

      if (!task_list.length) {
        return '';
      }

      const taskTemplate = task_list
        .map((task) => {
          const newComment = {
            user_id: clientId,
            comment: 'Automatically reminder email sent to client - success',
          };

          (async () =>
            await this.taskModel.findByIdAndUpdate(
              task.id,
              {
                $push: { task_comments: newComment },
              },
              { new: true },
            ))();

          return `<p
                    style="
                      display: flex;
                      align-items: center;
                      margin: 0;
                      border-top: 2px solid rgba(172, 172, 172, 0.4);
                      padding: 10px;
                    "
                  >
                    <span
                      style="
                        display: block;
                        width: 16px;
                        height: 16px;
                        border: 2px solid rgba(66, 83, 78, 0.4);
                        border-radius: 4px;
                        margin-right: 15px;
                      "
                    ></span>
                    <span style="text-transform: uppercase;">${task.task_title}</span>
                  </p>`;
        })
        .join('');

      return `<div
                style="
                  border: 2px solid rgba(172, 172, 172, 0.4);
                  margin-bottom: 20px;
                "
              >
                <p
                  style="
                    margin: 0;
                    padding: 10px;
                    text-align: center;
                    font-weight: bold;
                  "
                >
                  ${task_list_name}
                </p>
                  ${taskTemplate}
              </div>`;
    };

    return taskLists.map(taskListTemplate).join('');
  }

  async sendTaskReminders() {
    const remind = new CronJob(
      await this.getTaskComments('6514792bfadf73479b04098f'),
      async () => {
        await this.getClients();
      },
    );

    this.schedulerRegistry.addCronJob('remind', remind);
    remind.start();
  }
}
