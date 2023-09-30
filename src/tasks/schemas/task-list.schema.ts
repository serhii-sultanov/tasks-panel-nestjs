import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose from 'mongoose';
import { User } from 'src/user/schemas/user.schema';
import { BaseDocument } from 'src/utils/BaseDocument';
import { Task } from './task.schema';
import { ApiProperty } from '@nestjs/swagger';

@Schema({
  timestamps: true,
})
export class TaskList extends BaseDocument {
  @ApiProperty()
  @Prop({ required: true, type: mongoose.Schema.Types.ObjectId, ref: 'User' })
  user_id: User;

  @ApiProperty()
  @Prop({ required: true })
  task_list_name: string;

  @ApiProperty()
  @Prop([{ type: mongoose.Schema.Types.ObjectId, ref: 'Task' }])
  task_list: Task[];
}

export const TaskListSchema = SchemaFactory.createForClass(TaskList);
