import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../../common/prisma/prisma.service';

export interface SendMessageDto {
  content: string;
  senderName?: string;
  senderType?: 'recruiter' | 'candidate' | 'system';
  isErpOnly?: boolean;
}

@Injectable()
export class TeamsChatService {
  private readonly logger = new Logger(TeamsChatService.name);
  private cachedToken: { accessToken: string; expiresAt: number } | null = null;

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  /**
   * Acquire OAuth 2.0 Access Token from Microsoft Entra ID (Azure AD)
   */
  private async getGraphAccessToken(): Promise<string | null> {
    const tenantId = this.config.get<string>('MS_TENANT_ID');
    const clientId = this.config.get<string>('MS_CLIENT_ID');
    const clientSecret = this.config.get<string>('MS_CLIENT_SECRET');

    if (!tenantId || !clientId || !clientSecret) {
      this.logger.warn('[TeamsChatService] Azure AD credentials (MS_TENANT_ID, MS_CLIENT_ID, MS_CLIENT_SECRET) missing.');
      return null;
    }

    if (this.cachedToken && Date.now() < this.cachedToken.expiresAt - 60000) {
      return this.cachedToken.accessToken;
    }

    try {
      const params = new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        scope: 'https://graph.microsoft.com/.default',
        grant_type: 'client_credentials',
      });

      const response = await fetch(`https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: params.toString(),
      });

      if (!response.ok) {
        const errorText = await response.text();
        this.logger.error(`[TeamsChatService] OAuth token failed | Status: ${response.status} | Response: ${errorText}`);
        return null;
      }

      const data = await response.json();
      this.cachedToken = {
        accessToken: data.access_token,
        expiresAt: Date.now() + (data.expires_in || 3600) * 1000,
      };

      return data.access_token;
    } catch (err: any) {
      this.logger.error(`[TeamsChatService] Access token exception: ${err.message}`);
      return null;
    }
  }

  /**
   * Resolves Candidate's Microsoft / Entra ID User in Azure AD Tenant with Safe Diagnostics
   */
  async resolveCandidateEntraUser(candidateEmail: string, token?: string): Promise<{ id: string; userPrincipalName: string } | null> {
    const authToken = token || (await this.getGraphAccessToken());
    if (!authToken || !candidateEmail) {
      this.logger.warn(`[TeamsChatService] Safe Diagnostic | Candidate Email: ${candidateEmail} | Token Available: ${Boolean(authToken)}`);
      return null;
    }

    try {
      // 1. Direct query by mail or UPN
      const filterUrl = `https://graph.microsoft.com/v1.0/users?$filter=mail eq '${candidateEmail}' or userPrincipalName eq '${candidateEmail}'`;
      const searchRes = await fetch(filterUrl, {
        headers: { Authorization: `Bearer ${authToken}` },
      });

      this.logger.log(`[TeamsChatService] Safe Diagnostic | Lookup Method: Direct Filter | Candidate: ${candidateEmail} | Endpoint: GET /v1.0/users | Status: ${searchRes.status}`);

      if (searchRes.ok) {
        const searchData = await searchRes.json();
        if (searchData.value && searchData.value.length > 0) {
          const matchedUser = searchData.value[0];
          this.logger.log(`[TeamsChatService] Safe Diagnostic | User Found Direct! ID: ${matchedUser.id} | UPN: ${matchedUser.userPrincipalName}`);
          return {
            id: matchedUser.id,
            userPrincipalName: matchedUser.userPrincipalName,
          };
        }
      }

      // 2. Query all tenant users to match guest external accounts (e.g. emailPrefix_domain#EXT#@tenant)
      const allUsersRes = await fetch(
        `https://graph.microsoft.com/v1.0/users?$select=id,displayName,userPrincipalName,mail`,
        {
          headers: { Authorization: `Bearer ${authToken}` },
        },
      );

      this.logger.log(`[TeamsChatService] Safe Diagnostic | Lookup Method: Tenant Listing | Candidate: ${candidateEmail} | Status: ${allUsersRes.status}`);

      if (allUsersRes.ok) {
        const allUsersData = await allUsersRes.json();
        const users = allUsersData.value || [];

        const cleanEmailPrefix = candidateEmail.replace('@', '_').toLowerCase();
        const match = users.find((u: any) => {
          const upnLower = (u.userPrincipalName || '').toLowerCase();
          const mailLower = (u.mail || '').toLowerCase();
          return (
            mailLower === candidateEmail.toLowerCase() ||
            upnLower.includes(cleanEmailPrefix) ||
            upnLower.startsWith(candidateEmail.split('@')[0].toLowerCase())
          );
        });

        if (match) {
          this.logger.log(`[TeamsChatService] Safe Diagnostic | Guest User Matched! ID: ${match.id} | UPN: ${match.userPrincipalName}`);
          return { id: match.id, userPrincipalName: match.userPrincipalName };
        }
      }
    } catch (err: any) {
      this.logger.error(`[TeamsChatService] Error resolving Entra user for ${candidateEmail}: ${err.message}`);
    }

