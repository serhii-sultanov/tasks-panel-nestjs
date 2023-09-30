import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class CreateTaskDto {
  @ApiProperty()
  @IsString()
  task_title: string;

  @ApiProperty()
  user_id: string;

  @ApiProperty()
  task_description: string;

  @ApiProperty()
  task_list_name: string;
}
