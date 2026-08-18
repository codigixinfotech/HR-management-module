import { TransfersService } from './transfers.service';
export declare class TransfersController {
    private readonly transfersService;
    constructor(transfersService: TransfersService);
    list(): Promise<any[]>;
    findOne(id: string): Promise<any>;
    create(dto: any): Promise<any>;
    update(id: string, dto: any): Promise<any>;
    approve(id: string, body: any): Promise<any>;
    reject(id: string, body: any): Promise<any>;
    effective(id: string): Promise<any>;
    cancel(id: string): Promise<any>;
}
