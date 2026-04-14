import { cookies } from "next/headers";
import { verifyToken, type JWTPayload } from "./jwt";

export async function getAuthUser(): Promise<JWTPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("session")?.value;
  if (!token) return null;
  return verifyToken(token);
}
