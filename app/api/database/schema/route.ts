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

    const client = new Client(config);
    await client.connect();

    // Get all tables in public schema
    const tablesResult = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);

    const tables = [];

    for (const row of tablesResult.rows) {
      const tableName = row.table_name;
      const columnsResult = await client.query(
        `
        SELECT
          column_name,
          data_type,
          is_nullable,
          column_default
        FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = $1
        ORDER BY ordinal_position
        `,
        [tableName]
      );

      tables.push({
        name: tableName,
        columns: columnsResult.rows.map((col) => ({
          name: col.column_name,
          type: col.data_type,
          nullable: col.is_nullable === "YES",
          default: col.column_default,
        })),
      });
    }

    await client.end();
    return NextResponse.json({ tables });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to fetch schema" },
      { status: 500 }
    );
  }
}
