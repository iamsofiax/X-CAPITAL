import { createRemoteJWKSet, jwtVerify, type JWTPayload } from "jose";
import { env } from "../config/env";
import { createError } from "../middleware/errorHandler";

const googleJwks = createRemoteJWKSet(
  new URL("https://www.googleapis.com/oauth2/v3/certs"),
);

export interface VerifiedIdentity {
  provider: "google" | "apple";
  sub: string;
  email: string;
  emailVerified: boolean;
  firstName?: string;
  lastName?: string;
  avatarUrl?: string;
}

const isTrue = (v: unknown): boolean => v === true || v === "true";

export async function verifyGoogleIdToken(
  idToken: string,
): Promise<VerifiedIdentity> {
  if (!env.GOOGLE_CLIENT_ID) {
    throw createError("Google sign-in is not configured", 503);
  }
  let payload: JWTPayload & Record<string, unknown>;
  try {
    ({ payload } = await jwtVerify(idToken, googleJwks, {
      issuer: ["https://accounts.google.com", "accounts.google.com"],
      audience: env.GOOGLE_CLIENT_ID,
    }));
  } catch {
    throw createError("Invalid Google credential", 401);
  }
  if (!payload.sub || typeof payload.email !== "string") {
    throw createError("Google credential missing email", 401);
  }
  return {
    provider: "google",
    sub: payload.sub,
    email: payload.email.toLowerCase(),
    emailVerified: isTrue(payload.email_verified),
    firstName:
      typeof payload.given_name === "string" ? payload.given_name : undefined,
    lastName:
      typeof payload.family_name === "string" ? payload.family_name : undefined,
    avatarUrl: typeof payload.picture === "string" ? payload.picture : undefined,
  };
}

export async function verifyAppleIdToken(
  _idToken: string,
): Promise<VerifiedIdentity> {
  throw createError("Apple sign-in is disabled", 410);
}
