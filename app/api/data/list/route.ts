import { type NextRequest, NextResponse } from "next/server"
import fs from "fs"
import path from "path"
 
const DATA_DIR = path.join(process.cwd(), "data")
const SPECS_DIR = path.join(DATA_DIR, "specs")

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const type = searchParams.get("type")

  if (!type) {
    return NextResponse.json({ error: "Missing type parameter" }, { status: 400 })
  }

  try {
    let dirPath: string

    switch (type) {
      case "spec":
        dirPath = SPECS_DIR
        break
      default:
        return NextResponse.json({ error: "Invalid type parameter" }, { status: 400 })
    }

    if (!fs.existsSync(dirPath)) {
      return NextResponse.json([])
    }

    const files = fs
      .readdirSync(dirPath)
      .filter((file) => file.endsWith(".json"))
      .map((file) => {
        const id = path.basename(file, ".json")
        const filePath = path.join(dirPath, file)
        const stats = fs.statSync(filePath)

        try {
          const data = JSON.parse(fs.readFileSync(filePath, "utf-8"))
          return {
            id,
            title: data.info?.title || id,
            version: data.info?.version || "unknown",
            lastModified: stats.mtime,
          }
        } catch (error) {
          return {
            id,
            title: id,
            version: "unknown",
            lastModified: stats.mtime,
            error: "Invalid JSON",
          }
        }
      })

    return NextResponse.json(files)
  } catch (error) {
    console.error(`Error listing ${type} data:`, error)
    return NextResponse.json({ error: `Failed to list ${type} data` }, { status: 500 })
  }
}
