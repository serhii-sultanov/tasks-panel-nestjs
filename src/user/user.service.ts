import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
//   import { instanceToPlain } from 'class-transformer';
import { InjectModel } from '@nestjs/mongoose';
import * as bcrypt from 'bcryptjs';
import { Model } from 'mongoose';
import { RegisterUserDto } from 'src/auth/dto/register-user.dto';
import { Token } from 'src/types/type';
import { User } from './schemas/user.schema';

@Injectable()
export class UserService {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
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
      console.log(err);
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
}
