import {
  Controller,
  Get,
  NotFoundException,
  Param,
  Res,
  UseGuards,
} from '@nestjs/common';
import {
  ApiConflictResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { Response } from 'express';
import * as fs from 'fs';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { TasksService } from './tasks.service';

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
    if (!fs.existsSync(file.file_path)) {
      throw new NotFoundException('File not found');
    }
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
