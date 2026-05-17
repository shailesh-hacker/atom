import { Injectable, Logger } from '@nestjs/common';
import { Resend } from 'resend';

@Injectable()
export class EmailService {
  private resend: Resend | null = null;
  private readonly logger = new Logger(EmailService.name);

  constructor() {
    const apiKey = process.env.RESEND_API_KEY;
    if (apiKey) {
      this.resend = new Resend(apiKey);
      this.logger.log('Resend email service initialized successfully.');
    } else {
      this.logger.warn('RESEND_API_KEY is not defined. Email notifications will be mocked/logged to console.');
    }
  }

  async sendEmail(to: string, subject: string, html: string) {
    // Support email overrides for development/testing sandbox restrictions
    const recipient = process.env.RESEND_TO_OVERRIDE || to;

    if (!this.resend) {
      this.logger.log(`[MOCK EMAIL] To: ${recipient} (Original: ${to}) | Subject: ${subject}`);
      return;
    }

    try {
      const response = await this.resend.emails.send({
        from: 'GoalTrack <onboarding@resend.dev>',
        to: recipient,
        subject,
        html,
      });

      if (response.error) {
        this.logger.error(`Resend failed to deliver email to ${recipient}: [${response.error.name}] ${response.error.message}`);
        return response;
      }

      this.logger.log(`Email sent successfully to ${recipient}. ID: ${response.data?.id}`);
      return response;
    } catch (error) {
      this.logger.error(`Unhandled exception in sending email to ${recipient}`, error);
    }
  }
}
