import {
  Body,
  Controller,
  Get,
  Param,
  Put,
  Request,
  Res,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
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
import { Response } from 'express';
import * as fs from 'fs';
import { AdminAuthGuard } from 'src/admin/guards/admin-auth.guard';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { TasksService } from './tasks.service';
import { ChangeStatusDto } from './dto/change-status.dto';

@ApiTags('Task & File manager')
@Controller('task')
@UseGuards(JwtAuthGuard)
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @ApiOperation({ summary: 'Download File' })
  @ApiOkResponse({
    status: 200,
    description: 'File has been successfully updated.',
  })
  @ApiConflictResponse({
    description: 'Error when loading file',
  })
  @ApiNotFoundResponse({
    description: 'File not found.',
  })
  @Get('download/:fileId')
  async downloadFile(
    @Param('fileId') fileId: string,
    @Res() res: Response,
  ): Promise<void> {
    const file = await this.tasksService.downloadFile(fileId);
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=${file.file_originalName}`,
    );
    res.setHeader(
      'Content-Type',
      file.file_contentType || 'application/octet-stream',
    );
    fs.createReadStream(file.file_path).pipe(res);
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
  @Put('/:taskId')
  @UseGuards(AdminAuthGuard)
  @UsePipes(new ValidationPipe())
  changeTaskStatus(
    @Request() req,
    @Body() changeStatusDto: ChangeStatusDto,
    @Param('taskId') taskId: string,
  ) {
    return this.tasksService.changeTaskStatus(taskId, changeStatusDto);
  }
}
