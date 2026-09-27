import { Request, Response, NextFunction } from "express";
import { validationResult } from "express-validator";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";
import type { User } from "@prisma/client";
import { prisma } from "../config/database";
import { env } from "../config/env";
import { AuthRequest } from "../middleware/auth";
import { isAdminEmail } from "../middleware/adminAuth";
import { createError } from "../middleware/errorHandler";
import { kycService } from "../services/kycService";
import {
  verifyGoogleIdToken,
  type VerifiedIdentity,
} from "../services/oauthService";
import { ensureUserAccounts, userBalances } from "../services/ledgerService";

const REFRESH_TTL_MS = 30 * 24 * 60 * 60 * 1000;

const publicUser = (user: User) => ({
  id: user.id,
  email: user.email,
  firstName: user.firstName,
  lastName: user.lastName,
  tier: user.tier,
  kycStatus: user.kycStatus,
  accreditationStatus: user.accreditationStatus,
  authProvider: user.authProvider,
  avatarUrl: user.avatarUrl,
  role: isAdminEmail(user.email) ? "ADMIN" : "USER",
});

async function issueSession(user: User) {
  const accessToken = jwt.sign(
    { userId: user.id, email: user.email },
    env.JWT_SECRET,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    { expiresIn: env.JWT_EXPIRES_IN as any },
  );
  const refreshToken = uuidv4();
  await prisma.$transaction([
    prisma.refreshToken.create({
      data: {
        userId: user.id,
        token: refreshToken,
        expiresAt: new Date(Date.now() + REFRESH_TTL_MS),
      },
    }),
    prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    }),
  ]);
  return { accessToken, refreshToken, user: publicUser(user) };
}

async function createUserWithAccounts(
  data: Parameters<typeof prisma.user.create>[0]["data"],
): Promise<User> {
  return prisma.$transaction(async (tx) => {
    const newUser = await tx.user.create({ data });
    await tx.wallet.create({ data: { userId: newUser.id } });
    await tx.portfolio.create({
      data: { userId: newUser.id, totalValue: 0, totalCost: 0, totalPnL: 0 },
    });
    return newUser;
  }).then(async (user) => {
    await ensureUserAccounts(user.id);
    return user;
  });
}

export const register = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ success: false, errors: errors.array() });
      return;
    }

    const { email, password, firstName, lastName, phone } = req.body;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      res.status(409).json({
        success: false,
        message: existing.passwordHash
          ? "Email already registered"
          : "This email is linked to Google sign-in. Use that button instead.",
      });
      return;
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await createUserWithAccounts({
      email,
      passwordHash,
      firstName,
      lastName,
      phone,
    });

    const session = await issueSession(user);
    res.status(201).json({
      success: true,
      message: "Account created successfully",
      data: session,
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ success: false, errors: errors.array() });
      return;
    }

    const { email, password } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      res
        .status(401)
        .json({ success: false, message: "Invalid email or password" });
      return;
    }
    if (!user.isActive) {
      res.status(403).json({ success: false, message: "Account disabled" });
      return;
    }
    if (!user.passwordHash) {
      res.status(401).json({
        success: false,
        code: "SOCIAL_ACCOUNT",
        message: "This account uses Google sign-in",
      });
      return;
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      res
        .status(401)
        .json({ success: false, message: "Invalid email or password" });
      return;
    }

    res.json({ success: true, data: await issueSession(user) });
  } catch (error) {
    next(error);
  }
};

async function upsertSocialUser(
  identity: VerifiedIdentity,
  profile?: { firstName?: string; lastName?: string },
): Promise<User> {
  const subField = identity.provider === "google" ? "googleSub" : "appleSub";

  const bySub = await prisma.user.findUnique({
    where:
      identity.provider === "google"
        ? { googleSub: identity.sub }
        : { appleSub: identity.sub },
  });
  if (bySub) return bySub;

  const byEmail = await prisma.user.findUnique({
    where: { email: identity.email },
  });
  if (byEmail) {
    // Linking to an existing password account is only safe when the provider vouches for the email.
    if (!identity.emailVerified) {
      throw createError("Email not verified by provider", 401);
    }
    return prisma.user.update({
      where: { id: byEmail.id },
      data: {
        [subField]: identity.sub,
        avatarUrl: byEmail.avatarUrl ?? identity.avatarUrl,
      },
    });
  }

  const localPart = identity.email.split("@")[0] ?? "Investor";
  return createUserWithAccounts({
    email: identity.email,
    authProvider: identity.provider,
    [subField]: identity.sub,
    avatarUrl: identity.avatarUrl,
    firstName:
      profile?.firstName?.trim() || identity.firstName || localPart || "Investor",
    lastName: profile?.lastName?.trim() || identity.lastName || "",
  });
}

