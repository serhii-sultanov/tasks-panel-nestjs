import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
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
import { TaskCommentsService } from './task-comments.service';
import { fileUploadInterceptor } from 'src/utils/fileUploadInterceptor';
import { LeaveCommentDto } from './dto/leave-comment.dto';
import { AdminAuthGuard } from 'src/admin/guards/admin-auth.guard';
import { Message } from 'src/types/type';
import { EditCommentDto } from './dto/edit-task-comment.dto';

@ApiTags('Work with Tasks Comments')
@Controller('comment')
@UseGuards(JwtAuthGuard)
export class TaskCommentsController {
  constructor(private readonly taskCommentsService: TaskCommentsService) {}

  @ApiOperation({ summary: 'Get task comments' })
  @ApiBearerAuth('Token')
  @ApiOkResponse({
    description: 'Task comments has successfully got',
  })
  @ApiNotFoundResponse({ description: 'Comments not found' })
  @ApiUnauthorizedResponse({
    description: 'User does not have Token. User Unauthorized.',
  })
  @ApiInternalServerErrorResponse({
    description: 'An error occurred when getting the comments',
  })
  @ApiConflictResponse({ description: 'User does not have any rights.' })
  @Get('task/:taskId')
  getTaskComments(@Param('taskId') taskId: string) {
    return this.taskCommentsService.getTaskComments(taskId);
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
  ) {
    return this.taskCommentsService.leaveTaskComment(
      req.user.role,
      req.user.id,
      leaveCommentDto,
      files,
    );
  }

  @ApiOperation({ summary: 'Delete task comment' })
  @ApiBearerAuth('Token')
  @ApiOkResponse({ description: 'Task has been succesfully deleted' })
  @ApiConflictResponse({
    description: 'Error when deleting the comment',
  })
  @ApiUnauthorizedResponse({
    description: 'User does not have Token. User Unauthorized.',
  })
  @ApiNotFoundResponse({
    description: 'Comment not found.',
  })
  @Delete(':taskId/:commentId')
  @UseGuards(AdminAuthGuard)
  deleteTaskComment(
    @Param('taskId') taskId: string,
    @Param('commentId') commentId: string,
  ): Promise<Message> {
    return this.taskCommentsService.deleteTaskComment(taskId, commentId);
  }

  @ApiOperation({ summary: 'Edit task comment' })
  @ApiBearerAuth('Token')
  @ApiOkResponse({ description: 'Task has been succesfully edited' })
  @ApiConflictResponse({
    description: 'Error when editing the comment',
  })
  @ApiUnauthorizedResponse({
    description: 'User does not have Token. User Unauthorized.',
  })
  @ApiNotFoundResponse({
    description: 'Comment not found.',
  })
  @Put(':taskId/:commentId')
  @UseGuards(AdminAuthGuard)
  editTaskComment(
    @Body() editCommentDto: EditCommentDto,
    @Param('taskId') taskId: string,
    @Param('commentId') commentId: string,
  ): Promise<Message> {
    return this.taskCommentsService.editTaskComment(
      taskId,
      commentId,
      editCommentDto,
    );
  }
}
