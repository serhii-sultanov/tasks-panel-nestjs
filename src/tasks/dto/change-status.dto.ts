import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsString } from 'class-validator';

export enum TaskStatus {
  Waiting = 'waiting for client',
  Review = 'needs review',
  Completed = 'completed',
}

export class ChangeStatusDto {
  @ApiProperty()
  @IsEnum(TaskStatus)
  status: TaskStatus;
}