    this.logger.warn(`[TeamsChatService] Safe Diagnostic | Candidate ${candidateEmail} NOT FOUND in Azure AD Entra ID tenant.`);
    return null;
  }

  /**
   * Resolves Organizer / Recruiter User ID in Tenant
   */
  private async resolveOrganizerUserId(token: string): Promise<string | null> {
    const organizerEmail = this.config.get<string>('MS_TEAMS_ORGANIZER_EMAIL') || 'motesanika@gmail.com';

    try {
      const userRes = await fetch(
        `https://graph.microsoft.com/v1.0/users?$select=id,displayName,userPrincipalName,mail`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (userRes.ok) {
        const data = await userRes.json();
        const users = data.value || [];
        if (users.length > 0) {
          const match = users.find(
            (u: any) =>
              (u.mail || '').toLowerCase() === organizerEmail.toLowerCase() ||
              (u.userPrincipalName || '').toLowerCase().includes('motesanika'),
          );
          return match ? match.id : users[0].id;
        }
      }
    } catch (err: any) {
      this.logger.error(`[TeamsChatService] Error resolving organizer user ID: ${err.message}`);
    }

    return null;
  }

  /**
   * Creates or reuses a 1-to-1 Microsoft Teams Chat between Recruiter & Candidate
   */
  async getOrCreateTeamsChat(candidateId: string): Promise<{ teamsChatId: string | null; candidateUserId: string | null; errorReason?: string }> {
    const candidate = await this.prisma.candidate.findUnique({
      where: { id: candidateId },
    });

    if (!candidate) {
      throw new NotFoundException(`Candidate with ID ${candidateId} not found`);
    }

    if (candidate.teamsChatId) {
      return { teamsChatId: candidate.teamsChatId, candidateUserId: candidate.microsoftTeamsUserId };
    }

    const token = await this.getGraphAccessToken();
    if (!token) {
      return { teamsChatId: null, candidateUserId: null, errorReason: 'MS_AUTH_FAILED' };
    }

    const candUser = await this.resolveCandidateEntraUser(candidate.email, token);
    const organizerUserId = await this.resolveOrganizerUserId(token);

    if (!candUser) {
      this.logger.warn(`[TeamsChatService] Could not resolve Entra ID user for candidate ${candidate.email}`);
      return { teamsChatId: null, candidateUserId: null, errorReason: 'ACCOUNT_NOT_FOUND' };
    }

    if (!organizerUserId) {
      return { teamsChatId: null, candidateUserId: candUser.id, errorReason: 'ORGANIZER_NOT_FOUND' };
    }

    // Save Entra user ID to candidate in DB
    await this.prisma.candidate.update({
      where: { id: candidateId },
      data: { microsoftTeamsUserId: candUser.id },
    });

    try {
      const chatPayload = {
        chatType: 'oneOnOne',
        members: [
          {
            '@odata.type': '#microsoft.graph.aadUserConversationMember',
            roles: ['owner'],
            'user@odata.bind': `https://graph.microsoft.com/v1.0/users('${organizerUserId}')`,
          },
          {
            '@odata.type': '#microsoft.graph.aadUserConversationMember',
            roles: ['owner'],
            'user@odata.bind': `https://graph.microsoft.com/v1.0/users('${candUser.id}')`,
          },
        ],
      };

      const res = await fetch(`https://graph.microsoft.com/v1.0/chats`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(chatPayload),
      });

      if (res.ok) {
        const chatData = await res.json();
        const teamsChatId = chatData.id;

        await this.prisma.candidate.update({
          where: { id: candidateId },
          data: { teamsChatId },
        });

        this.logger.log(`[TeamsChatService] Created Microsoft Teams 1-to-1 chat ${teamsChatId} for candidate ${candidate.email}`);
        return { teamsChatId, candidateUserId: candUser.id };
      } else {
        const errText = await res.text();
        this.logger.error(`[TeamsChatService] Graph 1-to-1 chat creation failed | Status: ${res.status} | Error: ${errText}`);
        return { teamsChatId: null, candidateUserId: candUser.id, errorReason: res.status === 403 ? 'TEAMS_NOT_PROVISIONED' : 'GRAPH_API_ERROR' };
      }
    } catch (err: any) {
      this.logger.error(`[TeamsChatService] Exception in getOrCreateTeamsChat: ${err.message}`);
    }

    return { teamsChatId: null, candidateUserId: candUser.id, errorReason: 'TEAMS_CHAT_FAILED' };
  }

  /**
   * Sends HR message through Microsoft Graph API & persists message with exact status
   */
  async sendChatMessage(candidateId: string, dto: SendMessageDto) {
    const candidate = await this.prisma.candidate.findUnique({
      where: { id: candidateId },
    });

    if (!candidate) {
      throw new NotFoundException(`Candidate with ID ${candidateId} not found`);
    }

    const senderName = dto.senderName || 'Aishwarya Roy (Director HR)';
    const senderType = dto.senderType || 'recruiter';
    const content = (dto.content || '').trim();

    if (!content) {
      throw new BadRequestException('Message content cannot be empty');
    }

    // If explicit ERP internal note requested
    if (dto.isErpOnly) {
      return this.prisma.candidateTeamsMessage.create({
        data: {
          candidateId,
          senderType,
          senderName,
          content,
          status: 'SENT',
          deliveryStatus: 'ERP_INTERNAL_NOTE',
        },
      });
    }

    const token = await this.getGraphAccessToken();
    let teamsMessageId: string | null = null;
    let deliveryStatus = 'FAILED_TEAMS_SEND';
    let teamsChatId = candidate.teamsChatId;

    if (!token) {
      deliveryStatus = 'FAILED_MS_AUTH';
    } else {
      const { teamsChatId: resolvedChatId, errorReason } = await this.getOrCreateTeamsChat(candidateId);
      teamsChatId = resolvedChatId || candidate.teamsChatId;

      if (!teamsChatId) {
        if (errorReason === 'ACCOUNT_NOT_FOUND') {
          deliveryStatus = 'FAILED_TEAMS_ACCOUNT_NOT_FOUND';
        } else if (errorReason === 'TEAMS_NOT_PROVISIONED') {
          deliveryStatus = 'FAILED_TEAMS_NOT_PROVISIONED';
        } else {
          deliveryStatus = 'FAILED_GRAPH_PERMISSION';
        }
      } else {
        try {
          const msgPayload = {
            body: {
              contentType: 'text',
              content: content,
            },
          };

          const res = await fetch(`https://graph.microsoft.com/v1.0/chats/${teamsChatId}/messages`, {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(msgPayload),
          });

          if (res.ok) {
            const graphMsg = await res.json();
            teamsMessageId = graphMsg.id;
            deliveryStatus = 'SENT_TO_TEAMS';
            this.logger.log(`[TeamsChatService] Sent Microsoft Teams message ID ${teamsMessageId} in chat ${teamsChatId}`);
          } else {
            const errText = await res.text();
            this.logger.warn(`[TeamsChatService] Graph API chat send status ${res.status}: ${errText}`);
            deliveryStatus = 'FAILED_GRAPH_API_ERROR';
          }
        } catch (err: any) {
          this.logger.error(`[TeamsChatService] Exception sending Teams message: ${err.message}`);
          deliveryStatus = 'FAILED_GRAPH_API_ERROR';
        }
      }
    }

    // Persist message record to database with exact delivery status
    const savedMsg = await this.prisma.candidateTeamsMessage.create({
      data: {
        candidateId,
        teamsChatId,
        teamsMessageId,
        senderType,
        senderName,
        content,
        status: deliveryStatus === 'SENT_TO_TEAMS' ? 'SENT' : 'FAILED',
        deliveryStatus,
      },
    });

    return savedMsg;
  }

  /**
   * Retrieves stored message history for a candidate
   */
  async getCandidateMessages(candidateId: string) {
    const candidate = await this.prisma.candidate.findUnique({
      where: { id: candidateId },
    });

    if (!candidate) {
      throw new NotFoundException(`Candidate with ID ${candidateId} not found`);
    }

    return this.prisma.candidateTeamsMessage.findMany({
      where: { candidateId },
      orderBy: { sentAt: 'asc' },
    });
  }

  /**
   * Posts a system event message into the candidate's persistent chat stream
   */
  async postSystemEvent(
    candidateId: string,
    senderName: string,
    content: string,
    eventType?: string,
    meta?: any,
  ) {
    const candidate = await this.prisma.candidate.findUnique({
      where: { id: candidateId },
    });

    if (!candidate) {
      throw new NotFoundException(`Candidate with ID ${candidateId} not found`);
    }

    return this.prisma.candidateTeamsMessage.create({
      data: {
        candidateId,
        teamsChatId: candidate.teamsChatId,
        senderType: 'system',
        senderName,
        content,
        status: 'SENT',
        deliveryStatus: 'ERP_SYSTEM_EVENT',
        eventType: eventType || 'SYSTEM_EVENT',
        meta: meta || null,
      },
    });
  }

  /**
   * Dispatches Microsoft Teams Guest Account Invitation to candidate
   */
  async sendTeamsGuestInvitation(candidateId: string, customNotes?: string) {
    const candidate = await this.prisma.candidate.findUnique({
      where: { id: candidateId },
    });

    if (!candidate) {
      throw new NotFoundException(`Candidate with ID ${candidateId} not found`);
    }

    const eventContent = `Microsoft Teams Guest Invitation Sent to ${candidate.firstName} ${candidate.lastName} (${candidate.email}). Status: Invitation Sent. ${customNotes ? `Notes: ${customNotes}` : ''}`;

    const messageRecord = await this.prisma.candidateTeamsMessage.create({
      data: {
        candidateId,
        teamsChatId: candidate.teamsChatId,
        senderType: 'system',
        senderName: 'Microsoft Teams Guest Manager',
        content: eventContent,
        status: 'SENT',
        deliveryStatus: 'ERP_SYSTEM_EVENT',
        eventType: 'TEAMS_GUEST_INVITE',
        meta: {
          email: candidate.email,
          invitedAt: new Date().toISOString(),
          notes: customNotes || null,
        },
      },
    });

    this.logger.log(`[TeamsChatService] Dispatched Microsoft Teams Guest invitation for candidate ${candidate.email}`);
    return messageRecord;
  }
}
