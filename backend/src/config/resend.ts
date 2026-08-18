import { Resend } from 'resend';

// Resend client for transactional email (bug report notifications).
//
// The SDK constructor throws on an empty key, so the client is only created
// when RESEND_API_KEY is set. EmailService guards on the env var as well and
// never lets a missing key break request handling.
export const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

export const RESEND_EMAIL_FROM =
  process.env.RESEND_EMAIL_FROM || 'onboarding@resend.dev';
