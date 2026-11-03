import { createRemoteJWKSet, jwtVerify } from "jose";

const JWKS = createRemoteJWKSet(new URL("https://www.googleapis.com/oauth2/v3/certs"));
const ISSUERS = ["accounts.google.com", "https://accounts.google.com"];

export type GoogleProfile = { sub: string; email: string; name: string; picture: string | null };

/** Kiểm Google ID token (từ Google Identity Services). Lỗi → ném Error. */
export async function verifyGoogleIdToken(credential: string, clientId: string): Promise<GoogleProfile> {
  if (!clientId) throw new Error("GOOGLE_CLIENT_ID chưa được cấu hình");
  const { payload } = await jwtVerify(credential, JWKS, { issuer: ISSUERS, audience: clientId });
  if (payload.email_verified !== true || typeof payload.email !== "string") {
    throw new Error("Email Google chưa được xác minh");
  }
  return {
    sub: String(payload.sub),
    email: payload.email,
    name: typeof payload.name === "string" && payload.name ? payload.name : payload.email.split("@")[0]!,
    picture: typeof payload.picture === "string" ? payload.picture : null,
  };
}
