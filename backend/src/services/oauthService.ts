import bcrypt from "bcryptjs";
import { randomBytes } from "crypto";
import { OAuth2Client } from "google-auth-library";
import { createRemoteJWKSet, jwtVerify } from "jose";
import { prisma } from "../config/database";
import { env } from "../config/env";

export type SocialProfile = {
  providerId: string;
  email: string;
  firstName: string;
  lastName: string;
};

const googleClient = () =>
  env.GOOGLE_CLIENT_ID ? new OAuth2Client(env.GOOGLE_CLIENT_ID) : null;

const appleJwks = createRemoteJWKSet(
  new URL("https://appleid.apple.com/auth/keys"),
);

export async function verifyGoogleCredential(
  credential: string,
): Promise<SocialProfile> {
  if (!env.GOOGLE_CLIENT_ID) {
    throw Object.assign(new Error("Google sign-in is not configured"), {
      status: 503,
    });
  }
  const client = googleClient();
  if (!client) {
    throw Object.assign(new Error("Google sign-in is not configured"), {
      status: 503,
    });
  }
  const ticket = await client.verifyIdToken({
    idToken: credential,
    audience: env.GOOGLE_CLIENT_ID,
  });
  const payload = ticket.getPayload();
  if (!payload?.sub || !payload.email) {
    throw Object.assign(new Error("Google did not return an email"), {
      status: 401,
    });
  }
  const given = (payload.given_name || payload.name || "Node").trim();
  const family = (payload.family_name || "").trim();
  return {
    providerId: payload.sub,
    email: payload.email.toLowerCase(),
    firstName: given.split(" ")[0] || "Node",
    lastName: family || given.split(" ").slice(1).join(" ") || "Member",
  };
}

export async function verifyAppleIdentityToken(
  identityToken: string,
): Promise<SocialProfile> {
  if (!env.APPLE_CLIENT_ID) {
    throw Object.assign(new Error("Apple sign-in is not configured"), {
      status: 503,
    });
  }
  const { payload } = await jwtVerify(identityToken, appleJwks, {
    issuer: "https://appleid.apple.com",
    audience: env.APPLE_CLIENT_ID,
  });
  const sub = String(payload.sub ?? "");
  const email = String(payload.email ?? "").toLowerCase();
  if (!sub) {
    throw Object.assign(new Error("Apple token missing subject"), {
      status: 401,
    });
  }
  return {
    providerId: sub,
    email,
    firstName: "Node",
    lastName: "Member",
  };
}

export async function upsertSocialUser(
  provider: "google" | "apple",
  profile: SocialProfile,
  names?: { firstName?: string; lastName?: string },
) {
  const firstName = (names?.firstName || profile.firstName).trim() || "Node";
  const lastName = (names?.lastName || profile.lastName).trim() || "Member";
  const providerKey = provider === "google" ? "googleId" : "appleId";

  const byProvider = profile.providerId
    ? await prisma.user.findFirst({
        where:
          provider === "google"
            ? { googleId: profile.providerId }
            : { appleId: profile.providerId },
      })
    : null;

  if (byProvider) {
    await prisma.user.update({
      where: { id: byProvider.id },
      data: { lastLoginAt: new Date() },
    });
    return byProvider;
  }

  if (profile.email) {
    const byEmail = await prisma.user.findUnique({
      where: { email: profile.email },
    });
    if (byEmail) {
      return prisma.user.update({
        where: { id: byEmail.id },
        data: {
          [providerKey]: profile.providerId,
          lastLoginAt: new Date(),
        },
      });
    }
  }

  if (!profile.email) {
    throw Object.assign(
      new Error("Email is required on first Apple sign-in"),
      { status: 400 },
    );
  }

  const passwordHash = await bcrypt.hash(randomBytes(32).toString("hex"), 12);

  return prisma.$transaction(async (tx) => {
    const newUser = await tx.user.create({
      data: {
        email: profile.email,
        passwordHash,
        firstName,
        lastName,
        googleId: provider === "google" ? profile.providerId : undefined,
        appleId: provider === "apple" ? profile.providerId : undefined,
      },
    });
    await tx.wallet.create({
      data: { userId: newUser.id, lastAccruedAt: new Date() },
    });
    await tx.portfolio.create({
      data: { userId: newUser.id, totalValue: 0, totalCost: 0, totalPnL: 0 },
    });
    await tx.userYieldConfig.create({ data: { userId: newUser.id } });
    return newUser;
  });
}
