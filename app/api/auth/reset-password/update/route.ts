import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { db } from "@/lib/db";
import { generateSalt, hashPassword } from "@/lib/password";

function getSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET が設定されていません");
  return new TextEncoder().encode(secret);
}

export async function POST(req: NextRequest) {
  const { resetToken, newPassword } = await req.json();

  if (!resetToken || !newPassword) {
    return NextResponse.json({ error: "入力が不足しています" }, { status: 400 });
  }
  if (newPassword.length < 8) {
    return NextResponse.json({ error: "パスワードは8文字以上で入力してください" }, { status: 400 });
  }

  let payload: { userId: string; purpose: string };
  try {
    const result = await jwtVerify(resetToken, getSecret());
    payload = result.payload as { userId: string; purpose: string };
  } catch {
    return NextResponse.json({ error: "トークンが無効または期限切れです" }, { status: 401 });
  }

  if (payload.purpose !== "password-reset") {
    return NextResponse.json({ error: "無効なトークンです" }, { status: 401 });
  }

  const salt = generateSalt();
  const passwordHash = await hashPassword(newPassword, salt);

  await db.user.update({
    where: { id: payload.userId },
    data: { passwordHash, salt },
  });

  return NextResponse.json({ ok: true });
}
