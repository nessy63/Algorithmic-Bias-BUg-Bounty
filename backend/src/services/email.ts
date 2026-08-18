import { logger } from '../config/logger';
import { resend, RESEND_EMAIL_FROM } from '../config/resend';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

// Escapes user-provided values before they are interpolated into HTML so a
// bug title can never inject markup into a recipient's email.
function escapeHtml(value: string | number): string {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export class EmailService {
  static async send(options: EmailOptions) {
    // Never log the recipient address — it is personal data.
    logger.info('Email send requested', {
      to: '[REDACTED]',
      subject: options.subject,
    });

    if (!process.env.RESEND_API_KEY) {
      // Development fallback: log the (redacted) attempt and move on so email
      // problems never break bug submission or acceptance flows.
      logger.warn('Email not sent — RESEND_API_KEY not configured', {
        to: '[REDACTED]',
        subject: options.subject,
      });
      return;
    }

    try {
      const { error } = await resend!.emails.send({
        from: RESEND_EMAIL_FROM,
        to: options.to,
        subject: options.subject,
        html: options.html,
      });

      if (error) {
        throw new Error(error.message);
      }
    } catch (error) {
      // Log the failure without the recipient address or the API key.
      logger.error('Email send failed', {
        to: '[REDACTED]',
        subject: options.subject,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  static async sendBugReportSubmitted(to: string, bugTitle: string) {
    await this.send({
      to,
      subject: 'New Bug Report Submitted',
      html: `
        <h2>New Bug Report</h2>
        <p>A new bug report has been submitted: <strong>${escapeHtml(bugTitle)}</strong></p>
        <p>Please review it at your earliest convenience.</p>
      `,
    });
  }

  static async sendBugReportAccepted(to: string, bugTitle: string, amount: number) {
    await this.send({
      to,
      subject: 'Bug Report Accepted - Bounty Earned!',
      html: `
        <h2>Congratulations!</h2>
        <p>Your bug report "<strong>${escapeHtml(bugTitle)}</strong>" has been accepted.</p>
        <p>You have earned a bounty of <strong>$${amount.toFixed(2)}</strong></p>
      `,
    });
  }

  static async sendEscrowCreated(to: string, amount: number) {
    await this.send({
      to,
      subject: 'Escrow Payment Created',
      html: `
        <h2>Payment Update</h2>
        <p>An escrow payment of <strong>$${amount.toFixed(2)}</strong> has been created for your bug report.</p>
      `,
    });
  }
}
