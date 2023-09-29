import { Body, Controller, Get, Put, UseGuards } from '@nestjs/common';
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
import { AdminTaskReminderService } from './admin.task-reminder.service';
import { AdminAuthGuard } from './guards/admin-auth.guard';
import { Message } from 'src/types/type';
import { UpdateTaskReminderDto } from './dto/update-task-reminder.dto';
import { TaskReminder } from './schemas/task-reminder.schema';

@Controller('admin')
@UseGuards(JwtAuthGuard)
@ApiTags('Admin Endpoints')
export class AdminTaskReminderController {
  constructor(
    private readonly adminTaskReminderService: AdminTaskReminderService,
  ) {}

  @ApiOperation({ summary: 'Create OR Change count days between remind' })
  @ApiBearerAuth('Token')
  @ApiOkResponse({ description: 'Task days reminder updated' })
  @ApiConflictResponse({
    description: 'Error when updating the task reminder',
  })
  @ApiUnauthorizedResponse({
    description: 'User does not have Token. User Unauthorized.',
  })
  @Put('/taskReminder')
  @UseGuards(AdminAuthGuard)
  updateTaskReminder(
    @Body() updateTaskReminderDto: UpdateTaskReminderDto,
  ): Promise<Message> {
    return this.adminTaskReminderService.updateTaskReminder(
      updateTaskReminderDto,
    );
  }

  @ApiOperation({ summary: 'Get "Days" reminder' })
  @ApiBearerAuth('Token')
  @ApiOkResponse({ description: 'Task days reminder updated' })
  @ApiConflictResponse({
    description: 'Error when getting the task reminder',
  })
  @ApiUnauthorizedResponse({
    description: 'User does not have Token. User Unauthorized.',
  })
  @ApiNotFoundResponse({
    description: 'Reminder not found. You need to create new reminder.',
  })
  @Get('/taskReminder')
  @UseGuards(AdminAuthGuard)
  getTaskReminder(): Promise<TaskReminder> {
    return this.adminTaskReminderService.getTaskReminder();
  }
}
