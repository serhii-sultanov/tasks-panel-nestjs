import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { User } from 'src/user/schemas/user.schema';
import { UserService } from 'src/user/user.service';
import * as bcrypt from 'bcryptjs';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
  ) {}

  async validateUser(email: string, password: string): Promise<User> {
    const user = await this.userService.findOne(email);
    if (!user) {
      throw new NotFoundException('User Not Found');
    }
    const passwordIsMatch = await bcrypt.compare(password, user.password);
    if (user && passwordIsMatch) {
      const updatedUser = await this.userModel.findByIdAndUpdate(
        user._id,
        { $set: { invitation_accepted: true } },
        { new: true },
      );
      return updatedUser;
    }
    throw new UnauthorizedException('Incorrect User Data!');
  }

  async login(user: User): Promise<any> {
    const {
      id,
      email,
      firstName,
      role,
      lastName,
      businessName,
      clientBackground,
    } = user;
    return {
      id,
      email,
      role,
      firstName,
      lastName,
      businessName,
      clientBackground,
      token: this.jwtService.sign({
        id: id,
        email: email,
        role: role,
        firstName: firstName,
        lastName,
        businessName,
        clientBackground,
      }),
    };
  }
}
