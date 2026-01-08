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
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiBody,
  ApiQuery,
} from '@nestjs/swagger';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';
import { ReviewResponseDto } from './dto/review-response.dto';
import { ReviewStatsDto } from './dto/review-stats.dto';
import { QueryReviewsDto } from './dto/query-reviews.dto';
import { ReviewService } from './review.service';

@ApiTags('reviews')
@Controller()
export class ReviewController {
  constructor(private readonly service: ReviewService) {}

  @Post('reviews')
  @ApiOperation({
    summary: 'Tạo review mới',
    description: 'Tạo một review mới cho sản phẩm. Mỗi user chỉ có thể review một sản phẩm một lần.',
  })
  @ApiBearerAuth('JWT-auth')
  @ApiBody({ type: CreateReviewDto })
  @ApiResponse({
    status: 201,
    description: 'Review được tạo thành công',
    type: ReviewResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Dữ liệu không hợp lệ' })
  @ApiResponse({ status: 409, description: 'User đã review sản phẩm này rồi' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  create(@Req() req: any, @Body() dto: CreateReviewDto) {
    const userId = req.user?.userId || req.user?.sub || 'mock-user';
    return this.service.create(userId, dto);
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
  @ApiResponse({
    status: 200,
    description: 'Review được tìm thấy',
    type: ReviewResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Review không tồn tại' })
  findById(@Param('id') id: string) {
    return this.service.findById(id);
  }

  @Patch('reviews/:id')
  @ApiOperation({
    summary: 'Cập nhật review',
    description: 'Cập nhật review của chính user. Chỉ có thể cập nhật review của chính mình.',
  })
  @ApiBearerAuth('JWT-auth')
  @ApiParam({
    name: 'id',
    description: 'Review ID',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiBody({ type: UpdateReviewDto })
  @ApiResponse({
    status: 200,
    description: 'Review được cập nhật thành công',
    type: ReviewResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Review không tồn tại hoặc không có quyền cập nhật' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  update(@Req() req: any, @Param('id') id: string, @Body() dto: UpdateReviewDto) {
    const userId = req.user?.userId || req.user?.sub || 'mock-user';
    return this.service.update(id, userId, dto);
  }

  @Delete('reviews/:id')
  @ApiOperation({
    summary: 'Xóa review',
    description: 'Xóa review của chính user. Chỉ có thể xóa review của chính mình.',
  })
  @ApiBearerAuth('JWT-auth')
  @ApiParam({
    name: 'id',
    description: 'Review ID',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiResponse({
    status: 200,
    description: 'Review được xóa thành công',
    type: ReviewResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Review không tồn tại hoặc không có quyền xóa' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  delete(@Req() req: any, @Param('id') id: string) {
    const userId = req.user?.userId || req.user?.sub || 'mock-user';
    return this.service.delete(id, userId);
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
  @ApiQuery({ type: QueryReviewsDto })
  @ApiResponse({
    status: 200,
    description: 'Danh sách reviews',
    schema: {
      type: 'object',
      properties: {
        data: {
          type: 'array',
          items: { $ref: '#/components/schemas/ReviewResponseDto' },
        },
        pagination: {
          type: 'object',
          properties: {
            page: { type: 'number' },
            limit: { type: 'number' },
            total: { type: 'number' },
            totalPages: { type: 'number' },
          },
        },
      },
    },
  })
  listByProduct(@Param('productId') productId: string, @Query() query: QueryReviewsDto) {
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
  @ApiResponse({
    status: 200,
    description: 'Thống kê reviews',
    type: ReviewStatsDto,
  })
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
  @ApiQuery({ type: QueryReviewsDto })
  @ApiResponse({
    status: 200,
    description: 'Danh sách reviews của user',
    schema: {
      type: 'object',
      properties: {
        data: {
          type: 'array',
          items: { $ref: '#/components/schemas/ReviewResponseDto' },
        },
        pagination: {
          type: 'object',
          properties: {
            page: { type: 'number' },
            limit: { type: 'number' },
            total: { type: 'number' },
            totalPages: { type: 'number' },
          },
        },
      },
    },
  })
  listByUser(@Param('userId') userId: string, @Query() query: QueryReviewsDto) {
    return this.service.listByUser(userId, query);
  }

  @Get('reviews')
  @ApiOperation({
    summary: 'Lấy danh sách tất cả reviews',
    description: 'Lấy danh sách tất cả reviews với phân trang, lọc và sắp xếp',
  })
  @ApiQuery({ type: QueryReviewsDto })
  @ApiResponse({
    status: 200,
    description: 'Danh sách tất cả reviews',
    schema: {
      type: 'object',
      properties: {
        data: {
          type: 'array',
          items: { $ref: '#/components/schemas/ReviewResponseDto' },
        },
        pagination: {
          type: 'object',
          properties: {
            page: { type: 'number' },
            limit: { type: 'number' },
            total: { type: 'number' },
            totalPages: { type: 'number' },
          },
        },
      },
    },
  })
  findAll(@Query() query: QueryReviewsDto) {
    return this.service.findAll(query);
  }
}


