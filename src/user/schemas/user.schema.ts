import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty } from '@nestjs/swagger';
import { Exclude } from 'class-transformer';
import mongoose from 'mongoose';
import { TaskList } from 'src/tasks/schemas/task-list.schema';
import { BaseDocument } from 'src/utils/BaseDocument';

@Schema({
  timestamps: true,
})
export class User extends BaseDocument {
  @ApiProperty({ example: 'Max', description: 'User name' })
  @Prop({ default: '' })
  firstName: string;

  @ApiProperty({ example: 'Smith', description: 'Last name' })
  @Prop({ default: '' })
  lastName: string;

  @ApiProperty({ example: 'BusinessShark', description: 'Business name' })
  @Prop({ default: '' })
  businessName: string;

  @ApiProperty({ example: 'max@gmail.com', description: 'User Email' })
  @Prop({ unique: true, required: true })
  email: string;

  @ApiProperty({ example: 'example54321', description: 'User Password' })
  @Prop({ required: true })
  @Exclude()
  password: string;

  @ApiProperty()
  @Prop({ default: 'user' })
  role: string;

  @Prop([{ type: mongoose.Schema.Types.ObjectId, ref: 'TaskList' }])
  taskLists: TaskList[];

  @ApiProperty()
  @Prop({ default: false })
  invitation_accepted: boolean;
}

export const UserSchema = SchemaFactory.createForClass(User);
