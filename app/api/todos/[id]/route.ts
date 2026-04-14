import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAuthUser } from "@/lib/session";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const todo = await db.todo.findUnique({ where: { id } });
  if (!todo || todo.userId !== user.userId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = await req.json();
  const updated = await db.todo.update({
    where: { id },
    data: {
      ...(typeof body.completed === "boolean" && { completed: body.completed }),
      ...(typeof body.text === "string" &&
        body.text.trim() && { text: body.text.trim() }),
    },
  });
  return NextResponse.json(updated);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const todo = await db.todo.findUnique({ where: { id } });
  if (!todo || todo.userId !== user.userId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await db.todo.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
