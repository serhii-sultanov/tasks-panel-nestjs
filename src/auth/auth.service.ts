import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { User } from 'src/user/schemas/user.schema';
import { UserService } from 'src/user/user.service';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
  ) {}

  async validateUser(email: string, password: string): Promise<User> {
    const user = await this.userService.findOne(email);
    if (!user) {
      throw new UnauthorizedException('User Not Found');
    }
    const passwordIsMatch = await bcrypt.compare(password, user.password);
    if (user && passwordIsMatch) {
      return user;
    }
    throw new UnauthorizedException('Incorrect User Data!');
  }

  async login(user: User): Promise<any> {
    const { id, email, firstName, role } = user;
    return {
      id,
      email,
      role,
      firstName,
      token: this.jwtService.sign({
        id: id,
        email: email,
        role: role,
        firstName: firstName,
      }),
    };
  }
}
