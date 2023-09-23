import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty } from '@nestjs/swagger';
import mongoose from 'mongoose';
import { BaseDocument } from 'src/utils/BaseDocument';

@Schema({
  timestamps: true,
})
export class Task extends BaseDocument {
  @ApiProperty({ example: 'Some task title', description: 'Task title' })
  @Prop({ required: true })
  task_title: string;

  @ApiProperty({ example: 'Little task desc', description: 'Task description' })
  @Prop()
  task_description: string;

  @ApiProperty({ example: true, description: 'Is task open' })
  @Prop({ default: true })
  isOpen: boolean;

  @ApiProperty({ example: [1, 2, 3], description: 'Array of file IDs' })
  @Prop([{ type: mongoose.Schema.Types.ObjectId, ref: 'File' }])
  task_files: mongoose.Schema.Types.ObjectId[];

  @ApiProperty({ description: 'Array of task comments' })
  @Prop([
    {
      _id: { type: Number, autoIncrement: true },
      comment: String,
      createdAt: { type: Date, default: Date.now },
      updatedAt: { type: Date, default: Date.now },
      file_id: { type: mongoose.Schema.Types.ObjectId, ref: 'File' },
    },
  ])
  task_comments: {
    _id: number;
    comment: string;
    createdAt: Date;
    updatedAt: Date;
    file_id: mongoose.Schema.Types.ObjectId;
  }[];
}

export const TaskSchema = SchemaFactory.createForClass(Task);
