import { OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../common/prisma/prisma.service';
export interface DemoAccountInfo {
    roleName: string;
    displayName: string;
    email: string;
    description: string;
    icon: string;
    badgeColor: string;
}
export declare class AuthService implements OnModuleInit {
    private readonly prisma;
    private readonly jwt;
    private readonly config;
    constructor(prisma: PrismaService, jwt: JwtService, config: ConfigService);
    onModuleInit(): Promise<void>;
    private seedDemoRolesAndUsers;
    getDemoAccounts(): DemoAccountInfo[];
    login(email: string, password: string): Promise<{
        accessToken: string;
        refreshToken: string;
    }>;
    refresh(refreshToken: string): Promise<{
        accessToken: string;
        refreshToken: string;
    }>;
    logout(userId: string, refreshToken: string): Promise<{
        success: boolean;
    }>;
    private issueTokens;
    private hashToken;
}
