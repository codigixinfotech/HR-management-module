import { IotDevicesService } from './iot-devices.service';
export declare class IotDevicesController {
    private readonly iotDevicesService;
    constructor(iotDevicesService: IotDevicesService);
    getStatus(): {
        module: string;
        status: string;
        message: string;
    };
}
