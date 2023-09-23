import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose from 'mongoose';
import { User } from 'src/user/schemas/user.schema';
import { BaseDocument } from 'src/utils/BaseDocument';
import { Task } from './task.schema';

@Schema({
  timestamps: true,
})
export class TaskList extends BaseDocument {
  @Prop({ required: true, type: mongoose.Schema.Types.ObjectId, ref: 'User' })
  user_id: User;

  @Prop([{ type: mongoose.Schema.Types.ObjectId, ref: 'Task' }])
  task_list: Task[];
}

export const TaskListSchema = SchemaFactory.createForClass(TaskList);
