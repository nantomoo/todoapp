import { NextRequest, NextResponse } from "next/server";
import { SignJWT } from "jose";
import { db } from "@/lib/db";
import { hashPassword } from "@/lib/password";

function getSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET が設定されていません");
  return new TextEncoder().encode(secret);
}

export async function POST(req: NextRequest) {
  const { username, securityAnswer } = await req.json();

  if (!username || !securityAnswer) {
    return NextResponse.json({ error: "入力が不足しています" }, { status: 400 });
  }

  const user = await db.user.findUnique({ where: { username } });
  if (!user) {
    return NextResponse.json({ error: "認証に失敗しました" }, { status: 401 });
  }

  const answerHash = await hashPassword(securityAnswer.trim().toLowerCase(), user.securityAnswerSalt);
  if (answerHash !== user.securityAnswerHash) {
    return NextResponse.json({ error: "認証に失敗しました" }, { status: 401 });
  }

  // パスワード再設定用の短命トークン（15分）
  const resetToken = await new SignJWT({ userId: user.id, purpose: "password-reset" })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("15m")
    .sign(getSecret());

  return NextResponse.json({ resetToken });
}
