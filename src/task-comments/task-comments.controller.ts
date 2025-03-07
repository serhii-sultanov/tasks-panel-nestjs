import {
  Body,
  Controller,
  Get,
  Param,
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
  ApiInternalServerErrorResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { fileUploadInterceptor } from 'src/utils/fileUploadInterceptor';
import { LeaveCommentDto } from './dto/leave-comment.dto';
import { TaskCommentsService } from './task-comments.service';
import { Task } from 'src/tasks/schemas/task.schema';
import { Message } from 'src/types/type';

@ApiTags('Work with Tasks Comments')
@Controller('comment')
@UseGuards(JwtAuthGuard)
export class TaskCommentsController {
  constructor(private readonly taskCommentsService: TaskCommentsService) {}

  @ApiOperation({ summary: 'Get task' })
  @ApiBearerAuth('Token')
  @ApiOkResponse({
    description: 'Task has successfully got',
  })
  @ApiNotFoundResponse({ description: 'Task not found' })
  @ApiUnauthorizedResponse({
    description: 'User does not have Token. User Unauthorized.',
  })
  @ApiInternalServerErrorResponse({
    description: 'An error occurred when getting the comments',
  })
  @ApiConflictResponse({ description: 'User does not have any rights.' })
  @Get('task/:taskId')
  getTask(@Param('taskId') taskId: string): Promise<Task> {
    return this.taskCommentsService.getTask(taskId);
  }

  @ApiOperation({ summary: 'Leave comment' })
  @ApiBearerAuth('Token')
  @ApiOkResponse({
    description: 'Comment has successfully left',
  })
  @ApiNotFoundResponse({ description: 'Task or User not found' })
  @ApiUnauthorizedResponse({
    description: 'User does not have Token. User Unauthorized.',
  })
  @ApiInternalServerErrorResponse({
    description: 'An error occurred when leaving the comment',
  })
  @ApiConflictResponse({ description: 'User does not have any rights.' })
  @Post('task')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(fileUploadInterceptor)
  @UsePipes(new ValidationPipe())
  leaveTaskComment(
    @Request() req,
    @Body() leaveCommentDto: LeaveCommentDto,
    @UploadedFiles()
    files: Express.Multer.File[],
  ): Promise<Message> {
    return this.taskCommentsService.leaveTaskComment(
      req.user.role,
      req.user.id,
      leaveCommentDto,
      files,
      req.user.firstName,
    );
  }
}
