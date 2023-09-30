import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty } from '@nestjs/swagger';
import mongoose from 'mongoose';
import { BaseDocument } from 'src/utils/BaseDocument';
import { Task } from './task.schema';

@Schema({
  timestamps: true,
})
export class File extends BaseDocument {
  @ApiProperty()
  @Prop({ default: '' })
  file_description: string;

  @ApiProperty()
  @Prop({ required: true })
  file_path: string;

  @ApiProperty()
  @Prop({ required: true })
  file_originalName: string;

  @ApiProperty()
  @Prop({ required: true })
  file_size: number;

  @ApiProperty()
  @Prop({ required: true })
  file_contentType: string;
}

export const FileSchema = SchemaFactory.createForClass(File);
