import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { generateSalt, hashPassword } from "@/lib/password";

export async function POST(req: NextRequest) {
  const { username, password } = await req.json();

  if (!/^[a-zA-Z0-9_]{2,20}$/.test(username)) {
    return NextResponse.json(
      { error: "ユーザー名は2〜20文字の英数字・アンダースコアで入力してください" },
      { status: 400 }
    );
  }
  if (typeof password !== "string" || password.length < 8) {
    return NextResponse.json(
      { error: "パスワードは8文字以上で入力してください" },
      { status: 400 }
    );
  }

  const existing = await db.user.findUnique({ where: { username } });
  if (existing) {
    return NextResponse.json(
      { error: "このユーザー名はすでに使われています" },
      { status: 409 }
    );
  }

  const salt = generateSalt();
  const passwordHash = await hashPassword(password, salt);
  await db.user.create({ data: { username, passwordHash, salt } });

  return NextResponse.json({ ok: true }, { status: 201 });
}
