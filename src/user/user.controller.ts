import {
  Body,
  Controller,
  Get,
  Param,
  Put,
  Request,
  UseGuards,
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

import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { UpdateClientDataDto } from './dto/update-client.dto';
import { UserService } from './user.service';
import { ChangeUserPasswordDto } from './dto/change-client-password.dto';

@ApiTags('User Endpoints')
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

  @ApiOperation({ summary: 'Update client personal data' })
  @ApiBearerAuth('Token')
  @ApiOkResponse({
    description: 'Client personal data has been successfully updated.',
  })
  @ApiNotFoundResponse({ description: 'Client not found' })
  @ApiUnauthorizedResponse({
    description: 'User does not have Token. User Unauthorized.',
  })
  @ApiInternalServerErrorResponse({
    description: 'An error occurred when updating the client personal data',
  })
  @ApiConflictResponse({ description: 'User does not have any rights.' })
  @Put('account/:userId')
  @UseGuards(JwtAuthGuard)
  updateClientData(
    @Body() updateClientDataDto: UpdateClientDataDto,
    @Param('userId') userId: string,
  ) {
    return this.userService.updateClientData(userId, updateClientDataDto);
  }

  @ApiOperation({ summary: 'Change Password' })
  @ApiBearerAuth('Token')
  @ApiOkResponse({
    description: 'User has been successfully changed password.',
  })
  @ApiNotFoundResponse({ description: 'User not found' })
  @ApiUnauthorizedResponse({
    description: 'User does not have Token. User Unauthorized.',
  })
  @ApiInternalServerErrorResponse({
    description: 'An error occurred when changed the user password',
  })
  @ApiConflictResponse({ description: 'User does not have any rights.' })
  @Put('password')
  @UseGuards(JwtAuthGuard)
  changeUserPassword(
    @Request() req,
    @Body() changeUserPasswordDto: ChangeUserPasswordDto,
  ) {
    return this.userService.changeUserPassword(
      req.user.id,
      changeUserPasswordDto,
    );
  }
}
