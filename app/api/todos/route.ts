import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAuthUser } from "@/lib/session";

export async function GET() {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const todos = await db.todo.findMany({
    where: { userId: user.userId },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(todos);
}

export async function POST(req: NextRequest) {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { text } = await req.json();
  if (!text || typeof text !== "string" || !text.trim()) {
    return NextResponse.json(
      { error: "テキストを入力してください" },
      { status: 400 }
    );
  }

  const todo = await db.todo.create({
    data: { text: text.trim(), userId: user.userId },
  });
  return NextResponse.json(todo, { status: 201 });
}
