import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AuthProxyService } from './auth-proxy.service';
import { ProxyLoginUseCase } from '../../application/auth/use-cases/proxy-login.usecase';
import { ProxyRefreshUseCase } from '../../application/auth/use-cases/proxy-refresh.usecase';
import { ProxyLogoutUseCase } from '../../application/auth/use-cases/proxy-logout.usecase';
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('auth')
@Controller('auth')
export class AuthProxyController {
  constructor(
    private readonly service: AuthProxyService,
    private readonly proxyLogin: ProxyLoginUseCase,
    private readonly proxyRefresh: ProxyRefreshUseCase,
    private readonly proxyLogout: ProxyLogoutUseCase,
  ) {}

  @Post('register')
  @Throttle({ default: { limit: 5, ttl: 60 } })
  @ApiOperation({ summary: 'Đăng ký tài khoản mới' })
  @ApiBody({ 
    description: 'Thông tin đăng ký user (chỉ cần email và password). Field username sẽ bị bỏ qua nếu có.',
    examples: {
      example1: {
        summary: 'Đăng ký với email',
        value: {
          email: 'user@example.com',
          password: 'StrongPassword123!',
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Đăng ký thành công',
    schema: {
      example: {
        user: {
          id: '123e4567-e89b-12d3-a456-426614174000',
          email: 'user@example.com',
          role: 'USER',
        },
        accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjNlNDU2Ny1lODliLTEyZDMtYTQ1Ni00MjY2MTQxNzQwMDAiLCJlbWFpbCI6InVzZXJAZXhhbXBsZS5jb20iLCJyb2xlIjoiVVNFUiIsImlhdCI6MTcwNTMyNDIwMCwiZXhwIjoxNzA1MzI1MTAwfQ.example',
        refreshToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjNlNDU2Ny1lODliLTEyZDMtYTQ1Ni00MjY2MTQxNzQwMDAiLCJlbWFpbCI6InVzZXJAZXhhbXBsZS5jb20iLCJyb2xlIjoiVVNFUiIsImp0aSI6IjEyM2U0NTY3LWU4OWItMTJkMy1hNDU2LTQyNjYxNDE3NDAwMCIsImlhdCI6MTcwNTMyNDIwMCwiZXhwIjoxNzA1OTI5MDAwfQ.example',
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Dữ liệu không hợp lệ',
    schema: {
      example: {
        statusCode: 400,
        message: ['email must be an email', 'password must be longer than or equal to 8 characters'],
        error: 'Bad Request',
      },
    },
  })
  @ApiResponse({
    status: 409,
    description: 'Email đã được sử dụng',
    schema: {
      example: {
        statusCode: 409,
        message: 'Email already in use',
        error: 'Conflict',
      },
    },
  })
  register(@Body() body: any) {
    return this.service.forwardRegister(body);
  }

  @Post('login')
  @Throttle({ default: { limit: 5, ttl: 60 } })
  @ApiOperation({ summary: 'Đăng nhập, nhận access token/refresh token' })
  @ApiBody({ 
    description: 'Thông tin đăng nhập (email/username, mật khẩu)',
    examples: {
      example1: {
        summary: 'Đăng nhập với email',
        value: {
          email: 'user@example.com',
          password: 'StrongPassword123!',
        },
      },
      example2: {
        summary: 'Đăng nhập với username',
        value: {
          username: 'username',
          password: 'StrongPassword123!',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Đăng nhập thành công',
    schema: {
      example: {
        accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjNlNDU2Ny1lODliLTEyZDMtYTQ1Ni00MjY2MTQxNzQwMDAiLCJlbWFpbCI6InVzZXJAZXhhbXBsZS5jb20iLCJyb2xlIjoiVVNFUiIsImlhdCI6MTcwNTMyNDIwMCwiZXhwIjoxNzA1MzI1MTAwfQ.example',
        refreshToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjNlNDU2Ny1lODliLTEyZDMtYTQ1Ni00MjY2MTQxNzQwMDAiLCJlbWFpbCI6InVzZXJAZXhhbXBsZS5jb20iLCJyb2xlIjoiVVNFUiIsImp0aSI6IjEyM2U0NTY3LWU4OWItMTJkMy1hNDU2LTQyNjYxNDE3NDAwMCIsImlhdCI6MTcwNTMyNDIwMCwiZXhwIjoxNzA1OTI5MDAwfQ.example',
        user: {
          id: '123e4567-e89b-12d3-a456-426614174000',
          email: 'user@example.com',
          username: 'username',
          role: 'USER',
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Thông tin đăng nhập không đúng',
    schema: {
      example: {
        statusCode: 401,
        message: 'Invalid credentials',
        error: 'Unauthorized',
      },
    },
  })
  @ApiResponse({
    status: 403,
    description: 'Tài khoản bị khóa do đăng nhập sai quá nhiều lần',
    schema: {
      example: {
        statusCode: 403,
        message: 'Account is locked. Please try again later.',
        error: 'Forbidden',
      },
    },
  })
  login(@Body() body: any) {
    return this.proxyLogin.execute(body);
  }

  @Post('refresh')
  @Throttle({ default: { limit: 10, ttl: 60 } })
  @ApiOperation({ summary: 'Làm mới access token bằng refresh token' })
  @ApiBody({ 
    description: 'Payload chứa refresh token',
    examples: {
      example1: {
        summary: 'Refresh token',
        value: {
          refreshToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjNlNDU2Ny1lODliLTEyZDMtYTQ1Ni00MjY2MTQxNzQwMDAiLCJlbWFpbCI6InVzZXJAZXhhbXBsZS5jb20iLCJyb2xlIjoiVVNFUiIsImp0aSI6IjEyM2U0NTY3LWU4OWItMTJkMy1hNDU2LTQyNjYxNDE3NDAwMCIsImlhdCI6MTcwNTMyNDIwMCwiZXhwIjoxNzA1OTI5MDAwfQ.example',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Token được làm mới thành công',
    schema: {
      example: {
        accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjNlNDU2Ny1lODliLTEyZDMtYTQ1Ni00MjY2MTQxNzQwMDAiLCJlbWFpbCI6InVzZXJAZXhhbXBsZS5jb20iLCJyb2xlIjoiVVNFUiIsImlhdCI6MTcwNTMyNDIwMCwiZXhwIjoxNzA1MzI1MTAwfQ.new_token',
        refreshToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjNlNDU2Ny1lODliLTEyZDMtYTQ1Ni00MjY2MTQxNzQwMDAiLCJlbWFpbCI6InVzZXJAZXhhbXBsZS5jb20iLCJyb2xlIjoiVVNFUiIsImp0aSI6IjEyM2U0NTY3LWU4OWItMTJkMy1hNDU2LTQyNjYxNDE3NDAwMCIsImlhdCI6MTcwNTMyNDIwMCwiZXhwIjoxNzA1OTI5MDAwfQ.new_refresh_token',
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Refresh token không hợp lệ hoặc đã hết hạn',
    schema: {
      example: {
        statusCode: 401,
        message: 'Invalid or expired refresh token',
        error: 'Unauthorized',
      },
    },
  })
  refresh(@Body() body: any) {
    return this.proxyRefresh.execute(body);
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Đăng xuất, revoke token hiện tại' })
  @ApiResponse({
    status: 200,
    description: 'Đăng xuất thành công',
    schema: {
      example: {
        message: 'Logged out successfully',
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Token không hợp lệ hoặc thiếu token',
    schema: {
      example: {
        statusCode: 401,
        message: 'Unauthorized',
        error: 'Unauthorized',
      },
    },
  })
  logout(@Req() req: any) {
    const authHeader = req.headers['authorization'] as string;
    return this.proxyLogout.execute(authHeader);
  }
}


