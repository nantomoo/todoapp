import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { hashPassword } from "@/lib/password";
import { signToken } from "@/lib/jwt";

const DUMMY_SALT = "00000000000000000000000000000000";
const GENERIC_ERROR = "ユーザー名またはパスワードが正しくありません";

export async function POST(req: NextRequest) {
  const { username, password } = await req.json();

  const user = await db.user.findUnique({ where: { username } });
  // ユーザーが存在しない場合もダミーsaltでハッシュ計算し、タイミング攻撃を防ぐ
  const salt = user?.salt ?? DUMMY_SALT;
  const hash = await hashPassword(password, salt);

  if (!user || hash !== user.passwordHash) {
    return NextResponse.json({ error: GENERIC_ERROR }, { status: 401 });
  }

  const token = await signToken({ userId: user.id, username: user.username });

  const res = NextResponse.json({ ok: true, username: user.username });
  res.cookies.set("session", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7, // 7日
    path: "/",
  });
  return res;
}
