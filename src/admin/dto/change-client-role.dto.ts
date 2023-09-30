import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class ChangeClientRoleDto {
  @ApiProperty()
  @IsString()
  newRole: string;
}
