import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class EditTaskListDto {
  @ApiProperty()
  @IsString()
  newTaskListName: string;
}
