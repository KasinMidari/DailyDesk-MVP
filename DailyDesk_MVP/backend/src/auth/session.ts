import { jwtVerify, SignJWT } from "jose";

const ALG = "HS256";
const TTL = "7d";

export async function signSession(userId: string, secret: string) {
  return new SignJWT({})
    .setProtectedHeader({ alg: ALG })
    .setSubject(userId)
    .setIssuedAt()
    .setExpirationTime(TTL)
    .sign(new TextEncoder().encode(secret));
}

/** Trả về userId nếu token hợp lệ, ngược lại null. */
export async function verifySession(token: string, secret: string): Promise<string | null> {
  try {
    const { payload } = await jwtVerify(token, new TextEncoder().encode(secret), { algorithms: [ALG] });
    return typeof payload.sub === "string" ? payload.sub : null;
  } catch {
    return null;
  }
}
