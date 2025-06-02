import { NextResponse } from "next/server";
import { Client } from "pg";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const config = {
      host: body.host,
      port: Number(body.port) || 5432,
      user: body.user,
      password: body.password,
      database: body.database,
    };
    const table = body.table;
    if (!table) {
      return NextResponse.json({ error: "Table name is required" }, { status: 400 });
    }

    const client = new Client(config);
    await client.connect();

    // Fetch all records from the table (no LIMIT)
    const query = `SELECT * FROM "${table}"`;
    const result = await client.query(query);

    await client.end();
    return NextResponse.json({ records: result.rows });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to fetch records" },
      { status: 500 }
    );
  }
}