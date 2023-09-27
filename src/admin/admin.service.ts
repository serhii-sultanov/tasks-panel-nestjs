import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Message } from 'src/types/type';
import * as bcrypt from 'bcryptjs';
import { User } from 'src/user/schemas/user.schema';
import { ChangeClientRoleDto } from './dto/change-client-role.dto';
import { RegisterUserDto } from 'src/auth/dto/register-user.dto';
import { ConfigService } from '@nestjs/config';
import Mailgun from 'mailgun.js';
import { AdminRegisterUserDto } from './dto/admin-register-client.dto';

@Injectable()
export class AdminService {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    private readonly config: ConfigService,
  ) {}
  private MAILGUN_API_KEY = this.config.get<string>('MAILGUN_API_KEY');
  private MAILGUN_DOMAIN = this.config.get<string>('MAILGUN_DOMAIN');
  private client = new Mailgun(FormData).client({
    username: 'api',
    key: this.MAILGUN_API_KEY,
  });

  async newClientRegistration(
    registerUserDto: AdminRegisterUserDto,
    adminName: string,
  ): Promise<Message> {
    const existUser = await this.userModel.findOne({
      email: registerUserDto.email,
    });
    if (existUser) {
      throw new BadRequestException('This email is already existed!');
    }

    try {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(registerUserDto.password, salt);
      await this.userModel.create({
        email: registerUserDto.email,
        password: hashedPassword,
        role: registerUserDto.role ? registerUserDto.role : 'user',
      });

      const messageData = {
        from: 'Excited User <nextech.crew@gmail.com>',
        to: ['marchuk1992@gmail.com'],
        subject: `Your new account in TAX CO.`,
        template: 'task-client-comment',
        't:variables': JSON.stringify({
          clientName: registerUserDto.email,
          message: `${
            adminName ? adminName : 'Max'
          } TAX CO has registered you on the platform. Here are your login details: Login: ${
            registerUserDto.email
          }, Pass: ${registerUserDto.password}".`,
        }),
      };
      await this.client.messages.create(this.MAILGUN_DOMAIN, messageData);

      return { message: 'Client has been successfully created' };
    } catch (err) {
      throw new InternalServerErrorException(
        'An error occurred when saving the new Client.',
      );
    }
  }

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

  async searchUsers(query: string): Promise<User[]> {
    try {
      const users = await this.userModel.find({
        $or: [
          { firstName: { $regex: query, $options: 'i' } },
          { lastName: { $regex: query, $options: 'i' } },
          { email: { $regex: query, $options: 'i' } },
        ],
      });
      return users;
    } catch (error) {
      throw new InternalServerErrorException(
        'An error occurred when searching users.',
      );
    }
  }

  async deleteClient(clientId: string): Promise<Message> {
    return { message: 'Client has been successfully deleted' };
  }

  async changeClientRole(
    clientId: string,
    changeClientRoleDto: ChangeClientRoleDto,
  ): Promise<Message> {
    try {
      await this.userModel.findByIdAndUpdate(clientId, {
        $set: { role: changeClientRoleDto.newRole },
      });
      return { message: 'Client role has been successfully changed.' };
    } catch (err) {
      throw new ConflictException('Error when changing the client role');
    }
  }
}
