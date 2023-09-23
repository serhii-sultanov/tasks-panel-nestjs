import {
  Controller,
  Post,
  UseGuards,
  UsePipes,
  ValidationPipe,
  Request,
  Body,
  ConflictException,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { CreateTaskDto } from 'src/tasks/dto/create-task.dto';
import { TasksService } from 'src/tasks/tasks.service';

@ApiTags('Admin Endpoints')
@Controller('admin')
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
  @Post('product/create')
  @UseGuards(JwtAuthGuard)
  @UsePipes(new ValidationPipe())
  createProduct(
    @Request() req,
    @Body() createTaskDto: CreateTaskDto,
  ): Promise<any> {
    if (req.user.role === 'admin') {
      return;
      //   return this.tasksService.createTask(createTaskDto);
    } else {
      throw new ConflictException('Current user does not have any rights');
    }
  }
}
