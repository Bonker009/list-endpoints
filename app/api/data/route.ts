import { type NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { mkdir } from "fs/promises";

const DATA_DIR = path.join(process.cwd(), "data");
const SPECS_DIR = path.join(DATA_DIR, "specs");
const STATUS_DIR = path.join(DATA_DIR, "status");
const SETTINGS_DIR = path.join(DATA_DIR, "settings");

async function ensureDirectories() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      await mkdir(DATA_DIR, { recursive: true });
    }

    if (!fs.existsSync(SPECS_DIR)) {
      await mkdir(SPECS_DIR);
    }

    if (!fs.existsSync(STATUS_DIR)) {
      await mkdir(STATUS_DIR);
    }

    if (!fs.existsSync(SETTINGS_DIR)) {
      await mkdir(SETTINGS_DIR);
    }

    return true;
  } catch (error) {
    console.error("Error creating directories:", error);
    return false;
  }
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const type = searchParams.get("type");
  const id = searchParams.get("id") || "default";

  if (!type) {
    return NextResponse.json(
      { error: "Missing type parameter" },
      { status: 400 }
    );
  }

  try {
    let filePath: string;

    switch (type) {
      case "spec":
        filePath = path.join(SPECS_DIR, `${id}.json`);
        break;
      case "status":
        filePath = path.join(STATUS_DIR, `${id}.json`);
        break;
      case "settings":
        filePath = path.join(SETTINGS_DIR, `${id}.json`);
        break;
      default:
        return NextResponse.json(
          { error: "Invalid type parameter" },
          { status: 400 }
        );
    }

    if (!fs.existsSync(filePath)) {
      if (type === "spec") {
        return NextResponse.json(
          { error: "Specification not found" },
          { status: 404 }
        );
      }

      return NextResponse.json({});
    }

    const data = fs.readFileSync(filePath, "utf-8");
    return NextResponse.json(JSON.parse(data));
  } catch (error) {
    console.error(`Error reading ${type} data:`, error);
    return NextResponse.json(
      { error: `Failed to read ${type} data` },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, id = "default", data } = body;

    if (!type || !data) {
      return NextResponse.json(
        { error: "Missing required parameters" },
        { status: 400 }
      );
    }

    let filePath: string;

    switch (type) {
      case "spec":
        filePath = path.join(SPECS_DIR, `${id}.json`);
        break;
      case "status":
        filePath = path.join(STATUS_DIR, `${id}.json`);
        break;
      case "settings":
        filePath = path.join(SETTINGS_DIR, `${id}.json`);
        break;
      default:
        return NextResponse.json(
          { error: "Invalid type parameter" },
          { status: 400 }
        );
    }

    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error saving data:", error);
    return NextResponse.json({ error: "Failed to save data" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const type = searchParams.get("type");
  const id = searchParams.get("id") || "default";

  if (!type) {
    return NextResponse.json(
      { error: "Missing type parameter" },
      { status: 400 }
    );
  }

  try {
    let filePath: string;

    switch (type) {
      case "spec":
        filePath = path.join(SPECS_DIR, `${id}.json`);
        break;
      case "status":
        filePath = path.join(STATUS_DIR, `${id}.json`);
        break;
      case "settings":
        filePath = path.join(SETTINGS_DIR, `${id}.json`);
        break;
      default:
        return NextResponse.json(
          { error: "Invalid type parameter" },
          { status: 400 }
        );
    }

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(`Error deleting ${type} data:`, error);
    return NextResponse.json(
      { error: `Failed to delete ${type} data` },
      { status: 500 }
    );
  }
}
