import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const sql = getDb();

    const [row] = await sql`
      SELECT report_json, status FROM assessments WHERE id = ${id}
    `;

    if (!row) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    if (row.status !== "complete") {
      return NextResponse.json({ status: row.status });
    }

    return NextResponse.json({ status: "complete", report: row.report_json });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
