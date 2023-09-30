import {
  Body,
  Controller,
  Get,
  Post,
  Request,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiInternalServerErrorResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { Token } from 'src/types/type';
import { UserService } from 'src/user/user.service';
import { AuthService } from './auth.service';
import { LoginUserDto } from './dto/login-user.dto';
import { RegisterUserDto } from './dto/register-user.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { LocalAuthGuard } from './guards/local-auth.guard';

@ApiTags('User Authorization')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly userService: UserService,
  ) {}

  @ApiOperation({ summary: 'Registration' })
  @ApiCreatedResponse({
    description: 'User has been successfully created.',
  })
  @ApiBadRequestResponse({ description: 'This email is already existed!' })
  @ApiInternalServerErrorResponse({
    description: 'An error occurred when saving the new User.',
  })
  @Post('registration')
  @UsePipes(new ValidationPipe())
  registration(@Body() registerUserDto: RegisterUserDto): Promise<Token> {
    return this.userService.registration(registerUserDto);
  }

  @ApiOperation({ summary: 'User Login' })
  @ApiUnauthorizedResponse({ description: 'Incorrect Email or Password.' })
  @ApiNotFoundResponse({ description: 'User not found' })
  @Post('login')
  @UseGuards(LocalAuthGuard)
  async login(
    @Request() req,
    @Body() loginUserDto: LoginUserDto,
  ): Promise<any> {
    return this.authService.login(req.user);
  }

  @ApiOperation({ description: 'Get User Profile' })
  @ApiBearerAuth('Token')
  @ApiOkResponse({
    description: 'Profile has been successfully got.',
  })
  @ApiUnauthorizedResponse({
    description: 'Need User Token for Getting User Profile',
  })
  @Get('profile')
  @UseGuards(JwtAuthGuard)
  getProfile(@Request() req) {
    return req.user;
  }
}
