import { Injectable, NotFoundException } from '@nestjs/common';
import { DeviceRepository } from './device.repository';

@Injectable()
export class DeviceService {
  constructor(private readonly deviceRepo: DeviceRepository) {}

  async listDevices(userId: string) {
    return this.deviceRepo.findByUserId(userId);
  }

  async revokeDevice(deviceId: string, userId: string) {
    const device = await this.deviceRepo.findById(deviceId, userId);
    if (!device) {
      throw new NotFoundException('Device not found');
    }
    await this.deviceRepo.revoke(deviceId, userId);
    return { success: true };
  }

  async renameDevice(deviceId: string, userId: string, deviceName: string) {
    const device = await this.deviceRepo.findById(deviceId, userId);
    if (!device) {
      throw new NotFoundException('Device not found');
    }
    await this.deviceRepo.rename(deviceId, userId, deviceName);
    return { success: true };
  }

  async trackDevice(
    userId: string,
    deviceId: string,
    deviceName?: string,
    userAgent?: string,
    ipAddress?: string,
  ) {
    return this.deviceRepo.findOrCreate(userId, deviceId, deviceName, userAgent, ipAddress);
  }
}

