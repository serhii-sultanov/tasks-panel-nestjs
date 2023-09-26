import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Message } from 'src/types/type';
import { User } from 'src/user/schemas/user.schema';

@Injectable()
export class AdminService {
  constructor(@InjectModel(User.name) private userModel: Model<User>) {}

  async getPaginatedClients(page: number, pageSize: number) {
    try {
      const totalClients = await this.userModel.find();
      if (!totalClients.length) {
        throw new NotFoundException('Clients not found');
      }

      const skip = (page - 1) * pageSize;
      const clientsPerPage = await this.userModel
        .find()
        .select('-password')
        .skip(skip)
        .limit(pageSize)
        .populate({
          path: 'taskLists',
          model: 'TaskList',
          populate: {
            path: 'task_list',
            model: 'Task',
          },
        })
        .exec();

      if (!clientsPerPage.length) {
        throw new NotFoundException('Clients not found');
      }

      return {
        clientsPerPage,
        totalClients: totalClients.length,
      };
    } catch (err) {
      throw new ConflictException('Get paginated client error.');
    }
  }

  async deleteClient(clientId: string): Promise<Message> {
    return { message: 'Client has been successfully deleted' };
  }
}
