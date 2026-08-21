import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import type { CurrentUserPayload } from '../../common/decorators/current-user.decorator';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    getDemoAccounts(): import("./auth.service").DemoAccountInfo[];
    login(dto: LoginDto): Promise<{
        mustResetPassword: boolean;
        accessToken: string;
        refreshToken: string;
    }>;
    register(dto: RegisterDto): Promise<{
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
    changePassword(user: CurrentUserPayload, dto: {
        newPassword: string;
    }): Promise<{
        success: boolean;
        message: string;
    }>;
}
