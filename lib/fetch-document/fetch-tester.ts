"use server";
import { spawn } from "child_process";

interface FetchTesterResponse<T> {
  data: T | null;
  status: number;
  statusText: string;
  headers: Record<string, string>;
  responseTime: number;
  error?: string;
}

export async function FetchTester<T = any>(
  url: string,
  requestOptions: RequestInit
): Promise<FetchTesterResponse<T>> {
  const method = requestOptions.method || "GET";
  const headers = requestOptions.headers || {};
  const body = requestOptions.body;

  const curlArgs: string[] = ["-s", "-w", "\n%{http_code}", "-X", method];

  // Add headers
  for (const [key, value] of Object.entries(headers)) {
    curlArgs.push("-H", `${key}: ${value}`);
  }

  // Add body
  if (body && method !== "GET") {
    let jsonBody: string;
    try {
      jsonBody =
        typeof body === "string"
          ? JSON.stringify(JSON.parse(body))
          : JSON.stringify(body);
    } catch {
      jsonBody = typeof body === "string" ? body : String(body);
    }
    curlArgs.push("--data", jsonBody);
  }

  // Add URL
  curlArgs.push(url);

  const startTime = performance.now();

  return new Promise((resolve) => {
    const curl = spawn("curl", curlArgs);
    let stdout = "";
    let stderr = "";

    curl.stdout.on("data", (data) => {
      stdout += data.toString();
    });

    curl.stderr.on("data", (data) => {
      stderr += data.toString();
    });

    curl.on("close", (code) => {
      const endTime = performance.now();
      const responseTime = Math.round(endTime - startTime);

      const lines = stdout.split("\n").filter(Boolean);
      const statusCodeStr = lines[lines.length - 1].trim();
      const rawBody = lines.slice(0, -1).join("\n");
      const status = parseInt(statusCodeStr, 10);

      let data: T | null = null;
      try {
        data = rawBody ? JSON.parse(rawBody) : null;
      } catch {
        data = rawBody as unknown as T;
      }

      resolve({
        data,
        status,
        statusText: stderr || "Status from curl",
        headers: {},
        responseTime,
        error: code !== 0 ? `Exited with code ${code}` : undefined,
      });
    });
  });
}
