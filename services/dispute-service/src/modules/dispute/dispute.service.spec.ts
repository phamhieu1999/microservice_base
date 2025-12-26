import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Dispute } from '../../database/entities/dispute.entity';
import { DisputeService } from './dispute.service';
import { KafkaService } from '../../kafka/kafka.service';

describe('DisputeService', () => {
  let service: DisputeService;
  let repo: Repository<Dispute>;
  let kafka: KafkaService;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        DisputeService,
        {
          provide: getRepositoryToken(Dispute),
          useClass: Repository,
        },
        {
          provide: KafkaService,
          useValue: { emit: jest.fn() },
        },
      ],
    }).compile();

    service = moduleRef.get(DisputeService);
    repo = moduleRef.get(getRepositoryToken(Dispute));
    kafka = moduleRef.get(KafkaService);
  });

  it('create() should save dispute and emit dispute.opened', async () => {
    const saveSpy = jest.spyOn(repo, 'save').mockResolvedValue({
      id: 'd1',
      orderId: 'o1',
      userId: 'u1',
      sellerId: 's1',
      reasonCode: 'DAMAGED',
    } as any);

    jest.spyOn(repo, 'create').mockReturnValue({} as any);

    const dto = { orderId: 'o1', userId: 'u1', sellerId: 's1', reasonCode: 'DAMAGED' };
    const result = await service.create(dto);

    expect(saveSpy).toHaveBeenCalled();
    expect(kafka.emit).toHaveBeenCalledWith('dispute.opened', {
      id: 'd1',
      orderId: 'o1',
      userId: 'u1',
      sellerId: 's1',
      reasonCode: 'DAMAGED',
    });
    expect(result.id).toBe('d1');
  });

  it('escalate() should update status and emit dispute.escalated', async () => {
    jest.spyOn(repo, 'update').mockResolvedValue({} as any);
    jest.spyOn(service, 'findById').mockResolvedValue({
      id: 'd1',
      orderId: 'o1',
      userId: 'u1',
      sellerId: 's1',
    } as any);

    await service.escalate('d1', 'u1', 'need support');

    expect(kafka.emit).toHaveBeenCalledWith('dispute.escalated', {
      id: 'd1',
      orderId: 'o1',
      userId: 'u1',
      sellerId: 's1',
    });
  });

  it('resolve() should update status and emit dispute.resolved', async () => {
    jest.spyOn(repo, 'update').mockResolvedValue({} as any);
    jest.spyOn(service, 'findById').mockResolvedValue({
      id: 'd1',
      orderId: 'o1',
      userId: 'u1',
      sellerId: 's1',
    } as any);

    await service.resolve('d1', 'admin1', 'RESOLVED', 'refund approved');

    expect(kafka.emit).toHaveBeenCalledWith('dispute.resolved', {
      id: 'd1',
      orderId: 'o1',
      userId: 'u1',
      sellerId: 's1',
      decision: 'RESOLVED',
    });
  });
});
