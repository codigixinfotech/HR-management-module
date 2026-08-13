import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import type { CurrentUserPayload } from '../../common/decorators/current-user.decorator';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    getDemoAccounts(): import("./auth.service").DemoAccountInfo[];
    login(dto: LoginDto): Promise<{
        accessToken: string;
        refreshToken: string;
    }>;
    refresh(dto: RefreshTokenDto): Promise<{
        accessToken: string;
        refreshToken: string;
    }>;
    logout(user: CurrentUserPayload, dto: RefreshTokenDto): Promise<{
        success: boolean;
    }>;
    me(user: CurrentUserPayload): CurrentUserPayload;
}
