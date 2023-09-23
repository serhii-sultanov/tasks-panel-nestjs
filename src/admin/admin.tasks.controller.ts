import {
  Body,
  ConflictException,
  Controller,
  Post,
  Request,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiConflictResponse,
  ApiConsumes,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { CreateTaskDto } from 'src/tasks/dto/create-task.dto';
import { TasksService } from 'src/tasks/tasks.service';
import { AdminAuthGuard } from './guards/admin-auth.guard';

@Controller('admin')
@UseGuards(JwtAuthGuard)
@ApiTags('Admin Endpoints')
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
  @Post('/create-task')
  @UseGuards(AdminAuthGuard)
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FilesInterceptor('files', 10, {
      storage: diskStorage({
        destination: './src/fileUploads',
        filename: (req, file, callback) => {
          const uniqueSuffix =
            Date.now() + '-' + Math.round(Math.random() * 1e9);
          const fileExtension = extname(file.originalname).toLowerCase();
          const newFileName =
            file.fieldname + '-' + uniqueSuffix + fileExtension;
          callback(null, newFileName);
        },
      }),
      fileFilter: (req, file, callback) => {
        const allowedMimeTypes = [
          'application/pdf',
          'text/csv',
          'application/vnd.ms-excel',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'image/png',
          'image/jpeg',
          'image/jpg',
          'application/zip',
        ];
        if (allowedMimeTypes.includes(file.mimetype)) {
          callback(null, true);
        } else {
          callback(
            new ConflictException(
              'Invalid file format. Please load only this format file: (png | jpg | pdf | zip | csv | xls | xlsx | jpeg)',
            ),
            false,
          );
        }
      },
    }),
  )
  @UsePipes(new ValidationPipe())
  async createTask(
    @Request() req,
    @Body() createTaskDto: CreateTaskDto,
    @UploadedFiles()
    files: Express.Multer.File[],
  ): Promise<any> {
    console.log(files);
    return this.tasksService.createTask(createTaskDto);
  }
}
