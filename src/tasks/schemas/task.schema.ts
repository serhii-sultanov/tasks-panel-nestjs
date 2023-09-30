import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty } from '@nestjs/swagger';
import mongoose from 'mongoose';
import { User } from 'src/user/schemas/user.schema';
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

  @ApiProperty({ example: [1, 2, 3], description: 'Array of file IDs' })
  @Prop([{ type: mongoose.Schema.Types.ObjectId, ref: 'File' }])
  task_files: mongoose.Schema.Types.ObjectId[];

  @ApiProperty({ description: 'Array of task comments' })
  @Prop([
    {
      _id: false,
      id: { type: mongoose.Schema.Types.ObjectId, required: true, auto: true },
      user_id: {
        required: true,
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
      comment: String,
      isSystem: { type: Boolean, default: false },
      createdAt: { type: Date, default: Date.now },
      updatedAt: { type: Date, default: Date.now },
      files_id: [{ type: mongoose.Schema.Types.ObjectId, ref: 'File' }],
    },
  ])
  task_comments: {
    id: mongoose.Schema.Types.ObjectId;
    user_id: User;
    comment: string;
    isSystem: boolean;
    createdAt: Date;
    updatedAt: Date;
    files_id: mongoose.Schema.Types.ObjectId[];
  }[];

  @ApiProperty({
    example: ['waiting for client', 'needs review', 'needs review'],
    description: 'Task status',
  })
  @Prop({
    type: String,
    enum: ['waiting for client', 'needs review', 'needs review'],
    default: 'waiting for client',
  })
  status: string;
}

export const TaskSchema = SchemaFactory.createForClass(Task);
