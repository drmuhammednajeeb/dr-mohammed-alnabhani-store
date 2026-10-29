import crypto from "node:crypto";

// Admin credentials come from environment variables (see .env.example).
// Defaults exist only for local development.
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "bizmind2026";
const ADMIN_SECRET = process.env.ADMIN_SECRET || "bizmind-secret-change-me";
const TOKEN_TTL_MS = 12 * 60 * 60 * 1000; // 12 hours

function sign(payload: string): string {
  return crypto.createHmac("sha256", ADMIN_SECRET).update(payload).digest("hex");
}

export function verifyPassword(password: string): boolean {
  return (
    typeof password === "string" &&
    password.length > 0 &&
    crypto.timingSafeEqual(
      Buffer.from(password.padEnd(64, "\0").slice(0, 64)),
      Buffer.from(ADMIN_PASSWORD.padEnd(64, "\0").slice(0, 64)),
    )
  );
}

export function issueToken(): string {
  const payload = Buffer.from(
    JSON.stringify({ exp: Date.now() + TOKEN_TTL_MS }),
  ).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

export function verifyToken(token: string | undefined): boolean {
  if (!token) return false;
  const [payload, signature] = token.split(".");
  if (!payload || !signature) return false;
  const expected = sign(payload);
  if (
    expected.length !== signature.length ||
    !crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature))
  ) {
    return false;
  }
  try {
    const decoded = JSON.parse(Buffer.from(payload, "base64url").toString());
    return typeof decoded.exp === "number" && decoded.exp > Date.now();
  } catch {
    return false;
  }
}

export function isAdminRequest(req: { headers: Record<string, unknown> }): boolean {
  const auth = req.headers["authorization"];
  if (typeof auth !== "string") return false;
  const m = auth.match(/^Bearer (.+)$/);
  return m ? verifyToken(m[1]) : false;
}
