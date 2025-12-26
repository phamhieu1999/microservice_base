import { Body, Controller, Delete, Get, Param, Patch, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { DeviceService } from './device.service';
import { RenameDeviceDto } from './dto/rename-device.dto';

@Controller('auth/devices')
@UseGuards(AuthGuard('jwt'))
export class DeviceController {
  constructor(private readonly deviceService: DeviceService) {}

  @Get()
  listDevices(@Req() req: any) {
    const userId = req.user.sub;
    return this.deviceService.listDevices(userId);
  }

  @Delete(':id')
  revokeDevice(@Param('id') id: string, @Req() req: any) {
    const userId = req.user.sub;
    return this.deviceService.revokeDevice(id, userId);
  }

  @Patch(':id/rename')
  renameDevice(@Param('id') id: string, @Body() dto: RenameDeviceDto, @Req() req: any) {
    const userId = req.user.sub;
    return this.deviceService.renameDevice(id, userId, dto.deviceName);
  }
}

