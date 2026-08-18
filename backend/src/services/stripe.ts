import { stripe } from '../config/stripe';
import prisma from '../config/database';

export class StripeService {
  static async createConnectAccount(email: string) {
    return stripe.accounts.create({
      type: 'express',
      email,
      capabilities: {
        transfers: { requested: true },
      },
    });
  }

  static async createPaymentIntent(amount: number, companyId: string, bountyId: string) {
    const company = await prisma.company.findUnique({ where: { id: companyId } });

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100),
      currency: 'usd',
      transfer_data: {
        destination: company?.stripeAccountId || '',
      },
      metadata: {
        bountyId,
        companyId,
      },
    });

    return paymentIntent;
  }

  static async createEscrow(bugReportId: string, amount: number) {
    const bugReport = await prisma.bugReport.findUnique({
      where: { id: bugReportId },
      include: { bounty: true },
    });

    if (!bugReport) {
      throw new Error('Bug report not found');
    }

    const paymentIntent = await this.createPaymentIntent(
      amount,
      bugReport.bounty.companyId,
      bugReport.bountyId
    );

    return prisma.escrow.create({
      data: {
        amount,
        status: 'HELD',
        stripePaymentIntentId: paymentIntent.id,
        bugReportId,
        bountyId: bugReport.bountyId,
      },
    });
  }

  static async releaseEscrow(escrowId: string) {
    const escrow = await prisma.escrow.findUnique({ where: { id: escrowId } });

    if (!escrow || escrow.status !== 'HELD') {
      throw new Error('Escrow not found or not in HELD status');
    }

    await stripe.paymentIntents.capture(escrow.stripePaymentIntentId!);

    return prisma.escrow.update({
      where: { id: escrowId },
      data: { status: 'RELEASED' },
    });
  }

  static async refundEscrow(escrowId: string) {
    const escrow = await prisma.escrow.findUnique({ where: { id: escrowId } });

    if (!escrow || escrow.status !== 'HELD') {
      throw new Error('Escrow not found or not in HELD status');
    }

    await stripe.paymentIntents.cancel(escrow.stripePaymentIntentId!);

    return prisma.escrow.update({
      where: { id: escrowId },
      data: { status: 'REFUNDED' },
    });
  }

  static async createOnboardingLink(accountId: string) {
    return stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/company/settings`,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/company/settings`,
      type: 'account_onboarding',
    });
  }
}
