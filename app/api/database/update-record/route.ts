import { NextResponse } from "next/server";
import { Client } from "pg";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      host,
      port,
      user,
      password,
      database,
      table,
      columns,
      original,
      updated,
    } = body;
    const client = new Client({
      host,
      port: Number(port),
      user,
      password,
      database,
    });
    await client.connect();

    // Find primary key or fallback to all columns as identifier
    let pk = columns.find((col: any) => col.is_primary);
    let whereClause = "";
    let values: any[] = [];
    if (pk) {
      whereClause = `"${pk.name}" = $1`;
      values.push(original[pk.name]);
    } else {
      // fallback: match all columns
      whereClause = columns
        .map((col: any, i: number) => `"${col.name}" = $${i + 1}`)
        .join(" AND ");
      values = columns.map((col: any) => original[col.name]);
    }

    // Prepare SET clause
    const setCols = columns.map(
      (col: any, i: number) => `"${col.name}" = $${i + 1 + values.length}`
    );
    const setValues = columns.map((col: any) => updated[col.name]);
    const sql = `UPDATE "${table}" SET ${setCols.join(
      ", "
    )} WHERE ${whereClause}`;
    await client.query(sql, [...values, ...setValues]);
    await client.end();
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to update record" },
      { status: 500 }
    );
  }
}
