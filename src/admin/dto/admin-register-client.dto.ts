import { Optional } from '@nestjs/common';
import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsString, MinLength } from 'class-validator';

export enum ClientRole {
  Admin = 'admin',
  Client = 'client',
}

export class AdminRegisterUserDto {
  @ApiProperty()
  @IsEmail()
  email: string;

  @ApiProperty()
  @IsString()
  @MinLength(6, { message: 'Password must be more than 6 symbols!' })
  password: string;

  @ApiProperty()
  @IsEnum(ClientRole)
  @IsString()
  role: ClientRole;
}
