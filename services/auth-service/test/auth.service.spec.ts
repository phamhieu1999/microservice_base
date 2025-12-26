import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from '../src/modules/auth/auth.service';
import { AuthRepository } from '../src/modules/auth/auth.repository';
import { JwtService } from '@nestjs/jwt';
import { KafkaService } from '../src/kafka/kafka.service';
import { RefreshTokenRepository } from '../src/modules/auth/refresh-token.repository';
import { LoginAttemptRepository } from '../src/modules/auth/login-attempt.repository';
import { DeviceService } from '../src/modules/auth/device/device.service';
import * as bcrypt from 'bcrypt';

jest.mock('bcrypt');

describe('AuthService', () => {
  let service: AuthService;
  let repo: jest.Mocked<AuthRepository>;
  let jwtService: jest.Mocked<JwtService>;
  let kafka: jest.Mocked<KafkaService>;
  let refreshTokenRepo: jest.Mocked<RefreshTokenRepository>;
  let loginAttemptRepo: jest.Mocked<LoginAttemptRepository>;
  let deviceService: jest.Mocked<DeviceService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: AuthRepository,
          useValue: {
            findByEmail: jest.fn(),
            createUser: jest.fn(),
            isAccountLocked: jest.fn(),
            lockAccount: jest.fn(),
            unlockAccount: jest.fn(),
          },
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn(),
            verify: jest.fn(),
          },
        },
        {
          provide: KafkaService,
          useValue: {
            emit: jest.fn(),
          },
        },
        {
          provide: RefreshTokenRepository,
          useValue: {
            createAndSave: jest.fn(),
            validateToken: jest.fn(),
            revokeToken: jest.fn(),
          },
        },
        {
          provide: LoginAttemptRepository,
          useValue: {
            create: jest.fn(),
            countRecentFailedAttempts: jest.fn(),
            clearFailedAttempts: jest.fn(),
          },
        },
        {
          provide: DeviceService,
          useValue: {
            trackDevice: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    repo = module.get(AuthRepository);
    jwtService = module.get(JwtService);
    kafka = module.get(KafkaService);
    refreshTokenRepo = module.get(RefreshTokenRepository);
    loginAttemptRepo = module.get(LoginAttemptRepository);
    deviceService = module.get(DeviceService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('login', () => {
    it('should login successfully', async () => {
      const user = {
        id: 'user-123',
        email: 'test@example.com',
        passwordHash: 'hashed-password',
        role: 'USER',
      };

      repo.isAccountLocked.mockResolvedValue(false);
      repo.findByEmail.mockResolvedValue(user as any);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      loginAttemptRepo.clearFailedAttempts.mockResolvedValue(undefined);
      loginAttemptRepo.create.mockResolvedValue({} as any);
      deviceService.trackDevice.mockResolvedValue({} as any);
      jwtService.sign.mockReturnValue('token');
      refreshTokenRepo.createAndSave.mockResolvedValue(undefined);

      const result = await service.login(
        { email: 'test@example.com', password: 'password' },
        '127.0.0.1',
        'device-123',
        'user-agent',
      );

      expect(repo.isAccountLocked).toHaveBeenCalledWith('test@example.com');
      expect(repo.findByEmail).toHaveBeenCalledWith('test@example.com');
      expect(bcrypt.compare).toHaveBeenCalledWith('password', 'hashed-password');
      expect(loginAttemptRepo.clearFailedAttempts).toHaveBeenCalled();
      expect(deviceService.trackDevice).toHaveBeenCalled();
      expect(result.user).toBeDefined();
      expect(result.accessToken).toBe('token');
    });

    it('should throw error if account is locked', async () => {
      repo.isAccountLocked.mockResolvedValue(true);

      await expect(
        service.login({ email: 'test@example.com', password: 'password' }),
      ).rejects.toThrow('Account is locked');
    });

    it('should lock account after 5 failed attempts', async () => {
      repo.isAccountLocked.mockResolvedValue(false);
      repo.findByEmail.mockResolvedValue({
        id: 'user-123',
        email: 'test@example.com',
        passwordHash: 'hashed-password',
      } as any);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);
      loginAttemptRepo.create.mockResolvedValue({} as any);
      loginAttemptRepo.countRecentFailedAttempts.mockResolvedValue(4); // 4 previous + 1 current = 5
      repo.lockAccount.mockResolvedValue(undefined);

      await expect(
        service.login({ email: 'test@example.com', password: 'wrong' }),
      ).rejects.toThrow('Account locked');

      expect(repo.lockAccount).toHaveBeenCalledWith('test@example.com', 30);
    });
  });

  describe('register', () => {
    it('should register new user', async () => {
      repo.findByEmail.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-password');
      repo.createUser.mockResolvedValue({
        id: 'user-123',
        email: 'test@example.com',
        role: 'USER',
        createdAt: new Date(),
      } as any);
      kafka.emit.mockResolvedValue(undefined);
      jwtService.sign.mockReturnValue('token');
      refreshTokenRepo.createAndSave.mockResolvedValue(undefined);

      const result = await service.register({
        email: 'test@example.com',
        password: 'password',
      });

      expect(repo.findByEmail).toHaveBeenCalledWith('test@example.com');
      expect(bcrypt.hash).toHaveBeenCalledWith('password', 10);
      expect(repo.createUser).toHaveBeenCalled();
      expect(kafka.emit).toHaveBeenCalled();
      expect(result.user).toBeDefined();
      expect(result.accessToken).toBe('token');
    });

    it('should throw error if email already exists', async () => {
      repo.findByEmail.mockResolvedValue({
        id: 'user-123',
        email: 'test@example.com',
      } as any);

      await expect(
        service.register({ email: 'test@example.com', password: 'password' }),
      ).rejects.toThrow('Email already in use');
    });
  });
});

