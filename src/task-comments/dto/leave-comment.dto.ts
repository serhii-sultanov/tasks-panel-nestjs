import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class LeaveCommentDto {
  @ApiProperty()
  @IsString()
  task_id: string;

  @ApiProperty()
  @IsString()
  comment: string;

  @ApiProperty()
  @IsString()
  clientId: string;
}
