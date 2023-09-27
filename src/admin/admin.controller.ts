import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  Request,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiInternalServerErrorResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { Message } from 'src/types/type';
import { User } from 'src/user/schemas/user.schema';
import { AdminService } from './admin.service';
import { AdminRegisterUserDto } from './dto/admin-register-client.dto';
import { ChangeClientRoleDto } from './dto/change-client-role.dto';
import { AdminAuthGuard } from './guards/admin-auth.guard';

@Controller('admin')
@UseGuards(JwtAuthGuard)
@ApiTags('Admin Endpoints')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @ApiOperation({ summary: 'Registration new client' })
  @ApiBearerAuth('Token')
  @ApiCreatedResponse({
    description: 'Client has been successfully created.',
  })
  @ApiBadRequestResponse({ description: 'This email is already existed!' })
  @ApiInternalServerErrorResponse({
    description: 'An error occurred when saving the new Client.',
  })
  @Post('registration')
  @UseGuards(AdminAuthGuard)
  @UsePipes(new ValidationPipe())
  newClientRegistration(
    @Request() req,
    @Body() registerUserDto: AdminRegisterUserDto,
  ): Promise<Message> {
    return this.adminService.newClientRegistration(
      registerUserDto,
      req.user.firstName,
    );
  }

  @ApiOperation({ summary: 'Get Paginated Clients' })
  @ApiBearerAuth('Token')
  @ApiOkResponse({
    description: 'Paginated clients have been successfully got',
  })
  @ApiNotFoundResponse({ description: 'Clients not found' })
  @ApiUnauthorizedResponse({
    description: 'User does not have Token. User Unauthorized.',
  })
  @ApiConflictResponse({ description: 'User does not have any rights.' })
  @Get('users')
  @UseGuards(AdminAuthGuard)
  getPaginatedClients(
    @Query('page') page: number = 1,
    @Query('pageSize') pageSize: number = 10,
  ) {
    return this.adminService.getPaginatedClients(page, pageSize);
  }

  @ApiOperation({ summary: 'Search Users by firstName-lastName-email' })
  @ApiBearerAuth('Token')
  @ApiOkResponse({
    description: 'Users have been successfully searched',
  })
  @ApiNotFoundResponse({ description: 'Users do not exist.' })
  @ApiUnauthorizedResponse({
    description: 'User does not have Token. User Unauthorized.',
  })
  @ApiConflictResponse({ description: 'User does not have any rights.' })
  @ApiInternalServerErrorResponse({
    description: 'An error occurred when searching users.',
  })
  @Get('search')
  @UseGuards(AdminAuthGuard)
  searchUsers(@Query('q') query: string): Promise<User[]> {
    return this.adminService.searchUsers(query);
  }

  @ApiOperation({ summary: 'Delete client' })
  @ApiBearerAuth('Token')
  @ApiOkResponse({ description: 'Client has been succesfully deleted' })
  @ApiConflictResponse({
    description: 'Error when deleting the client',
  })
  @ApiUnauthorizedResponse({
    description: 'User does not have Token. User Unauthorized.',
  })
  @ApiNotFoundResponse({
    description: 'Client not found.',
  })
  @Delete('/client/:clientId')
  @UseGuards(AdminAuthGuard)
  deleteClient(@Param('clientId') clientId: string): Promise<Message> {
    return this.adminService.deleteClient(clientId);
  }

  @ApiOperation({ summary: 'Change client role' })
  @ApiBearerAuth('Token')
  @ApiOkResponse({ description: 'Client role has been succesfully changed' })
  @ApiConflictResponse({
    description: 'Error when changing the client role',
  })
  @ApiUnauthorizedResponse({
    description: 'User does not have Token. User Unauthorized.',
  })
  @ApiNotFoundResponse({
    description: 'Client not found.',
  })
  @Put('/role/:clientId')
  @UseGuards(AdminAuthGuard)
  changeClientRole(
    @Body() changeClientRoleDto: ChangeClientRoleDto,
    @Param('clientId') clientId: string,
  ): Promise<Message> {
    return this.adminService.changeClientRole(clientId, changeClientRoleDto);
  }
}
