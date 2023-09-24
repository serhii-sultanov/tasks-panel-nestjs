import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { BaseDocument } from 'src/utils/BaseDocument';

@Schema({
  timestamps: true,
})
export class File extends BaseDocument {
  @Prop({ default: '' })
  file_description: string;

  @Prop({ required: true })
  file_path: string;

  @Prop({ required: true })
  file_originalName: string;

  @Prop({ required: true })
  file_size: number;
}

export const FileSchema = SchemaFactory.createForClass(File);
