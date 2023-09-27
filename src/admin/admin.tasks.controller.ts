import {
  Body,
  Controller,
  Param,
  Post,
  Put,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
  Request,
  UsePipes,
  ValidationPipe,
  Delete,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiConflictResponse,
  ApiConsumes,
  ApiCreatedResponse,
  ApiInternalServerErrorResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { ChangeStatusDto } from 'src/tasks/dto/change-status.dto';
import { CreateTaskDto } from 'src/tasks/dto/create-task.dto';
import { EditTaskDto } from 'src/tasks/dto/edit-task.dto';
import { EditTaskListDto } from 'src/tasks/dto/edit-taskList.dto';
import { TasksService } from 'src/tasks/tasks.service';
import { Message } from 'src/types/type';
import { fileUploadInterceptor } from 'src/utils/fileUploadInterceptor';
import { AdminAuthGuard } from './guards/admin-auth.guard';
import { DeleteTaskListDto } from './dto/delete-tasklist.dto';
import { AdminService } from './admin.service';

@Controller('admin')
@UseGuards(JwtAuthGuard)
@ApiTags('Admin Endpoints')
export class AdminTasksController {
  constructor(
    private readonly tasksService: TasksService,
    private readonly adminService: AdminService,
  ) {}

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
    return this.tasksService.createTask(
      createTaskDto,
      files,
      req.user.firstName,
    );
  }

  @ApiOperation({ summary: 'Change task status' })
  @ApiBearerAuth('Token')
  @ApiOkResponse({
    description: 'Task status has successfully changed',
  })
  @ApiNotFoundResponse({ description: 'Task not found' })
  @ApiUnauthorizedResponse({
    description: 'User does not have Token. User Unauthorized.',
  })
  @ApiInternalServerErrorResponse({
    description: 'An error occurred when changing task status ',
  })
  @ApiConflictResponse({ description: 'User does not have any rights.' })
  @Put('status/:taskId')
  @UseGuards(AdminAuthGuard)
  @UsePipes(new ValidationPipe())
  changeTaskStatus(
    @Request() req,
    @Body() changeStatusDto: ChangeStatusDto,
    @Param('taskId') taskId: string,
  ) {
    return this.tasksService.changeTaskStatus(
      taskId,
      changeStatusDto,
      req.user.firstName,
    );
  }

  @ApiOperation({ summary: 'Edit task list name' })
  @ApiBearerAuth('Token')
  @ApiOkResponse({
    description: 'Task list name has successfully edited',
  })
  @ApiUnauthorizedResponse({
    description: 'User does not have Token. User Unauthorized.',
  })
  @ApiInternalServerErrorResponse({
    description: 'An error occurred when editig task list name',
  })
  @ApiConflictResponse({ description: 'User does not have any rights.' })
  @Put('taskList/:taskListId')
  @UseGuards(AdminAuthGuard)
  @UsePipes(new ValidationPipe())
  editTaskList(
    @Body() editTaskListDto: EditTaskListDto,
    @Param('taskListId') taskListId: string,
  ) {
    return this.tasksService.editTaskList(taskListId, editTaskListDto);
  }

  @ApiOperation({ summary: 'Edit task title & description' })
  @ApiBearerAuth('Token')
  @ApiOkResponse({
    description: 'Task title & description has successfully edited',
  })
  @ApiNotFoundResponse({ description: 'Task not found' })
  @ApiUnauthorizedResponse({
    description: 'User does not have Token. User Unauthorized.',
  })
  @ApiInternalServerErrorResponse({
    description: 'An error occurred when editig task title & description',
  })
  @ApiConflictResponse({ description: 'User does not have any rights.' })
  @Put('edit/:taskId')
  @UseGuards(AdminAuthGuard)
  @UsePipes(new ValidationPipe())
  editTask(@Body() editTaskDto: EditTaskDto, @Param('taskId') taskId: string) {
    return this.tasksService.editTask(taskId, editTaskDto);
  }

  @ApiOperation({ summary: 'Delete task list' })
  @ApiBearerAuth('Token')
  @ApiOkResponse({ description: 'Task list has been succesfully deleted' })
  @ApiConflictResponse({
    description: 'Error when deleting the task list',
  })
  @ApiUnauthorizedResponse({
    description: 'User does not have Token. User Unauthorized.',
  })
  @ApiNotFoundResponse({
    description: 'Client or task list not found.',
  })
  @Delete('/taskList/:taskListId')
  @UseGuards(AdminAuthGuard)
  deleteTaskList(
    @Body() deleteTaskListDto: DeleteTaskListDto,
    @Param('taskListId') taskListId: string,
  ): Promise<Message> {
    return this.adminService.deleteTaskList(taskListId, deleteTaskListDto);
  }
}
