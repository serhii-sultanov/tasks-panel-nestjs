import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiConflictResponse,
  ApiInternalServerErrorResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { TaskCommentsService } from './task-comments.service';

@ApiTags('Work with Tasks Comments')
@Controller('comment')
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
  @UseGuards(JwtAuthGuard)
  getTaskComments(@Param('taskId') taskId: string) {
    return this.taskCommentsService.getTaskComments(taskId);
  }
}