const socialLogin =
  (provider: "google" | "apple") =>
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { idToken, firstName, lastName } = req.body as {
        idToken?: string;
        firstName?: string;
        lastName?: string;
      };
      if (!idToken) {
        res.status(400).json({ success: false, message: "idToken required" });
        return;
      }

      if (provider !== "google") {
        res.status(410).json({ success: false, message: "Apple sign-in is disabled" });
        return;
      }
      const identity = await verifyGoogleIdToken(idToken);

      const user = await upsertSocialUser(identity, { firstName, lastName });
      if (!user.isActive) {
        res.status(403).json({ success: false, message: "Account disabled" });
        return;
      }

      res.json({ success: true, data: await issueSession(user) });
    } catch (error) {
      next(error);
    }
  };

export const googleLogin = socialLogin("google");

export const appleLogin = async (
  _req: Request,
  res: Response,
): Promise<void> => {
  res.status(410).json({ success: false, message: "Apple sign-in is disabled" });
};

export const refreshToken = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { refreshToken: token } = req.body;
    if (!token) {
      res
        .status(400)
        .json({ success: false, message: "Refresh token required" });
      return;
    }

    const storedToken = await prisma.refreshToken.findUnique({
      where: { token },
      include: { user: true },
    });

    if (
      !storedToken ||
      storedToken.expiresAt < new Date() ||
      !storedToken.user.isActive
    ) {
      res
        .status(401)
        .json({ success: false, message: "Invalid or expired refresh token" });
      return;
    }

    await prisma.refreshToken.delete({ where: { id: storedToken.id } });
    const session = await issueSession(storedToken.user);

    res.json({
      success: true,
      data: {
        accessToken: session.accessToken,
        refreshToken: session.refreshToken,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const logout = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { refreshToken: token } = req.body;
    if (token) {
      await prisma.refreshToken.deleteMany({ where: { token } });
    }
    res.json({ success: true, message: "Logged out successfully" });
  } catch (error) {
    next(error);
  }
};

export const changePassword = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ success: false, errors: errors.array() });
      return;
    }
    const { currentPassword, newPassword } = req.body as {
      currentPassword?: string;
      newPassword: string;
    };
    const user = await prisma.user.findUnique({ where: { id: req.user!.id } });
    if (!user) {
      res.status(404).json({ success: false, message: "User not found" });
      return;
    }
    if (user.passwordHash) {
      const valid =
        !!currentPassword &&
        (await bcrypt.compare(currentPassword, user.passwordHash));
      if (!valid) {
        res
          .status(401)
          .json({ success: false, message: "Current password is incorrect" });
        return;
      }
    }
    await prisma.$transaction([
      prisma.user.update({
        where: { id: user.id },
        data: { passwordHash: await bcrypt.hash(newPassword, 12) },
      }),
      prisma.refreshToken.deleteMany({ where: { userId: user.id } }),
    ]);
    res.json({ success: true, message: "Password updated" });
  } catch (error) {
    next(error);
  }
};

export const getMe = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
    });
    if (!user) {
      res.status(404).json({ success: false, message: "User not found" });
      return;
    }
    await ensureUserAccounts(user.id);
    const balances = await userBalances(user.id);
    res.json({
      success: true,
      data: {
        ...publicUser(user),
        phone: user.phone,
        createdAt: user.createdAt,
        wallet: { balances },
      },
    });
  } catch (error) {
    next(error);
  }
};

export const initiateKYC = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: { kycStatus: true, email: true, firstName: true, lastName: true },
    });

    if (user?.kycStatus === "APPROVED") {
      res.json({ success: true, message: "KYC already verified" });
      return;
    }

    const kycSession = await kycService.createVerificationSession(
      req.user!.id,
      {
        email: user!.email,
        firstName: user!.firstName,
        lastName: user!.lastName,
      },
    );

    await prisma.user.update({
      where: { id: req.user!.id },
      data: { kycStatus: "PENDING", kycProviderId: kycSession.sessionId },
    });

    res.json({ success: true, data: { sessionUrl: kycSession.sessionUrl } });
  } catch (error) {
    next(error);
  }
};

export const kycWebhook = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const payload = req.body;
    await kycService.handleWebhook(payload);
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
};
