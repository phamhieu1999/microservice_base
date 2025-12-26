import { ReviewService } from '../src/modules/review/review.service';
import { ReviewRepository } from '../src/modules/review/review.repository';
import { CreateReviewDto } from '../src/modules/review/dto/create-review.dto';

describe('ReviewService unit', () => {
  let service: ReviewService;
  let repo: jest.Mocked<ReviewRepository>;

  beforeEach(() => {
    repo = {
      create: jest.fn(),
      findByProduct: jest.fn(),
    } as any;
    service = new ReviewService(repo);
  });

  it('creates review via repository', async () => {
    const dto: CreateReviewDto = { productId: 'p1', rating: 5, content: 'ok' };
    await service.create('user-1', dto);
    expect(repo.create).toHaveBeenCalledWith('user-1', dto);
  });

  it('lists reviews via repository', async () => {
    await service.listByProduct('p1');
    expect(repo.findByProduct).toHaveBeenCalledWith('p1');
  });
});


