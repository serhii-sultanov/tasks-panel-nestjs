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
import { UserService } from './user.service';

@ApiTags('User Endpoints & Download files')
@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @ApiOperation({ summary: 'Get client data' })
  @ApiBearerAuth('Token')
  @ApiOkResponse({
    description: 'Client account has been successfully got.',
  })
  @ApiNotFoundResponse({ description: 'Client not found' })
  @ApiUnauthorizedResponse({
    description: 'User does not have Token. User Unauthorized.',
  })
  @ApiInternalServerErrorResponse({
    description: 'An error occurred when getting the client account',
  })
  @ApiConflictResponse({ description: 'User does not have any rights.' })
  @Get('account/:userId')
  @UseGuards(JwtAuthGuard)
  getClientAccount(@Param('userId') userId: string) {
    return this.userService.getClientAccount(userId);
  }
}
