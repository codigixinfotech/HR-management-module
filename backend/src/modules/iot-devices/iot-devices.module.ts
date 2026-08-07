import { Module } from '@nestjs/common';
import { IotDevicesController } from './iot-devices.controller';
import { IotDevicesService } from './iot-devices.service';

@Module({
  controllers: [IotDevicesController],
  providers: [IotDevicesService],
})
export class IotDevicesModule {}
