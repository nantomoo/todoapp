import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  const { username } = await req.json();

  if (!username) {
    return NextResponse.json({ error: "ユーザー名を入力してください" }, { status: 400 });
  }

  const user = await db.user.findUnique({ where: { username } });
  // ユーザーが存在しない場合も同じレスポンスを返しタイミング攻撃を防ぐ
  if (!user) {
    return NextResponse.json({ error: "ユーザーが見つかりません" }, { status: 404 });
  }

  return NextResponse.json({ securityQuestion: user.securityQuestion });
}
