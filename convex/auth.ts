import {
  convexAuth,
  createAccount,
  retrieveAccount,
  type AuthProviderConfig,
} from "@convex-dev/auth/server";
import { Email } from "@convex-dev/auth/providers/Email";
import { ConvexCredentials } from "@convex-dev/auth/providers/ConvexCredentials";
import { Resend as ResendAPI } from "resend";
import type { RandomReader } from "@oslojs/crypto/random";
import { generateRandomString } from "@oslojs/crypto/random";
import { Scrypt } from "lucia";

/**
 * Custom Resend OTP provider for passwordless email authentication.
 *
 * Uses the official @convex-dev/auth/providers/Email provider with Resend
 * for sending verification codes.
 *
 * Generates 8-digit numeric codes that expire after 15 minutes.
 */
const ResendOTP = Email({
  id: "resend-otp",
  apiKey: process.env.AUTH_RESEND_KEY,
  maxAge: 60 * 15, // 15 minutes

  async generateVerificationToken() {
    const random: RandomReader = {
      read(bytes: Uint8Array) {
        crypto.getRandomValues(bytes);
      },
    };
    const alphabet = "0123456789";
    const length = 8;
    return generateRandomString(random, alphabet, length);
  },

  async sendVerificationRequest({ identifier: email, provider, token }) {
    const resend = new ResendAPI(provider.apiKey);
    const { error } = await resend.emails.send({
      from: "Your App <onboarding@resend.dev>",
      to: [email],
      subject: "Your verification code",
      text: `Your verification code is: ${token}\n\nThis code expires in 15 minutes.\n\nIf you didn't request this code, you can safely ignore this email.`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 400px; margin: 0 auto; padding: 24px;">
          <h2 style="margin: 0 0 16px 0; font-size: 24px; font-weight: 600;">Your verification code</h2>
          <p style="margin: 0 0 24px 0; color: #666; font-size: 14px;">
            Enter this code to sign in:
          </p>
          <div style="background: #f5f5f5; border-radius: 8px; padding: 24px; text-align: center; margin: 0 0 24px 0;">
            <span style="font-size: 32px; font-weight: bold; letter-spacing: 4px; font-family: monospace;">
              ${token}
            </span>
          </div>
          <p style="margin: 0; color: #999; font-size: 12px;">
            This code expires in 15 minutes. If you didn't request this code, you can safely ignore this email.
          </p>
        </div>
      `,
    });

    if (error) {
      console.error("Failed to send verification email:", error);
      throw new Error(`Could not send verification email: ${error.message}`);
    }
  },
});

const enableDevPasswordAuth =
  process.env.ENABLE_DEV_PASSWORD_AUTH === "true";
const devPasswordEmail =
  process.env.DEV_PASSWORD_AUTH_EMAIL?.toLowerCase() ?? "test@yourapp.local";
const devPasswordSecret =
  process.env.DEV_PASSWORD_AUTH_PASSWORD ?? "TestUser2026#Secure!";
const devProviderId = "dev-password";

const providers: AuthProviderConfig[] = [ResendOTP];

if (enableDevPasswordAuth) {
  providers.push(
    ConvexCredentials({
      id: devProviderId,
      authorize: async (credentials, ctx) => {
        const rawEmail = credentials.email;
        const rawPassword = credentials.password;
        if (typeof rawEmail !== "string" || typeof rawPassword !== "string") {
          return null;
        }
        const email = rawEmail.toLowerCase().trim();
        if (email !== devPasswordEmail || rawPassword !== devPasswordSecret) {
          throw new Error("Invalid credentials");
        }

        try {
          const created = await createAccount(ctx, {
            provider: devProviderId,
            account: { id: email, secret: rawPassword },
            profile: { email },
            shouldLinkViaEmail: false,
            shouldLinkViaPhone: false,
          });
          return { userId: created.user._id };
        } catch {
          const retrieved = await retrieveAccount(ctx, {
            provider: devProviderId,
            account: { id: email, secret: rawPassword },
          });
          return { userId: retrieved.user._id };
        }
      },
      crypto: {
        async hashSecret(secret: string) {
          return await new Scrypt().hash(secret);
        },
        async verifySecret(secret: string, hash: string) {
          return await new Scrypt().verify(hash, secret);
        },
      },
    })
  );
}

export const { auth, signIn, signOut, store } = convexAuth({
  providers,
});
