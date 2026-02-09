import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { AdminProxyService } from './admin-proxy.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';

@ApiTags('admin')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
@Controller('admin')
export class AdminProxyController {
  constructor(private readonly adminService: AdminProxyService) {}

  @Get('disputes/:id')
  @ApiOperation({ summary: 'Admin get a dispute by id' })
  getDispute(@Param('id') id: string) {
    return this.adminService.getDispute(id);
  }

  @Get('disputes/user/:userId')
  @ApiOperation({ summary: 'Admin get disputes of a user' })
  getUserDisputes(@Param('userId') userId: string) {
    return this.adminService.listDisputes({ userId });
  }

  @Get('disputes')
  @ApiOperation({ summary: 'Admin list disputes with filters & paging' })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'sellerId', required: false })
  @ApiQuery({ name: 'userId', required: false })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  listDisputes(
    @Query('status') status?: string,
    @Query('sellerId') sellerId?: string,
    @Query('userId') userId?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.adminService.listDisputes({
      status,
      sellerId,
      userId,
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
    });
  }

  @Get('settlements/seller/:sellerId/summary')
  @ApiOperation({ summary: 'Admin get seller balance summary' })
  getSellerBalance(@Param('sellerId') sellerId: string) {
    return this.adminService.getSellerBalance(sellerId);
  }

  @Get('settlements/seller/:sellerId/payouts')
  @ApiOperation({ summary: 'Admin get seller payout requests' })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  getSellerPayouts(
    @Param('sellerId') sellerId: string,
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.adminService.listSellerPayouts(sellerId, {
      status,
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
    });
  }
}
