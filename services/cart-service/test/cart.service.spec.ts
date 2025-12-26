import { CartService } from '../src/modules/cart/cart.service';
import { CartRepository } from '../src/modules/cart/cart.repository';
import { CartItemDto } from '../src/modules/cart/dto/cart-item.dto';

describe('CartService unit', () => {
  let service: CartService;
  let repo: jest.Mocked<CartRepository>;

  beforeEach(() => {
    repo = {
      getByUserId: jest.fn(),
      upsertItem: jest.fn(),
      removeItem: jest.fn(),
    } as any;
    service = new CartService(repo);
  });

  it('delegates getCart to repository', async () => {
    await service.getCart('user-1');
    expect(repo.getByUserId).toHaveBeenCalledWith('user-1');
  });

  it('delegates upsertItem to repository', async () => {
    const dto: CartItemDto = { productId: 'p1', quantity: 2, price: 100 };
    await service.upsertItem('user-1', dto);
    expect(repo.upsertItem).toHaveBeenCalledWith('user-1', dto);
  });

  it('delegates removeItem to repository', async () => {
    await service.removeItem('user-1', 'p1');
    expect(repo.removeItem).toHaveBeenCalledWith('user-1', 'p1');
  });
});


