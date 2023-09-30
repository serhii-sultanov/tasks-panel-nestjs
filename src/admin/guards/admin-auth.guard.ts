import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ConflictException,
} from '@nestjs/common';
import { Observable } from 'rxjs';

@Injectable()
export class AdminAuthGuard implements CanActivate {
  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const request = context.switchToHttp().getRequest();
    if (!request.user) {
      throw new ConflictException('User not found. Invalid token. Relog pls.');
    }
    if (request.user.role === 'admin') {
      return true;
    } else {
      throw new ConflictException('Access denied. User role failed.');
    }
  }
}
