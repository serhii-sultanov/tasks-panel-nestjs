import { Controller, Post } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';

@Controller()
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}
}
