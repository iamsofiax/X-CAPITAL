/**
 * Map auth HTTP failures to desk language. Never mention vendors or cold-start.
 */

function httpStatus(err: unknown): number | undefined {
  if (
    err &&
    typeof err === "object" &&
    "response" in err &&
    err.response &&
    typeof err.response === "object" &&
    "status" in err.response
  ) {
    return Number((err.response as { status?: number }).status);
  }
  return undefined;
}

function code(err: unknown): string | undefined {
  if (err && typeof err === "object" && "code" in err) {
    return String((err as { code?: string }).code);
  }
  return undefined;
}

function apiMessage(err: unknown): string | undefined {
  if (
    !err ||
    typeof err !== "object" ||
    !("response" in err) ||
    !err.response ||
    typeof err.response !== "object" ||
    !("data" in err.response)
  ) {
    return undefined;
  }
  const data = (err.response as { data?: { message?: unknown } }).data;
  const msg = typeof data?.message === "string" ? data.message.trim() : "";
  if (!msg || msg.length > 160) return undefined;
  if (/neon|render|postgres|jwt|localStorage|waking|ground station/i.test(msg)) {
    return undefined;
  }
  return msg;
}

export function authFailureMessage(err: unknown): string {
  const fromApi = apiMessage(err);
  const status = httpStatus(err);
  const errCode = code(err);

  if (status === 401 || status === 403) {
    return fromApi || "Credentials not recognized.";
  }
  if (status === 409) {
    return fromApi || "This email is already on the book.";
  }
  if (status === 429) {
    return fromApi || "Too many attempts. Wait a moment.";
  }
  if (
    status === 502 ||
    status === 503 ||
    errCode === "ECONNABORTED" ||
    errCode === "ERR_NETWORK" ||
    errCode === "ECONNREFUSED"
  ) {
    return "Desk unavailable. Try again.";
  }
  if (status && status >= 500) {
    return fromApi || "Authentication could not complete.";
  }
  if (!status) {
    return "Desk unavailable. Try again.";
  }
  return fromApi || "Authentication could not complete.";
}

export { httpStatus };
