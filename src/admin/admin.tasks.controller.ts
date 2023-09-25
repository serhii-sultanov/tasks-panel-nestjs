import {
  Body,
  Controller,
  Post,
  Request,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiConflictResponse,
  ApiConsumes,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { CreateTaskDto } from 'src/tasks/dto/create-task.dto';
import { TasksService } from 'src/tasks/tasks.service';
import { Message } from 'src/types/type';
import { fileUploadInterceptor } from 'src/utils/fileUploadInterceptor';
import { AdminAuthGuard } from './guards/admin-auth.guard';

@Controller('admin')
@UseGuards(JwtAuthGuard)
@ApiTags('Admin Endpoints')
export class AdminTasksController {
  constructor(private readonly tasksService: TasksService) {}

  @ApiOperation({ summary: 'Create new task' })
  @ApiBearerAuth('Token')
  @ApiCreatedResponse({ description: 'Task has been succesfully created' })
  @ApiConflictResponse({
    description:
      'Current task already exists or current user does not have any rights',
  })
  @ApiUnauthorizedResponse({
    description: 'User does not have Token. User Unauthorized.',
  })
  @ApiNotFoundResponse({
    description: 'User not found.',
  })
  @Post('/create-task')
  @UseGuards(AdminAuthGuard)
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(fileUploadInterceptor)
  @UsePipes(new ValidationPipe())
  async createTask(
    @Request() req,
    @Body() createTaskDto: CreateTaskDto,
    @UploadedFiles()
    files: Express.Multer.File[],
  ): Promise<Message> {
    return this.tasksService.createTask(createTaskDto, files);
  }
}
