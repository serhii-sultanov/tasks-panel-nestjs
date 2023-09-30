import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class UpdateTaskReminderDto {
  @ApiProperty()
  @IsOptional()
  @IsString()
  reminderId: string;

  @ApiProperty()
  @IsString()
  dayBetween: string;
}
