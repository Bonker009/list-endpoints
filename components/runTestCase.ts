"use server";
import { exec } from "child_process";
import util from "util";

const execPromise = util.promisify(exec);

export interface TestCase {
  name: string;
  description: string;
  body: Record<string, any>;
  expectedStatus: number;
}

export interface TestCaseResult {
  name: string;
  status: number | string;
  ok: boolean;
  response: any;
}

export async function runTestCase(
  testCase: TestCase,
  apiUrl: string
): Promise<TestCaseResult> {
  console.log(`Running test case: ${testCase.name}`);
  console.log(apiUrl);
  try {
    // Safely stringify JSON and escape quotes
    const jsonBody = JSON.stringify(testCase.body).replace(/"/g, '\\"');

    // Use double quotes outside, escaped quotes inside
    const curlCmd = [
      `curl -s -w "\\n%{http_code}"`,
      `-X POST`,
      `-H "Content-Type: application/json"`,
      `-d "${jsonBody}"`,
      `"${apiUrl}"`,
    ].join(" ");

    console.log(`Executing command: ${curlCmd}`);

    const { stdout } = await execPromise(curlCmd);
    console.log(`Command output: ${stdout}`);

    const splitIndex = stdout.lastIndexOf("\n");
    const bodyStr = stdout.slice(0, splitIndex);
    const statusStr = stdout.slice(splitIndex + 1).trim();
    const status = parseInt(statusStr, 10);

    let data: any = {};
    try {
      data = JSON.parse(bodyStr);
    } catch {
      data = bodyStr;
    }

    return {
      name: testCase.name,
      status: isNaN(status) ? "error" : status,
      ok: status >= 200 && status < 300,
      response: data,
    };
  } catch (error) {
    return {
      name: testCase.name,
      status: "error",
      ok: false,
      response: String(error),
    };
  }
}

export async function runTestCases(
  testCases: TestCase[],
  apiUrl: string
): Promise<TestCaseResult[]> {
  const results: TestCaseResult[] = [];
  for (const testCase of testCases) {
    // eslint-disable-next-line no-await-in-loop
    const result = await runTestCase(testCase, apiUrl);
    results.push(result);
  }
  return results;
}
