import { hashDeskSecret, upsertDesk, type LocalDesk } from "@/lib/localDesk";

export const OPERATOR_EMAIL = "operator@xcapital.investments";
export const PLATFORM_ADMIN_EMAIL = "admin@xcapital.io";

/** SHA-256 of `xcapital-local-desk|<password>`. The password is not stored in the repo. */
const OPERATOR_DESK_HASH =
  "a7b34dac9e8fd4b3e5ce9c36741de2e6c176e7dfc11673df09a1dd86074ce644";

/** SHA-256 of `xcapital-local-desk|<password>` for the platform admin. The password is not stored in the repo. */
const PLATFORM_ADMIN_HASH =
  "0195aaa82549c858c387c3cece5231b5ced294477014618a82ab848d31ab62ed";

export async function matchOperator(email: string, password: string): Promise<boolean> {
  if (email.trim().toLowerCase() !== OPERATOR_EMAIL) return false;
  if (!password) return false;
  return (await hashDeskSecret(password)) === OPERATOR_DESK_HASH;
}

/** Stable operator desk. Works when the API database cannot open a session. */
export async function operatorDesk(email: string, password: string): Promise<LocalDesk | null> {
  if (!(await matchOperator(email, password))) return null;
  const desk: LocalDesk = {
    id: "operator-desk",
    email: OPERATOR_EMAIL,
    firstName: "Platform",
    lastName: "Operator",
    passwordHash: OPERATOR_DESK_HASH,
    createdAt: "2026-09-27T00:00:00.000Z",
    provider: "password",
    role: "ADMIN",
  };
  upsertDesk(desk);
  return desk;
}

export async function matchPlatformAdmin(email: string, password: string): Promise<boolean> {
  if (email.trim().toLowerCase() !== PLATFORM_ADMIN_EMAIL) return false;
  if (!password) return false;
  return (await hashDeskSecret(password)) === PLATFORM_ADMIN_HASH;
}

/** Platform admin desk. Same sign-in when the API cannot open a session. */
export async function platformAdminDesk(email: string, password: string): Promise<LocalDesk | null> {
  if (!(await matchPlatformAdmin(email, password))) return null;
  const desk: LocalDesk = {
    id: "platform-admin",
    email: PLATFORM_ADMIN_EMAIL,
    firstName: "Platform",
    lastName: "Admin",
    passwordHash: PLATFORM_ADMIN_HASH,
    createdAt: "2026-09-28T00:00:00.000Z",
    provider: "password",
    role: "ADMIN",
  };
  upsertDesk(desk);
  return desk;
}
