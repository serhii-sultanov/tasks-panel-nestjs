import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class ChangeUserPasswordDto {
  @ApiProperty()
  @IsString()
  @MinLength(6, { message: 'Password must be more than 6 symbols!' })
  password: string;
}
