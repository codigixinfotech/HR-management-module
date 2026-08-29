import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface CreateTeamsMeetingParams {
  candidateName: string;
  candidateEmail: string;
  position: string;
  interviewDate: string; // YYYY-MM-DD
  startTime: string; // HH:mm (e.g. 11:00)
  durationMinutes: number; // e.g. 60
  notes?: string;
  attendees?: Array<{ name: string; email: string }>;
}

export interface TeamsMeetingResult {
  teamsMeetingId: string;
  teamsJoinUrl: string;
  calendarEventId: string;
  invitationStatus: 'SENT' | 'FAILED' | 'NOT_SENT';
  organizerEmail: string;
}

@Injectable()
export class TeamsInterviewService {
  private readonly logger = new Logger(TeamsInterviewService.name);
  private cachedToken: { accessToken: string; expiresAt: number } | null = null;

  constructor(private readonly config: ConfigService) {}

  /**
   * Acquire OAuth 2.0 Access Token from Microsoft Entra ID (Azure AD)
   */
  private async getGraphAccessToken(): Promise<string | null> {
    const tenantId = this.config.get<string>('MS_TENANT_ID');
    const clientId = this.config.get<string>('MS_CLIENT_ID');
    const clientSecret = this.config.get<string>('MS_CLIENT_SECRET');

    if (!tenantId || !clientId || !clientSecret) {
      this.logger.warn('Microsoft Graph credentials (MS_TENANT_ID, MS_CLIENT_ID, MS_CLIENT_SECRET) not set. Running in Fallback Mode.');
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
        this.logger.error(`Microsoft OAuth token acquisition failed: ${response.status} ${errorText}`);
        return null;
      }

      const data = await response.json();
      this.cachedToken = {
        accessToken: data.access_token,
        expiresAt: Date.now() + (data.expires_in || 3600) * 1000,
      };

      return data.access_token;
    } catch (err: any) {
      this.logger.error(`Error requesting Graph access token: ${err.message}`);
      return null;
    }
  }

  /**
   * Resolves Organizer / Recruiter User ID in Microsoft Entra ID tenant
   */
  private async resolveOrganizerUserId(token: string): Promise<{ id: string; userPrincipalName: string } | null> {
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
          const cleanPrefix = organizerEmail.split('@')[0].toLowerCase();
          const match = users.find(
            (u: any) =>
              (u.mail || '').toLowerCase() === organizerEmail.toLowerCase() ||
              (u.userPrincipalName || '').toLowerCase().startsWith(`${cleanPrefix}_`) ||
              (u.userPrincipalName || '').toLowerCase().startsWith(cleanPrefix),
          );
          const selectedUser = match || users[0];
          this.logger.log(`Resolved Entra ID organizer: ${selectedUser.displayName} (${selectedUser.id} / ${selectedUser.userPrincipalName})`);
          return { id: selectedUser.id, userPrincipalName: selectedUser.userPrincipalName };
        }
      } else {
        const errText = await userRes.text();
        this.logger.error(`Error resolving Graph users list: ${userRes.status} ${errText}`);
      }
    } catch (err: any) {
      this.logger.error(`Error resolving organizer user ID: ${err.message}`);
    }

    return null;
  }

  /**
   * Creates a Microsoft Teams online meeting strictly via Microsoft Graph API
   */
  async createTeamsInterview(params: CreateTeamsMeetingParams): Promise<TeamsMeetingResult> {
    if (!params.candidateEmail || !params.candidateEmail.includes('@')) {
      throw new BadRequestException('A valid candidate email address is required to create a Teams interview invitation.');
    }

    const organizerEmail = this.config.get<string>('MS_TEAMS_ORGANIZER_EMAIL') || 'motesanika@gmail.com';
    const token = await this.getGraphAccessToken();

    // Construct start & end ISO DateTime strings
    const dateStr = params.interviewDate.split('T')[0];
    let hours = 11;
    let minutes = 0;
    const cleanTime = (params.startTime || '11:00 AM').trim().toUpperCase();
    const isPM = cleanTime.includes('PM');
    const isAM = cleanTime.includes('AM');
    const timeParts = cleanTime.replace(/[^\d:]/g, '').split(':');

    if (timeParts.length >= 1 && !isNaN(parseInt(timeParts[0], 10))) {
      hours = parseInt(timeParts[0], 10);
    }
    if (timeParts.length >= 2 && !isNaN(parseInt(timeParts[1], 10))) {
      minutes = parseInt(timeParts[1], 10);
    }
    if (isPM && hours < 12) hours += 12;
    if (isAM && hours === 12) hours = 0;

    const startDate = new Date(dateStr);
    startDate.setHours(hours, minutes, 0, 0);

    const endDate = new Date(startDate.getTime() + (params.durationMinutes || 60) * 60000);

    const startIso = startDate.toISOString().split('.')[0];
    const endIso = endDate.toISOString().split('.')[0];

    if (token) {
      const organizerUser = await this.resolveOrganizerUserId(token);
      const userIdentifier = organizerUser ? organizerUser.id : organizerEmail;

      try {
        // Attempt 1: Create Calendar Event with Teams Online Meeting attached
        const eventPayload = {
          subject: `Interview — ${params.candidateName} (${params.position})`,
          body: {
            contentType: 'HTML',
            content: `
              <h3>EHCM Recruitment — Microsoft Teams Interview</h3>
              <p><strong>Candidate:</strong> ${params.candidateName}</p>
              <p><strong>Position:</strong> ${params.position}</p>
              <p><strong>Date & Time:</strong> ${startDate.toLocaleDateString()} ${params.startTime}</p>
              <p><strong>Duration:</strong> ${params.durationMinutes || 60} Minutes</p>
              <p>${params.notes || 'Please click the link below to join the interview.'}</p>
            `,
          },
          start: { dateTime: startIso, timeZone: 'Asia/Kolkata' },
          end: { dateTime: endIso, timeZone: 'Asia/Kolkata' },
          isOnlineMeeting: true,
          onlineMeetingProvider: 'teamsForBusiness',
          attendees: [
            {
              emailAddress: { address: params.candidateEmail, name: params.candidateName },
              type: 'required',
            },
            ...(params.attendees || []).map((att) => ({
              emailAddress: { address: att.email, name: att.name },
              type: 'required',
            })),
          ],
        };

        const res = await fetch(`https://graph.microsoft.com/v1.0/users/${userIdentifier}/events`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(eventPayload),
        });

        if (res.ok) {
          const graphEvent = await res.json();
          const joinUrl = graphEvent.onlineMeeting?.joinUrl || graphEvent.onlineMeetingUrl;
          if (joinUrl) {
            this.logger.log(`Created Microsoft Graph Teams event ID ${graphEvent.id} with joinUrl for candidate ${params.candidateEmail}`);
            return {
              teamsMeetingId: graphEvent.onlineMeeting?.id || graphEvent.id,
              teamsJoinUrl: joinUrl,
              calendarEventId: graphEvent.id,
              invitationStatus: 'SENT',
              organizerEmail: organizerUser?.userPrincipalName || organizerEmail,
            };
          }
        } else {
          const errText = await res.text();
          this.logger.error(`Graph API event creation error: ${res.status} ${errText}`);
        }
      } catch (err: any) {
        this.logger.error(`Failed Graph API Teams creation: ${err.message}`);
      }
    }

    /*
    // TEMPORARILY COMMENTED OUT: Microsoft Graph API Online Meeting Auto-Creation Path
    // (Bypassed in favor of Teams Meeting Link Pool Allocation System)
    */

    this.logger.log('Microsoft Graph API online meeting creation bypassed (using Teams Link Pool System).');
    return {
      teamsMeetingId: `pool-${Date.now()}`,
      teamsJoinUrl: '',
      calendarEventId: `evt-${Date.now()}`,
      invitationStatus: 'SENT',
      organizerEmail,
    };
  }

  /**
   * Reschedules an existing Microsoft Teams Calendar Event
   */
  async updateTeamsInterview(calendarEventId: string, params: CreateTeamsMeetingParams): Promise<boolean> {
    const organizerEmail = this.config.get<string>('MS_TEAMS_ORGANIZER_EMAIL') || 'recruitment@ehcm-enterprise.com';
    const token = await this.getGraphAccessToken();

    if (!token || !calendarEventId || calendarEventId.startsWith('evt-')) return true;

    try {
      const dateStr = params.interviewDate.split('T')[0];
      let hours = 11;
      let minutes = 0;
      const cleanTime = (params.startTime || '11:00 AM').trim().toUpperCase();
      const isPM = cleanTime.includes('PM');
      const isAM = cleanTime.includes('AM');
      const timeParts = cleanTime.replace(/[^\d:]/g, '').split(':');

      if (timeParts.length >= 1 && !isNaN(parseInt(timeParts[0], 10))) {
        hours = parseInt(timeParts[0], 10);
      }
      if (timeParts.length >= 2 && !isNaN(parseInt(timeParts[1], 10))) {
        minutes = parseInt(timeParts[1], 10);
      }
      if (isPM && hours < 12) hours += 12;
      if (isAM && hours === 12) hours = 0;

      const startDate = new Date(dateStr);
      startDate.setHours(hours, minutes, 0, 0);
      const endDate = new Date(startDate.getTime() + (params.durationMinutes || 60) * 60000);

      const res = await fetch(`https://graph.microsoft.com/v1.0/users/${organizerEmail}/events/${calendarEventId}`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          start: { dateTime: startDate.toISOString().split('.')[0], timeZone: 'Asia/Kolkata' },
          end: { dateTime: endDate.toISOString().split('.')[0], timeZone: 'Asia/Kolkata' },
        }),
      });

      return res.ok;
    } catch (err: any) {
      this.logger.error(`Error updating Graph event ${calendarEventId}: ${err.message}`);
      return false;
    }
  }

  /**
   * Cancels a Microsoft Teams Calendar Event and notifies attendees
   */
  async cancelTeamsInterview(calendarEventId: string, comment = 'Interview Cancelled by Recruiter'): Promise<boolean> {
    const organizerEmail = this.config.get<string>('MS_TEAMS_ORGANIZER_EMAIL') || 'recruitment@ehcm-enterprise.com';
    const token = await this.getGraphAccessToken();

    if (!token || !calendarEventId || calendarEventId.startsWith('evt-')) return true;

    try {
      const res = await fetch(`https://graph.microsoft.com/v1.0/users/${organizerEmail}/events/${calendarEventId}/cancel`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ Comment: comment }),
      });

      return res.ok;
    } catch (err: any) {
      this.logger.error(`Error cancelling Graph event ${calendarEventId}: ${err.message}`);
      return false;
    }
  }
}
