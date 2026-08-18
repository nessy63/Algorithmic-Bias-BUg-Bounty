import { logger } from '../config/logger';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

export class EmailService {
  static async send(options: EmailOptions) {
    // In production, integrate with SendGrid, AWS SES, or similar
    logger.info('Email sent', {
      to: options.to,
      subject: options.subject,
    });
  }

  static async sendBugReportSubmitted(to: string, bugTitle: string) {
    await this.send({
      to,
      subject: 'New Bug Report Submitted',
      html: `
        <h2>New Bug Report</h2>
        <p>A new bug report has been submitted: <strong>${bugTitle}</strong></p>
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
        <p>Your bug report "<strong>${bugTitle}</strong>" has been accepted.</p>
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
