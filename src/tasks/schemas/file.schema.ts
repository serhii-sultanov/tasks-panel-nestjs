import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { BaseDocument } from 'src/utils/BaseDocument';

@Schema({
  timestamps: true,
})
export class File extends BaseDocument {
  @Prop({ required: true, unique: true })
  file_id: string;

  @Prop()
  file_description: string;

  @Prop({ required: true })
  file_path: string;
}

export const FileSchema = SchemaFactory.createForClass(File);
