import { hashDeskSecret, upsertDesk, type LocalDesk } from "@/lib/localDesk";

export const OPERATOR_EMAIL = "operator@xcapital.investments";

/** SHA-256 of `xcapital-local-desk|<password>`. The password is not stored in the repo. */
const OPERATOR_DESK_HASH =
  "a7b34dac9e8fd4b3e5ce9c36741de2e6c176e7dfc11673df09a1dd86074ce644";

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
