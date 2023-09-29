import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty } from '@nestjs/swagger';
import { BaseDocument } from 'src/utils/BaseDocument';

@Schema({
  timestamps: true,
})
export class TaskReminder extends BaseDocument {
  @ApiProperty()
  @Prop({ required: true })
  dayBetween: string;
}

export const TaskReminderSchema = SchemaFactory.createForClass(TaskReminder);
