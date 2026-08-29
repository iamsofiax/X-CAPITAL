import { Prisma } from "@prisma/client";
import { prisma } from "../config/database";

export async function writeAdminAudit(input: {
  actorId: string;
  actorEmail: string;
  action: string;
  target: string;
  level?: string;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  try {
    await prisma.adminAuditLog.create({
      data: {
        actorId: input.actorId,
        actorEmail: input.actorEmail,
        action: input.action,
        target: input.target,
        level: input.level ?? "action",
        metadata:
          input.metadata === undefined
            ? undefined
            : (JSON.parse(JSON.stringify(input.metadata)) as Prisma.InputJsonValue),
      },
    });
  } catch (err) {
    console.warn(
      "[audit] write failed:",
      err instanceof Error ? err.message : "unknown",
    );
  }
}
