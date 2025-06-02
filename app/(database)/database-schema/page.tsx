"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from "@/components/ui/card";
import { Header } from "@/components/header";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Database } from "lucide-react";

type Column = {
  name: string;
  type: string;
  nullable: boolean;
  default: string | null;
};

type TableSchema = {
  name: string;
  columns: Column[];
};

type DbConfig = {
  host: string;
  port: string;
  user: string;
  password: string;
  database: string;
};

type RecordType = { [key: string]: any };

export default function DatabaseSchemaPage() {
  const [tables, setTables] = useState<TableSchema[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [tableRecords, setTableRecords] = useState<RecordType[]>([]);
  const [recordsLoading, setRecordsLoading] = useState(false);
  const [recordsError, setRecordsError] = useState<string | null>(null);
  const [showRecordDetailDialog, setShowRecordDetailDialog] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<RecordType | null>(null);
  const [editRecord, setEditRecord] = useState<RecordType | null>(null);
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [editSuccess, setEditSuccess] = useState<string | null>(null);

  // Dialog state
  const [showDialog, setShowDialog] = useState(false);
  const [dbConfig, setDbConfig] = useState<DbConfig>({
    host: "",
    port: "5432",
    user: "",
    password: "",
    database: "",
  });

  // Validation state
  const [validation, setValidation] = useState({
    host: true,
    port: true,
    user: true,
    password: true,
    database: true,
  });

  // Open dialog if no config in localStorage
  useEffect(() => {
    const saved = localStorage.getItem("db_config");
    if (saved) {
      setDbConfig(JSON.parse(saved));
    } else {
      setShowDialog(true);
    }
  }, []);

  useEffect(() => {
    if (!dbConfig.host || !dbConfig.user || !dbConfig.database) return;
    const fetchSchema = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/database/schema", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(dbConfig),
        });
        if (!res.ok) throw new Error("Failed to fetch schema");
        const data = await res.json();
        setTables(data.tables || []);
        if (data.tables && data.tables.length > 0) {
          setSelectedTable(data.tables[0].name);
        }
      } catch (err: any) {
        setError(err.message || "Unknown error");
      } finally {
        setLoading(false);
      }
    };
    fetchSchema();
  }, [dbConfig]);

  // Fetch records when selectedTable changes
  useEffect(() => {
    if (!selectedTable) {
      setTableRecords([]);
      return;
    }
    setRecordsLoading(true);
    setRecordsError(null);
    fetch("/api/database/records", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...dbConfig, table: selectedTable }),
    })
      .then(async (res) => {
        if (!res.ok) throw new Error("Failed to fetch records");
        const data = await res.json();
        setTableRecords(data.records || []);
      })
      .catch((err) => setRecordsError(err.message || "Unknown error"))
      .finally(() => setRecordsLoading(false));
  }, [selectedTable, dbConfig]);

  const selected = tables.find((t) => t.name === selectedTable);

  const validate = () => {
    const isHost = !!dbConfig.host.trim();
    const isPort = /^\d+$/.test(dbConfig.port.trim());
    const isUser = !!dbConfig.user.trim();
    const isDatabase = !!dbConfig.database.trim();
    setValidation({
      host: isHost,
      port: isPort,
      user: isUser,
      password: true,
      database: isDatabase,
    });
    return isHost && isPort && isUser && isDatabase;
  };

  const handleDialogSave = () => {
    if (!validate()) return;
    localStorage.setItem("db_config", JSON.stringify(dbConfig));
    setShowDialog(false);
  };

  // Helper to show meta info
  const meta = [
    { label: "Host", value: dbConfig.host },
    { label: "Port", value: dbConfig.port },
    { label: "Database", value: dbConfig.database },
    { label: "User", value: dbConfig.user },
  ];

  // Example: Add more meta data for each card
  const metaCards = [
    {
      title: "Connection",
      items: [
        { label: "Host", value: dbConfig.host },
        { label: "Port", value: dbConfig.port },
      ],
    },
    {
      title: "Database",
      items: [
        { label: "Database", value: dbConfig.database },
        { label: "User", value: dbConfig.user },
      ],
    },
    {
      title: "Query Editor",
      items: [],
    },
  ];

  // Query Editor state
  const [query, setQuery] = useState("");
  const [queryResult, setQueryResult] = useState<any>(null);
  const [queryError, setQueryError] = useState<string | null>(null);
  const [queryLoading, setQueryLoading] = useState(false);

  // Add this state to control which table to show in main content
  const [showQueryResult, setShowQueryResult] = useState(false);

  // Update handleRunQuery to show query result in main content
  const handleRunQuery = async (e: React.FormEvent) => {
    e.preventDefault();
    setQueryLoading(true);
    setQueryError(null);
    setQueryResult(null);
    try {
      const res = await fetch("/api/database/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...dbConfig, query }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Query failed");
      setQueryResult(data);
      setShowQueryResult(true); // Show query result in main content
    } catch (err: any) {
      setQueryError(err.message || "Query failed");
      setShowQueryResult(false);
    } finally {
      setQueryLoading(false);
    }
  };

  // When a table is selected, reset query result view
  const handleSelectTable = (tableName: string) => {
    setSelectedTable(tableName);
    setShowQueryResult(false); // Hide query result and show table records
  };

  // When opening the dialog, set editRecord to a copy of selectedRecord
  useEffect(() => {
    if (showRecordDetailDialog && selectedRecord) {
      setEditRecord({ ...selectedRecord });
      setEditError(null);
      setEditSuccess(null);
    }
  }, [showRecordDetailDialog, selectedRecord]);

  // Handle input change for editing
  const handleEditChange = (col: string, value: string) => {
    setEditRecord((prev) => (prev ? { ...prev, [col]: value } : prev));
  };

  // Handle save
  const handleSaveRecord = async () => {
    if (!selectedTable || !selected || !editRecord) return;
    setEditLoading(true);
    setEditError(null);
    setEditSuccess(null);
    try {
      const res = await fetch("/api/database/update-record", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...dbConfig,
          table: selectedTable,
          columns: selected.columns,
          original: selectedRecord,
          updated: editRecord,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Update failed");
      setEditSuccess("Record updated successfully.");
      setSelectedRecord(editRecord); // Update the dialog view
      // Optionally, refresh the table records
      setTableRecords((prev) =>
        prev.map((rec) => (rec === selectedRecord ? editRecord : rec))
      );
    } catch (err: any) {
      setEditError(err.message || "Update failed");
    } finally {
      setEditLoading(false);
    }
  };

  return (
    <div className="h-full max-w-screen bg-gray-50 p-4">
      {/* Database Meta Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 ">
        {metaCards.map((card) =>
          card.title !== "Query Editor" ? (
            <Card
              key={card.title}
              className="rounded-lg shadow border px-6 py-4"
            >
              <div className="font-semibold text-gray-700">{card.title}</div>
              <div className="flex flex-wrap gap-4 items-center">
                {card.items.map((item) => (
                  <div key={item.label} className="flex flex-col">
                    <span className="text-xs text-gray-500">{item.label}</span>
                    <span className="font-medium text-gray-800 break-all">
                      {item.value || <span className="text-gray-400">-</span>}
                    </span>
                  </div>
                ))}
              </div>
            </Card>
          ) : (
            <Card
              key={card.title}
              className="rounded-lg shadow border px-6 py-4"
            >
              <div className="font-semibold text-gray-700 mb-2">
                {card.title}
              </div>
              <form onSubmit={handleRunQuery} className="space-y-2">
                <textarea
                  className="w-full rounded border px-2 py-1 font-mono text-sm uppercase"
                  rows={3}
                  placeholder="Write your SQL query here..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  required
                />
                <div className="flex items-center gap-2">
                  <Button
                    type="submit"
                    className="rounded bg-gray-900 hover:bg-gray-700 text-white font-semibold"
                    disabled={queryLoading || !query.trim()}
                  >
                    {queryLoading ? "Running..." : "Run"}
                  </Button>
                  {queryError && (
                    <span className="text-xs text-red-500">{queryError}</span>
                  )}
                </div>
              </form>
            </Card>
          )
        )}
      </div>

      <div className="py-4 flex gap-8">
        {/* Sidebar */}
        <aside className="w-60  shrink-0">
          <Card className="rounded-lg shadow border ">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base font-semibold">Tables</CardTitle>
              <Button
                size="sm"
                variant="outline"
                className="ml-2 px-2 py-1 rounded border-gray-300 text-gray-700 hover:bg-gray-100"
                onClick={() => setShowDialog(true)}
              >
                Change
              </Button>
            </CardHeader>
            <CardContent className="h-screen overflow-scroll">
              {loading && <div className="text-gray-400">Loading...</div>}
              {error && <div className="text-red-500">{error}</div>}
              {!loading && !error && tables.length === 0 && (
                <div className="text-gray-400 italic">No tables found.</div>
              )}
              <ul className="space-y-1">
                {tables.map((table) => (
                  <li key={table.name}>
                    <button
                      className={`w-full text-left px-3 py-2 rounded transition ${
                        selectedTable === table.name
                          ? "bg-gray-100 font-semibold border border-gray-300"
                          : "hover:bg-gray-50"
                      }`}
                      onClick={() => handleSelectTable(table.name)}
                    >
                      {table.name}
                      <span className="ml-2 text-xs text-gray-400">
                        ({table.columns.length})
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </aside>
        {/* Main Content */}
        <main className="flex-1 ">
          <Card className="rounded-lg max-w-3/4 overflow-scroll  shadow border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                {showQueryResult
                  ? "Query Result"
                  : selected?.name || "Database Schema"}
              </CardTitle>
              <CardDescription>
                {showQueryResult
                  ? "Result of your SQL query"
                  : selected
                  ? `Records for table "${selected.name}"`
                  : "All tables and columns in your connected PostgreSQL database."}
              </CardDescription>
            </CardHeader>
            <CardContent className="h-screen ">
              {showQueryResult ? (
                queryLoading ? (
                  <div className="text-gray-500">Loading query result...</div>
                ) : queryError ? (
                  <div className="text-red-500">{queryError}</div>
                ) : queryResult && queryResult.rows ? (
                  <div className="overflow-x-auto rounded border border-gray-200 shadow-sm">
                    <table className="min-w-full text-sm bg-white rounded">
                      <thead>
                        <tr className="bg-gray-50">
                          {Object.keys(queryResult.rows[0] || {}).map((col) => (
                            <th
                              key={col}
                              className="text-left px-3 py-2 font-medium"
                            >
                              {col}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {queryResult.rows.length === 0 ? (
                          <tr>
                            <td
                              colSpan={
                                Object.keys(queryResult.rows[0] || {}).length
                              }
                              className="text-center text-gray-400 py-4"
                            >
                              No results.
                            </td>
                          </tr>
                        ) : (
                          queryResult.rows.map((row: any, idx: number) => (
                            <tr key={idx} className="even:bg-gray-50">
                              {Object.keys(row).map((col) => (
                                <td key={col} className="px-3 py-2">
                                  {String(row[col])}
                                </td>
                              ))}
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                ) : null
              ) : recordsLoading ? (
                <div className="text-gray-500">Loading records...</div>
              ) : recordsError ? (
                <div className="text-red-500">{recordsError}</div>
              ) : selected ? (
                <div className="overflow-x-auto rounded border border-gray-200 shadow-sm">
                  <table className="w-screen text-sm bg-white rounded">
                    <thead>
                      <tr className="bg-gray-50">
                        {selected.columns.map((col) => (
                          <th
                            key={col.name}
                            className="text-left px-3 py-2 font-medium"
                          >
                            {col.name}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {tableRecords.length === 0 ? (
                        <tr>
                          <td
                            colSpan={selected.columns.length}
                            className="text-center text-gray-400 py-4"
                          >
                            No records found.
                          </td>
                        </tr>
                      ) : (
                        tableRecords.map((row, idx) => (
                          <tr
                            key={idx}
                            className="even:bg-gray-50 cursor-pointer hover:bg-gray-100"
                            onClick={() => {
                              setSelectedRecord(row);
                              setShowRecordDetailDialog(true);
                            }}
                          >
                            {selected.columns.map((col) => (
                              <td key={col.name} className="px-3 py-2">
                                {row[col.name] !== null &&
                                row[col.name] !== undefined ? (
                                  String(row[col.name])
                                ) : (
                                  <span className="text-gray-400">-</span>
                                )}
                              </td>
                            ))}
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              ) : null}
            </CardContent>
          </Card>
        </main>
      </div>

      {/* Record Detail Dialog */}
      <Dialog
        open={showRecordDetailDialog}
        onOpenChange={setShowRecordDetailDialog}
      >
        <DialogContent className="w-full max-w-lg rounded-lg p-6">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-semibold">
              Record Details
            </DialogTitle>
          </DialogHeader>
          <form
            className="space-y-2"
            onSubmit={(e) => {
              e.preventDefault();
              handleSaveRecord();
            }}
          >
            {selected && editRecord ? (
              selected.columns.map((col) => {
                const value = editRecord[col.name];
                // Boolean type
                if (col.type === "boolean" || col.type === "bool") {
                  return (
                    <div
                      key={col.name}
                      className="flex justify-between items-center border-b py-2 gap-2"
                    >
                      <span className="text-gray-600 font-medium w-1/3">
                        {col.name}
                      </span>
                      <select
                        className="w-2/3 px-2 py-1 rounded border text-right"
                        value={
                          value === true || value === "true"
                            ? "true"
                            : value === false || value === "false"
                            ? "false"
                            : ""
                        }
                        onChange={(e) =>
                          handleEditChange(col.name, e.target.value)
                        }
                        disabled={editLoading}
                      >
                        <option value="">Select</option>
                        <option value="true">True</option>
                        <option value="false">False</option>
                      </select>
                    </div>
                  );
                }
                // Number type
                if (
                  col.type.includes("int") ||
                  col.type === "numeric" ||
                  col.type === "float" ||
                  col.type === "double" ||
                  col.type === "real" ||
                  col.type === "decimal"
                ) {
                  return (
                    <div
                      key={col.name}
                      className="flex justify-between items-center border-b py-2 gap-2"
                    >
                      <span className="text-gray-600 font-medium w-1/3">
                        {col.name}
                      </span>
                      <Input
                        type="number"
                        className="w-2/3 px-2 py-1 rounded border text-right"
                        value={value !== null && value !== undefined ? value : ""}
                        onChange={(e) =>
                          handleEditChange(
                            col.name,
                            e.target.value
                          )
                        }
                        disabled={editLoading}
                      />
                    </div>
                  );
                }
                // Date/time type
                if (
                  col.type.includes("date") ||
                  col.type.includes("time") ||
                  col.type === "timestamp"
                ) {
                  return (
                    <div
                      key={col.name}
                      className="flex justify-between items-center border-b py-2 gap-2"
                    >
                      <span className="text-gray-600 font-medium w-1/3">
                        {col.name}
                      </span>
                      <Input
                        type="datetime-local"
                        className="w-2/3 px-2 py-1 rounded border text-right"
                        value={
                          value
                            ? new Date(value).toISOString().slice(0, 16)
                            : ""
                        }
                        onChange={(e) => handleEditChange(col.name, e.target.value)}
                        disabled={editLoading}
                      />
                    </div>
                  );
                }
                // Default: text input
                return (
                  <div
                    key={col.name}
                    className="flex justify-between items-center border-b py-2 gap-2"
                  >
                    <span className="text-gray-600 font-medium w-1/3">
                      {col.name}
                    </span>
                    <Input
                      className="w-2/3 px-2 py-1 rounded border text-right"
                      value={value !== null && value !== undefined ? value : ""}
                      onChange={(e) => handleEditChange(col.name, e.target.value)}
                      disabled={editLoading}
                    />
                  </div>
                );
              })
            ) : (
              <div className="text-gray-400">No record selected.</div>
            )}
            {editError && <div className="text-xs text-red-500">{editError}</div>}
            {editSuccess && (
              <div className="text-xs text-green-600">{editSuccess}</div>
            )}
            <DialogFooter className="pt-2">
              <Button
                type="submit"
                className="rounded bg-gray-900 hover:bg-gray-700 text-white font-semibold"
                disabled={editLoading}
              >
                {editLoading ? "Saving..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Database Config Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="w-full max-w-xs rounded-lg p-6">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-semibold">
              <Database className="h-5 w-5" />
              Connect to PostgreSQL
            </DialogTitle>
            <DialogDescription className="text-xs text-gray-500">
              Enter your database connection info.
            </DialogDescription>
          </DialogHeader>
          <form
            className="space-y-2"
            onSubmit={(e) => {
              e.preventDefault();
              handleDialogSave();
            }}
          >
            <Input
              placeholder="Host"
              value={dbConfig.host}
              onChange={(e) =>
                setDbConfig({ ...dbConfig, host: e.target.value })
              }
              autoFocus
              className={`rounded ${!validation.host ? "border-red-500" : ""}`}
            />
            {!validation.host && (
              <div className="text-xs text-red-500 ml-1">Host is required.</div>
            )}
            <div className="flex gap-2">
              <Input
                placeholder="Port"
                value={dbConfig.port}
                onChange={(e) =>
                  setDbConfig({ ...dbConfig, port: e.target.value })
                }
                className={`w-1/3 rounded ${
                  !validation.port ? "border-red-500" : ""
                }`}
              />
              <Input
                placeholder="Database"
                value={dbConfig.database}
                onChange={(e) =>
                  setDbConfig({ ...dbConfig, database: e.target.value })
                }
                className={`w-2/3 rounded ${
                  !validation.database ? "border-red-500" : ""
                }`}
              />
            </div>
            {!validation.port && (
              <div className="text-xs text-red-500 ml-1">
                Port must be a number.
              </div>
            )}
            {!validation.database && (
              <div className="text-xs text-red-500 ml-1">
                Database is required.
              </div>
            )}
            <Input
              placeholder="User"
              value={dbConfig.user}
              onChange={(e) =>
                setDbConfig({ ...dbConfig, user: e.target.value })
              }
              className={`rounded ${!validation.user ? "border-red-500" : ""}`}
            />
            {!validation.user && (
              <div className="text-xs text-red-500 ml-1">User is required.</div>
            )}
            <Input
              placeholder="Password"
              type="password"
              value={dbConfig.password}
              onChange={(e) =>
                setDbConfig({ ...dbConfig, password: e.target.value })
              }
              className="rounded"
            />
            <DialogFooter className="pt-2">
              <Button
                type="submit"
                className="w-full rounded bg-gray-900 hover:bg-gray-700 text-white font-semibold"
                disabled={
                  !dbConfig.host ||
                  !dbConfig.user ||
                  !dbConfig.database ||
                  !/^\d+$/.test(dbConfig.port)
                }
              >
                Connect
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// --- API Route needed ---
// Create app/api/database/query/route.ts with the following:

// import { NextResponse } from "next/server";
// import { Client } from "pg";

// export async function POST(req: Request) {
//   try {
//     const body = await req.json();
//     const config = {
//       host: body.host,
//       port: Number(body.port) || 5432,
//       user: body.user,
//       password: body.password,
//       database: body.database,
//     };
//     const query = body.query;
//     const client = new Client(config);
//     await client.connect();
//     const result = await client.query(query);
//     await client.end();
//     return NextResponse.json({ rows: result.rows });
//   } catch (error: any) {
//     return NextResponse.json({ error: error.message || "Failed to run query" }, { status: 500 });
//   }
// }
