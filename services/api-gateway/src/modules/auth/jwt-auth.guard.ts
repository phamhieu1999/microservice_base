import { ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { IS_PUBLIC_KEY } from './public.decorator';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    // Check if route is marked as public
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    
    if (isPublic) {
      // For public routes, skip authentication entirely
      return true;
    }
    
    // For protected routes, proceed with authentication
    return super.canActivate(context);
  }

  handleRequest(err: any, user: any, info: any, context: ExecutionContext) {
    // Check if route is marked as public
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    
    // If route is public, allow access even with invalid token or no token
    if (isPublic) {
      // Return undefined user for public routes (no authentication required)
      // Don't throw error even if token is invalid
      return undefined;
    }
    
    // For protected routes, throw HTTP 401 nếu auth fail
    if (err || !user) {
      // Nếu Passport đã trả về HttpException thì dùng lại, còn không thì wrap thành UnauthorizedException
      if (err instanceof Error) {
        // Nếu đã là UnauthorizedException thì ném lại
        if (err.name === 'UnauthorizedException') {
          throw err;
        }
        throw new UnauthorizedException(err.message || 'Unauthorized');
      }
      throw new UnauthorizedException('Unauthorized');
    }
    
    return user;
  }
}


