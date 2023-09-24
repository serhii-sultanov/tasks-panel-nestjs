import { ApiProperty } from '@nestjs/swagger';

export class Token {
  @ApiProperty()
  token: string;
}

export class Message {
  @ApiProperty()
  message: string;
}
