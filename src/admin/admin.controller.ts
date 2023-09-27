import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Put,
  Query,
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
import { AdminService } from './admin.service';
import { AdminAuthGuard } from './guards/admin-auth.guard';
import { Message } from 'src/types/type';
import { ChangeClientRoleDto } from './dto/change-client-role.dto';

@Controller('admin')
@UseGuards(JwtAuthGuard)
@ApiTags('Admin Endpoints')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

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
