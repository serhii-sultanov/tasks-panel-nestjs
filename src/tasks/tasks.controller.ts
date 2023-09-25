import { Controller, Get, Param, Res } from '@nestjs/common';
import {
  ApiConflictResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { Response } from 'express';
import * as fs from 'fs';
import { TasksService } from './tasks.service';

@ApiTags('Task & File manager')
@Controller('task')
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
}
