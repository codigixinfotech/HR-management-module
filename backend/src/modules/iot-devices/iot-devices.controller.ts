import { Controller, Get } from '@nestjs/common';
import { IotDevicesService } from './iot-devices.service';
import { Permissions } from '../../common/decorators/permissions.decorator';

@Controller('iot-devices')
export class IotDevicesController {
  constructor(private readonly iotDevicesService: IotDevicesService) {}

  @Get('status')
  @Permissions('iot_devices.read')
  getStatus() {
    return this.iotDevicesService.getStatus();
  }
}
