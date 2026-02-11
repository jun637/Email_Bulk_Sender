import { NextResponse } from "next/server";
import { getAuthClient } from "@/lib/auth";
import { listDrafts } from "@/lib/gmail";

export async function GET() {
  const auth = await getAuthClient();
  if (!auth) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  try {
    const drafts = await listDrafts(auth);
    return NextResponse.json(drafts);
  } catch (error) {
    console.error("Failed to list drafts:", error);
    return NextResponse.json(
      { error: "Failed to list drafts" },
      { status: 500 }
    );
  }
}
