export interface RunTestCaseResult {
  status: number | string;
  ok: boolean;
  response: any;
}

export async function runTestCase(
  testCase: any,
  apiUrl: string,
  token?: string
): Promise<RunTestCaseResult> {
  try {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
    const response = await fetch(apiUrl, {
      method: "POST",
      headers,
      body: JSON.stringify(testCase.body),
    });
    const data = await response.json().catch(() => ({}));
    return {
      status: response.status,
      ok: response.ok,
      response: data,
    };
  } catch (error) {
    return {
      status: "error",
      ok: false,
      response: String(error),
    };
  }
}
