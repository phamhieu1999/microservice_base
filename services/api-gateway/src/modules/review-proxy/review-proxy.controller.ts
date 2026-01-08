import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
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
import { ReviewProxyService } from './review-proxy.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('reviews')
@Controller()
export class ReviewProxyController {
  constructor(private readonly service: ReviewProxyService) {}

  @UseGuards(JwtAuthGuard)
  @Post('reviews')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Tạo review mới',
    description: 'Tạo một review mới cho sản phẩm. Mỗi user chỉ có thể review một sản phẩm một lần.',
  })
  @ApiBody({
    description: 'Thông tin review (productId, rating, content)',
    schema: {
      type: 'object',
      properties: {
        productId: { type: 'string', example: 'prod-001' },
        rating: { type: 'number', minimum: 1, maximum: 5, example: 4 },
        content: { type: 'string', example: 'Sản phẩm rất tốt!' },
      },
      required: ['productId', 'rating'],
    },
  })
  @ApiResponse({ status: 201, description: 'Review được tạo thành công' })
  @ApiResponse({ status: 400, description: 'Dữ liệu không hợp lệ' })
  @ApiResponse({ status: 409, description: 'User đã review sản phẩm này rồi' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 503, description: 'Review service is temporarily unavailable' })
  create(@Req() req: any, @Body() body: any) {
    const authHeader = req.headers['authorization'] as string;
    return this.service.createReview(authHeader, body);
  }

  @Get('reviews/:id')
  @ApiOperation({
    summary: 'Lấy review theo ID',
    description: 'Lấy thông tin chi tiết của một review theo ID',
  })
  @ApiParam({
    name: 'id',
    description: 'Review ID',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiResponse({ status: 200, description: 'Review được tìm thấy' })
  @ApiResponse({ status: 404, description: 'Review không tồn tại' })
  @ApiResponse({ status: 503, description: 'Review service is temporarily unavailable' })
  findById(@Param('id') id: string) {
    return this.service.getReviewById(id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('reviews/:id')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Cập nhật review',
    description: 'Cập nhật review của chính user. Chỉ có thể cập nhật review của chính mình.',
  })
  @ApiParam({
    name: 'id',
    description: 'Review ID',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiBody({
    description: 'Thông tin cập nhật (rating, content)',
    schema: {
      type: 'object',
      properties: {
        rating: { type: 'number', minimum: 1, maximum: 5, example: 5 },
        content: { type: 'string', example: 'Cập nhật: Sản phẩm tuyệt vời!' },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Review được cập nhật thành công' })
  @ApiResponse({ status: 404, description: 'Review không tồn tại hoặc không có quyền cập nhật' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 503, description: 'Review service is temporarily unavailable' })
  update(@Req() req: any, @Param('id') id: string, @Body() body: any) {
    const authHeader = req.headers['authorization'] as string;
    return this.service.updateReview(authHeader, id, body);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('reviews/:id')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Xóa review',
    description: 'Xóa review của chính user. Chỉ có thể xóa review của chính mình.',
  })
  @ApiParam({
    name: 'id',
    description: 'Review ID',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiResponse({ status: 200, description: 'Review được xóa thành công' })
  @ApiResponse({ status: 404, description: 'Review không tồn tại hoặc không có quyền xóa' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 503, description: 'Review service is temporarily unavailable' })
  delete(@Req() req: any, @Param('id') id: string) {
    const authHeader = req.headers['authorization'] as string;
    return this.service.deleteReview(authHeader, id);
  }

  @Get('products/:productId/reviews')
  @ApiOperation({
    summary: 'Lấy danh sách reviews của sản phẩm',
    description: 'Lấy danh sách tất cả reviews của một sản phẩm với phân trang và lọc',
  })
  @ApiParam({
    name: 'productId',
    description: 'Product ID',
    example: 'prod-001',
  })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number (starts from 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Number of items per page' })
  @ApiQuery({ name: 'rating', required: false, type: Number, description: 'Filter by rating (1-5)' })
  @ApiQuery({ name: 'sortBy', required: false, type: String, description: 'Sort by field (createdAt, rating, updatedAt)' })
  @ApiQuery({ name: 'sortOrder', required: false, type: String, description: 'Sort order (asc, desc)' })
  @ApiResponse({ status: 200, description: 'Danh sách reviews' })
  @ApiResponse({ status: 503, description: 'Review service is temporarily unavailable' })
  listByProduct(@Param('productId') productId: string, @Query() query: any) {
    return this.service.listByProduct(productId, query);
  }

  @Get('products/:productId/reviews/stats')
  @ApiOperation({
    summary: 'Lấy thống kê reviews của sản phẩm',
    description: 'Lấy thống kê tổng hợp về reviews của một sản phẩm (tổng số reviews, điểm trung bình, phân bố rating)',
  })
  @ApiParam({
    name: 'productId',
    description: 'Product ID',
    example: 'prod-001',
  })
  @ApiResponse({ status: 200, description: 'Thống kê reviews' })
  @ApiResponse({ status: 503, description: 'Review service is temporarily unavailable' })
  getStatsByProduct(@Param('productId') productId: string) {
    return this.service.getStatsByProduct(productId);
  }

  @Get('users/:userId/reviews')
  @ApiOperation({
    summary: 'Lấy danh sách reviews của user',
    description: 'Lấy danh sách tất cả reviews của một user với phân trang và lọc',
  })
  @ApiParam({
    name: 'userId',
    description: 'User ID',
    example: 'user-001',
  })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number (starts from 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Number of items per page' })
  @ApiQuery({ name: 'rating', required: false, type: Number, description: 'Filter by rating (1-5)' })
  @ApiQuery({ name: 'sortBy', required: false, type: String, description: 'Sort by field (createdAt, rating, updatedAt)' })
  @ApiQuery({ name: 'sortOrder', required: false, type: String, description: 'Sort order (asc, desc)' })
  @ApiResponse({ status: 200, description: 'Danh sách reviews của user' })
  @ApiResponse({ status: 503, description: 'Review service is temporarily unavailable' })
  listByUser(@Param('userId') userId: string, @Query() query: any) {
    return this.service.listByUser(userId, query);
  }

  @Get('reviews')
  @ApiOperation({
    summary: 'Lấy danh sách tất cả reviews',
    description: 'Lấy danh sách tất cả reviews với phân trang, lọc và sắp xếp',
  })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number (starts from 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Number of items per page' })
  @ApiQuery({ name: 'rating', required: false, type: Number, description: 'Filter by rating (1-5)' })
  @ApiQuery({ name: 'sortBy', required: false, type: String, description: 'Sort by field (createdAt, rating, updatedAt)' })
  @ApiQuery({ name: 'sortOrder', required: false, type: String, description: 'Sort order (asc, desc)' })
  @ApiResponse({ status: 200, description: 'Danh sách tất cả reviews' })
  @ApiResponse({ status: 503, description: 'Review service is temporarily unavailable' })
  findAll(@Query() query: any) {
    return this.service.listAll(query);
  }
}


