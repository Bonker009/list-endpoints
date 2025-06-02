"use server";
export async function fetchApiSpecFromUrl(
  apiUrl: string
): Promise<{ spec: string; name: string }> {
  const response = await fetch(apiUrl);

  if (!response.ok) {
    console.error(response.status, response.statusText);
    throw new Error(
      `Failed to fetch API spec: ${response.status} ${response.statusText}`
    );
  }
  console.log("Response:", response);
  const data = await response.json();
  const spec = JSON.stringify(data, null, 2);

  const urlParts = apiUrl.split("/");
  const hostPart = urlParts[2];
  const name = hostPart ? hostPart.split(":")[0] : "default";

  return { spec, name };
}
