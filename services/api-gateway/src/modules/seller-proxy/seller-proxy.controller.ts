import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { SellerProxyService } from './seller-proxy.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('sellers')
@Controller()
export class SellerProxyController {
  constructor(private readonly service: SellerProxyService) {}

  // Seller endpoints
  @UseGuards(JwtAuthGuard)
  @Post('sellers/register')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Đăng ký trở thành seller',
    description: 'Đăng ký tài khoản seller và tạo shop đầu tiên',
  })
  @ApiBody({
    description: 'Thông tin đăng ký seller (shop name, địa chỉ, avatar)',
    schema: {
      type: 'object',
      properties: {
        shopName: { type: 'string', example: 'Tech Store', minLength: 3 },
        avatarUrl: { type: 'string', example: 'https://example.com/avatar.jpg' },
        address: { type: 'string', example: '123 Main Street, Ho Chi Minh City' },
      },
      required: ['shopName'],
    },
  })
  @ApiResponse({ status: 201, description: 'Đăng ký seller thành công' })
  @ApiResponse({ status: 400, description: 'Dữ liệu không hợp lệ' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 503, description: 'Seller service is temporarily unavailable' })
  @HttpCode(HttpStatus.CREATED)
  register(@Req() req: any, @Body() body: any) {
    const authHeader = req.headers['authorization'] as string;
    return this.service.register(authHeader, body);
  }

  @UseGuards(JwtAuthGuard)
  @Get('sellers/me')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Lấy thông tin seller hiện tại',
    description: 'Lấy thông tin seller tương ứng với user đang đăng nhập cùng với tất cả shops',
  })
  @ApiResponse({ status: 200, description: 'Thông tin seller' })
  @ApiResponse({ status: 404, description: 'Seller không tồn tại' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 503, description: 'Seller service is temporarily unavailable' })
  me(@Req() req: any) {
    const authHeader = req.headers['authorization'] as string;
    return this.service.getMe(authHeader);
  }

  @Get('sellers')
  @ApiOperation({
    summary: 'Lấy danh sách tất cả sellers',
    description: 'Lấy danh sách sellers với phân trang và lọc theo status',
  })
  @ApiQuery({ name: 'status', required: false, enum: ['PENDING', 'APPROVED', 'REJECTED'], description: 'Lọc theo status' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Số trang (mặc định: 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Số items mỗi trang (mặc định: 10)' })
  @ApiResponse({ status: 200, description: 'Danh sách sellers' })
  @ApiResponse({ status: 503, description: 'Seller service is temporarily unavailable' })
  getAllSellers(@Query() query: any) {
    return this.service.getAllSellers(query);
  }

  @Get('sellers/:id')
  @ApiOperation({
    summary: 'Lấy thông tin seller theo ID',
    description: 'Lấy thông tin chi tiết của một seller theo UUID',
  })
  @ApiParam({ name: 'id', description: 'Seller UUID', example: '123e4567-e89b-12d3-a456-426614174000' })
  @ApiResponse({ status: 200, description: 'Thông tin seller' })
  @ApiResponse({ status: 404, description: 'Seller không tồn tại' })
  @ApiResponse({ status: 503, description: 'Seller service is temporarily unavailable' })
  getSeller(@Param('id') id: string) {
    return this.service.getSellerById(id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('sellers/:id/status')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Cập nhật status seller',
    description: 'Cập nhật trạng thái phê duyệt của seller (chỉ admin)',
  })
  @ApiParam({ name: 'id', description: 'Seller UUID', example: '123e4567-e89b-12d3-a456-426614174000' })
  @ApiBody({
    description: 'Status mới',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', enum: ['PENDING', 'APPROVED', 'REJECTED'], example: 'APPROVED' },
      },
      required: ['status'],
    },
  })
  @ApiResponse({ status: 200, description: 'Cập nhật status thành công' })
  @ApiResponse({ status: 404, description: 'Seller không tồn tại' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 503, description: 'Seller service is temporarily unavailable' })
  updateSellerStatus(@Req() req: any, @Param('id') id: string, @Body() body: any) {
    const authHeader = req.headers['authorization'] as string;
    return this.service.updateSellerStatus(authHeader, id, body);
  }

  // Shop endpoints
  @UseGuards(JwtAuthGuard)
  @Post('shops')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Tạo shop mới',
    description: 'Tạo một shop mới cho seller đang đăng nhập (seller phải đã được APPROVED)',
  })
  @ApiBody({
    description: 'Thông tin shop',
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string', example: 'Fashion Boutique', minLength: 3 },
        avatarUrl: { type: 'string', example: 'https://example.com/shop-avatar.jpg' },
        address: { type: 'string', example: '456 Fashion Avenue, Hanoi' },
      },
      required: ['name'],
    },
  })
  @ApiResponse({ status: 201, description: 'Tạo shop thành công' })
  @ApiResponse({ status: 403, description: 'Seller chưa được phê duyệt hoặc không có quyền' })
  @ApiResponse({ status: 404, description: 'Seller không tồn tại' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 503, description: 'Seller service is temporarily unavailable' })
  @HttpCode(HttpStatus.CREATED)
  createShop(@Req() req: any, @Body() body: any) {
    const authHeader = req.headers['authorization'] as string;
    return this.service.createShop(authHeader, body);
  }

  @Get('shops')
  @ApiOperation({
    summary: 'Lấy danh sách tất cả shops',
    description: 'Lấy danh sách shops với phân trang và lọc theo seller',
  })
  @ApiQuery({ name: 'sellerId', required: false, type: String, description: 'Lọc theo seller ID' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Số trang (mặc định: 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Số items mỗi trang (mặc định: 10)' })
  @ApiResponse({ status: 200, description: 'Danh sách shops' })
  @ApiResponse({ status: 503, description: 'Seller service is temporarily unavailable' })
  getShops(@Query() query: any) {
    return this.service.getShops(query);
  }

  @Get('shops/:id')
  @ApiOperation({
    summary: 'Lấy thông tin shop theo ID',
    description: 'Lấy thông tin chi tiết của một shop theo UUID',
  })
  @ApiParam({ name: 'id', description: 'Shop UUID', example: '123e4567-e89b-12d3-a456-426614174001' })
  @ApiResponse({ status: 200, description: 'Thông tin shop' })
  @ApiResponse({ status: 404, description: 'Shop không tồn tại' })
  @ApiResponse({ status: 503, description: 'Seller service is temporarily unavailable' })
  getShop(@Param('id') id: string) {
    return this.service.getShopById(id);
  }

  @UseGuards(JwtAuthGuard)
  @Get('shops/me/all')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Lấy tất cả shops của seller hiện tại',
    description: 'Lấy danh sách tất cả shops thuộc về seller đang đăng nhập',
  })
  @ApiResponse({ status: 200, description: 'Danh sách shops của seller' })
  @ApiResponse({ status: 404, description: 'Seller không tồn tại' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 503, description: 'Seller service is temporarily unavailable' })
  getMyShops(@Req() req: any) {
    const authHeader = req.headers['authorization'] as string;
    return this.service.getMyShops(authHeader);
  }

  @UseGuards(JwtAuthGuard)
  @Put('shops/:id')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Cập nhật shop',
    description: 'Cập nhật thông tin shop (chỉ chủ shop mới có quyền)',
  })
  @ApiParam({ name: 'id', description: 'Shop UUID', example: '123e4567-e89b-12d3-a456-426614174001' })
  @ApiBody({
    description: 'Thông tin cập nhật',
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string', example: 'Updated Shop Name', minLength: 3 },
        avatarUrl: { type: 'string', example: 'https://example.com/new-avatar.jpg' },
        address: { type: 'string', example: '789 New Street, Da Nang' },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Cập nhật shop thành công' })
  @ApiResponse({ status: 403, description: 'Không có quyền cập nhật shop này' })
  @ApiResponse({ status: 404, description: 'Shop không tồn tại' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 503, description: 'Seller service is temporarily unavailable' })
  updateShop(@Req() req: any, @Param('id') id: string, @Body() body: any) {
    const authHeader = req.headers['authorization'] as string;
    return this.service.updateShop(authHeader, id, body);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('shops/:id')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Xóa shop',
    description: 'Xóa một shop (chỉ chủ shop mới có quyền)',
  })
  @ApiParam({ name: 'id', description: 'Shop UUID', example: '123e4567-e89b-12d3-a456-426614174001' })
  @ApiResponse({ status: 200, description: 'Xóa shop thành công' })
  @ApiResponse({ status: 403, description: 'Không có quyền xóa shop này' })
  @ApiResponse({ status: 404, description: 'Shop không tồn tại' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 503, description: 'Seller service is temporarily unavailable' })
  @HttpCode(HttpStatus.OK)
  deleteShop(@Req() req: any, @Param('id') id: string) {
    const authHeader = req.headers['authorization'] as string;
    return this.service.deleteShop(authHeader, id);
  }
}


