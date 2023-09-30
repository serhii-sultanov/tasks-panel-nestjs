import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty } from '@nestjs/swagger';
import mongoose from 'mongoose';
import { TaskList } from 'src/tasks/schemas/task-list.schema';
import { Task } from 'src/tasks/schemas/task.schema';
import { User } from 'src/user/schemas/user.schema';
import { BaseDocument } from 'src/utils/BaseDocument';

@Schema({
  timestamps: true,
})
export class Activity extends BaseDocument {
  @ApiProperty()
  @Prop({ required: true, type: mongoose.Schema.Types.ObjectId, ref: 'User' })
  user_id: User;

  @ApiProperty()
  @Prop({ required: true, type: mongoose.Schema.Types.ObjectId, ref: 'Task' })
  task_id: Task;

  @ApiProperty()
  @Prop({ type: mongoose.Schema.Types.ObjectId })
  activity_comment: mongoose.Schema.Types.ObjectId;

  @ApiProperty()
  @Prop({
    required: true,
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TaskList',
  })
  taskList_id: TaskList;

  @ApiProperty()
  @Prop({ default: '' })
  activity_message: string;

  @ApiProperty({ example: [1, 2, 3], description: 'Array of file IDs' })
  @Prop([{ type: mongoose.Schema.Types.ObjectId, ref: 'File' }])
  activity_files: mongoose.Schema.Types.ObjectId[];
}

export const ActivitySchema = SchemaFactory.createForClass(Activity);
