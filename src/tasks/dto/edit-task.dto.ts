import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class EditTaskDto {
  @ApiProperty()
  @IsString()
  newTitle: string;

  @ApiProperty()
  @IsString()
  newDescription: string;
}
