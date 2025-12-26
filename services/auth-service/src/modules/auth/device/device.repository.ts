import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserDevice } from '../../../database/entities/user-device.entity';

@Injectable()
export class DeviceRepository {
  constructor(
    @InjectRepository(UserDevice)
    private readonly repo: Repository<UserDevice>,
  ) {}

  async create(data: Partial<UserDevice>): Promise<UserDevice> {
    const device = this.repo.create(data);
    return this.repo.save(device);
  }

  async findByUserId(userId: string): Promise<UserDevice[]> {
    return this.repo.find({
      where: { userId },
      order: { lastLoginAt: 'DESC' },
    });
  }

  async findById(id: string, userId: string): Promise<UserDevice | null> {
    return this.repo.findOne({ where: { id, userId } });
  }

  async updateLastLogin(deviceId: string) {
    await this.repo.update(deviceId, { lastLoginAt: new Date() });
  }

  async revoke(deviceId: string, userId: string) {
    await this.repo.update({ id: deviceId, userId }, { isActive: false });
  }

  async rename(deviceId: string, userId: string, deviceName: string) {
    await this.repo.update({ id: deviceId, userId }, { deviceName });
  }

  async findOrCreate(
    userId: string,
    deviceId: string,
    deviceName?: string,
    userAgent?: string,
    ipAddress?: string,
  ): Promise<UserDevice> {
    let device = await this.repo.findOne({ where: { userId, deviceId } });

    if (!device) {
      device = await this.create({
        userId,
        deviceId,
        deviceName: deviceName || 'Unknown Device',
        userAgent,
        ipAddress,
        isActive: true,
        lastLoginAt: new Date(),
      });
    } else {
      await this.repo.update(device.id, {
        lastLoginAt: new Date(),
        isActive: true,
      });
    }

    return device;
  }
}

