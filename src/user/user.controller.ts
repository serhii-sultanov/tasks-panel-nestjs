import { Controller } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { UserService } from './user.service';

@ApiTags('User Endpoints')
@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}
  // @ApiOperation({ summary: 'Get User Profile' })
  // @ApiBearerAuth('Token')
  // @ApiOkResponse({ description: 'User Profile has been got.', type: User })
  // @ApiNotFoundResponse({ description: 'User is not found.' })
  // @ApiUnauthorizedResponse({
  //   description: 'User does not have Token. User Unauthorized.',
  // })
  // @ApiConflictResponse({
  //   description: 'Current user does not have any rights.',
  // })
  // @Get('/account')
  // @UseGuards(JwtAuthGuard)
  // getUserData(@Request() req): Promise<User> {
  //   if (req.user.role) {
  //     return this.userService.getUserData(req.user.id);
  //   } else {
  //     throw new ConflictException('Current user does not have any rights');
  //   }
  // }
}
