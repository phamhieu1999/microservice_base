import { Controller, Get, Param, Patch, Post, Body, Query, UseGuards, Req } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { ProductProxyService } from './product-proxy.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { Public } from '../auth/public.decorator';

@ApiTags('products')
@Controller('products')
export class ProductProxyController {
  constructor(private readonly service: ProductProxyService) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Post()
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Tạo sản phẩm mới (Admin/Seller)' })
  @ApiBody({
    description: 'Thông tin sản phẩm, sẽ được gắn sellerId theo user đăng nhập',
    examples: {
      example1: {
        summary: 'Tạo sản phẩm đầy đủ thông tin',
        value: {
          name: 'iPhone 15 Pro',
          description: 'Latest iPhone with A17 Pro chip, 256GB storage',
          price: 999.99,
          stock: 100,
          category: 'Electronics',
          brand: 'Apple',
        },
      },
      example2: {
        summary: 'Tạo sản phẩm tối thiểu (chỉ name, price, stock)',
        value: {
          name: 'Laptop Dell XPS 15',
          price: 1299.99,
          stock: 50,
        },
      },
      example3: {
        summary: 'Tạo sản phẩm với category và brand',
        value: {
          name: 'Samsung Galaxy S24 Ultra',
          description: 'Flagship smartphone with 200MP camera',
          price: 1199.99,
          stock: 75,
          category: 'Smartphones',
          brand: 'Samsung',
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Sản phẩm được tạo thành công',
    schema: {
      example: {
        id: '507f1f77bcf86cd799439011',
        name: 'iPhone 15 Pro',
        description: 'Latest iPhone with A17 Pro chip, 256GB storage',
        price: 999.99,
        stock: 100,
        category: 'Electronics',
        brand: 'Apple',
        sellerId: '123e4567-e89b-12d3-a456-426614174000',
        createdAt: '2024-01-15T10:30:00.000Z',
        updatedAt: '2024-01-15T10:30:00.000Z',
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Chưa đăng nhập hoặc token không hợp lệ',
    schema: {
      example: {
        statusCode: 401,
        message: 'Unauthorized',
      },
    },
  })
  @ApiResponse({
    status: 403,
    description: 'Không có quyền (cần role ADMIN)',
    schema: {
      example: {
        statusCode: 403,
        message: 'Forbidden resource',
      },
    },
  })
  create(@Body() body: any, @Req() req: any) {
    const user = req.user;
    // tạm thời map sellerId = userId để hỗ trợ multi-seller cơ bản
    body.sellerId = user.userId;
    return this.service.forwardCreate(body);
  }

  @Public()
  @UseGuards(JwtAuthGuard)
  @Get()
  @ApiOperation({ summary: 'Danh sách sản phẩm, có thể filter theo q (Public - không cần authentication)' })
  @ApiQuery({ name: 'q', required: false, description: 'Từ khoá tìm kiếm', example: 'iPhone' })
  @ApiResponse({
    status: 200,
    description: 'Danh sách sản phẩm',
    schema: {
      example: [
        {
          id: '507f1f77bcf86cd799439011',
          name: 'iPhone 15 Pro',
          description: 'Latest iPhone with A17 Pro chip',
          price: 999.99,
          stock: 100,
          category: 'Electronics',
          brand: 'Apple',
          sellerId: '123e4567-e89b-12d3-a456-426614174000',
        },
        {
          id: '507f1f77bcf86cd799439012',
          name: 'Samsung Galaxy S24 Ultra',
          description: 'Flagship smartphone with 200MP camera',
          price: 1199.99,
          stock: 75,
          category: 'Smartphones',
          brand: 'Samsung',
          sellerId: '123e4567-e89b-12d3-a456-426614174001',
        },
      ],
    },
  })
  findAll(@Query('q') q?: string) {
    return this.service.forwardFindAll(q);
  }

  @Public()
  @UseGuards(JwtAuthGuard)
  @Get(':id')
  @ApiOperation({ summary: 'Lấy chi tiết sản phẩm (Public - không cần authentication)' })
  @ApiParam({ name: 'id', description: 'ID sản phẩm', example: '507f1f77bcf86cd799439011' })
  @ApiResponse({
    status: 200,
    description: 'Chi tiết sản phẩm',
    schema: {
      example: {
        id: '507f1f77bcf86cd799439011',
        name: 'iPhone 15 Pro',
        description: 'Latest iPhone with A17 Pro chip, 256GB storage',
        price: 999.99,
        stock: 100,
        category: 'Electronics',
        brand: 'Apple',
        sellerId: '123e4567-e89b-12d3-a456-426614174000',
        createdAt: '2024-01-15T10:30:00.000Z',
        updatedAt: '2024-01-15T10:30:00.000Z',
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Không tìm thấy sản phẩm',
    schema: {
      example: {
        statusCode: 404,
        message: 'Product not found',
      },
    },
  })
  findOne(@Param('id') id: string) {
    return this.service.forwardFindOne(id);
  }

  @Public()
  @UseGuards(JwtAuthGuard)
  @Post('batch')
  @ApiOperation({ summary: 'Lấy thông tin nhiều sản phẩm theo danh sách ID (Public - không cần authentication)' })
  @ApiBody({
    description: 'Danh sách ID sản phẩm cần lấy (tối đa 50 sản phẩm)',
    examples: {
      example1: {
        summary: 'Lấy 3 sản phẩm',
        value: {
          ids: [
            '507f1f77bcf86cd799439011',
            '507f1f77bcf86cd799439012',
            '507f1f77bcf86cd799439013',
          ],
        },
      },
      example2: {
        summary: 'Lấy 1 sản phẩm',
        value: {
          ids: ['507f1f77bcf86cd799439011'],
        },
      },
    },
    schema: {
      type: 'object',
      properties: {
        ids: {
          type: 'array',
          items: { type: 'string' },
          description: 'Mảng ID sản phẩm (tối đa 50)',
          minItems: 1,
          maxItems: 50,
        },
      },
      required: ['ids'],
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Danh sách sản phẩm',
    schema: {
      example: [
        {
          id: '507f1f77bcf86cd799439011',
          name: 'iPhone 15 Pro',
          price: 999.99,
          stock: 100,
        },
        {
          id: '507f1f77bcf86cd799439012',
          name: 'Samsung Galaxy S24 Ultra',
          price: 1199.99,
          stock: 75,
        },
      ],
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Request không hợp lệ',
    schema: {
      example: {
        statusCode: 400,
        message: 'ids array is required',
      },
    },
  })
  async getProductsBatch(@Body() body: { ids: string[] }) {
    // Fetch multiple products in parallel
    // This reduces the number of HTTP requests when frontend needs multiple products
    if (!body.ids || !Array.isArray(body.ids) || body.ids.length === 0) {
      throw new Error('ids array is required');
    }
    if (body.ids.length > 50) {
      throw new Error('Maximum 50 products per batch request');
    }
    return this.service.forwardBatch(body.ids);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Patch(':id')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Cập nhật sản phẩm (chỉ cập nhật các field được gửi)' })
  @ApiParam({ name: 'id', description: 'ID sản phẩm cần cập nhật', example: '507f1f77bcf86cd799439011' })
  @ApiBody({
    description: 'Thông tin sản phẩm cần cập nhật (tất cả các field đều optional)',
    examples: {
      example1: {
        summary: 'Cập nhật giá và số lượng',
        value: {
          price: 899.99,
          stock: 80,
        },
      },
      example2: {
        summary: 'Cập nhật mô tả',
        value: {
          description: 'Updated description with new features',
        },
      },
      example3: {
        summary: 'Cập nhật nhiều field',
        value: {
          name: 'iPhone 15 Pro Max',
          price: 1099.99,
          stock: 120,
          description: 'Latest iPhone with improved camera system',
          category: 'Electronics',
          brand: 'Apple',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Sản phẩm được cập nhật thành công',
    schema: {
      example: {
        id: '507f1f77bcf86cd799439011',
        name: 'iPhone 15 Pro Max',
        description: 'Latest iPhone with improved camera system',
        price: 1099.99,
        stock: 120,
        category: 'Electronics',
        brand: 'Apple',
        sellerId: '123e4567-e89b-12d3-a456-426614174000',
        updatedAt: '2024-01-15T11:00:00.000Z',
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Chưa đăng nhập hoặc token không hợp lệ',
    schema: {
      example: {
        statusCode: 401,
        message: 'Unauthorized',
      },
    },
  })
  @ApiResponse({
    status: 403,
    description: 'Không có quyền (cần role ADMIN)',
    schema: {
      example: {
        statusCode: 403,
        message: 'Forbidden resource',
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Không tìm thấy sản phẩm',
    schema: {
      example: {
        statusCode: 404,
        message: 'Product not found',
      },
    },
  })
  update(@Param('id') id: string, @Body() body: any) {
    return this.service.forwardUpdate(id, body);
  }
}


