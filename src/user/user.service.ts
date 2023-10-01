import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import * as bcrypt from 'bcryptjs';
import { Model } from 'mongoose';
import { RegisterUserDto } from 'src/auth/dto/register-user.dto';
import { Token } from 'src/types/type';
import { User } from './schemas/user.schema';
import { UpdateClientDataDto } from './dto/update-client.dto';
import { ChangeUserPasswordDto } from './dto/change-client-password.dto';
import { Activity } from 'src/admin/schemas/activity.schema';

@Injectable()
export class UserService {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(Activity.name) private activityModel: Model<Activity>,

    private readonly jwtService: JwtService,
  ) {}

  async registration(registerUserDto: RegisterUserDto): Promise<Token> {
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
      });

      const token = this.jwtService.sign({ email: registerUserDto.email });
      return { token };
    } catch (err) {
      throw new InternalServerErrorException(
        'An error occurred when saving the new User.',
      );
    }
  }

  async findOne(email: string): Promise<User | undefined> {
    return await this.userModel.findOne({
      email,
    });
  }

  async getClientAccount(userId: string) {
    try {
      const client = await this.userModel
        .findById(userId)
        .select('-password')
        .populate({
          path: 'taskLists',
          model: 'TaskList',
          populate: {
            path: 'task_list',
            model: 'Task',
            populate: {
              path: 'task_files',
              model: 'File',
            },
          },
        })
        .exec();

      if (!client) {
        throw new NotFoundException('Client not found');
      }

      return client;
    } catch (err) {
      throw new InternalServerErrorException(
        'An error occurred when getting the client account.',
      );
    }
  }

  async updateClientData(
    userId: string,
    updateClientDataDto: UpdateClientDataDto,
  ) {
    try {
      const client = await this.userModel.findByIdAndUpdate(
        userId,
        updateClientDataDto,
        { new: true },
      );
      return client;
    } catch (err) {
      throw new ConflictException(
        'Error when updating the client personal data',
      );
    }
  }

  async changeUserPassword(
    userId: string,
    changeUserPasswordDto: ChangeUserPasswordDto,
  ) {
    try {
      const user = await this.userModel.findById(userId);
      if (!user) {
        throw new NotFoundException('User not Found');
      }
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(
        changeUserPasswordDto.password,
        salt,
      );

      await this.userModel.findByIdAndUpdate(userId, {
        $set: { password: hashedPassword },
      });

      return { message: 'Password has been successfully changed.' };
    } catch (err) {
      throw new InternalServerErrorException(
        'An error occurred when changed the user password',
      );
    }
  }

  async getClients(): Promise<User[]> {
    try {
      const clients = await this.userModel
        .find({ role: { $ne: 'admin' } })
        .select('-password -businessName -invitation_accepted')
        .populate({
          path: 'taskLists',
          model: 'TaskList',
          select: '-user_id',
          populate: {
            path: 'task_list',
            model: 'Task',
            select: '-task_files -task_comments -status',
          },
        })
        .exec();

      if (!clients) {
        throw new NotFoundException('Clients not found');
      }

      return clients;
    } catch (err) {
      throw new InternalServerErrorException(
        'An error occurred when getting the clients.',
      );
    }
  }

  async getClientsWithOpenTasks(page: number, pageSize: number) {
    try {
      const clients = await this.userModel
        .find({
          taskLists: { $ne: [] },
        })
        .select('-password -role -invitation_accepted')
        .populate({
          path: 'taskLists',
          model: 'TaskList',
          select: '-user_id',
          match: {
            task_list: { $ne: [] },
          },
          populate: {
            path: 'task_list',
            model: 'Task',
            select: '-task_files -task_comments -task_description',
            match: {
              status: 'waiting for client',
            },
          },
        })
        .exec();

      if (!clients) {
        throw new NotFoundException('Clients not found');
      }
      const total = clients.length;
      const skip = (page - 1) * pageSize;
      const clientsPerPage = await this.userModel
        .find({
          taskLists: { $ne: [] },
        })
        .select('-password -role -invitation_accepted')
        .skip(skip)
        .limit(pageSize)
        .populate({
          path: 'taskLists',
          model: 'TaskList',
          select: '-user_id',
          match: {
            task_list: { $ne: [] },
          },
          populate: {
            path: 'task_list',
            model: 'Task',
            select: '-task_files -task_comments -task_description',
            match: {
              status: 'waiting for client',
            },
          },
        })
        .exec();

      return { totalClients: total, clientsPerPage };
    } catch (err) {
      throw new InternalServerErrorException(
        'An error occurred when getting the clients.',
      );
    }
  }

  async getClientActivity(page: number, pageSize: number) {
    try {
      const activityTotal = await this.activityModel.find();
      if (!activityTotal) {
        throw new NotFoundException('Activity not found');
      }

      const total = activityTotal.length;
      const skip = (page - 1) * pageSize;
      const activity = await this.activityModel
        .find()
        .select('-taskList_id')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(pageSize)
        .populate('user_id', '-password')
        .populate('task_id')
        .populate('activity_files')
        .exec();

      return { totalActivity: total, activityPerPage: activity };
    } catch (err) {
      throw new InternalServerErrorException(
        'An error occurred when getting the clients activity.',
      );
    }
  }
}
