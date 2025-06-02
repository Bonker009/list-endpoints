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
    const query = body.query;
    const client = new Client(config);
    await client.connect();
    const result = await client.query(query);
    await client.end();
    return NextResponse.json({ rows: result.rows });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to run query" },
      { status: 500 }
    );
  }
}
