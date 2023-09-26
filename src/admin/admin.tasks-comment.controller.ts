import {
  Body,
  Controller,
  Delete,
  Param,
  Put,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiConflictResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { EditCommentDto } from 'src/task-comments/dto/edit-task-comment.dto';
import { TaskCommentsService } from 'src/task-comments/task-comments.service';
import { Message } from 'src/types/type';
import { AdminAuthGuard } from './guards/admin-auth.guard';

@Controller('admin')
@UseGuards(JwtAuthGuard)
@ApiTags('Admin Endpoints')
export class AdminTaskCommentsController {
  constructor(private readonly tasksCommentService: TaskCommentsService) {}

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
    return this.tasksCommentService.deleteTaskComment(taskId, commentId);
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
    return this.tasksCommentService.editTaskComment(
      taskId,
      commentId,
      editCommentDto,
    );
  }
}
