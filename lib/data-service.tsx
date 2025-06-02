export type DataType = "spec" | "status" | "settings";

export async function fetchData(type: DataType, id = "default") {
  try {
    const response = await fetch(`/api/data?type=${type}&id=${id}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (response.status === 404) {
      return null;
    }

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to fetch data");
    }

    return await response.json();
  } catch (error) {
    console.error(`Error fetching ${type} data:`, error);

    if (type === "spec") {
      return null;
    }
    return {};
  }
}

export async function saveData(type: DataType, data: any, id = "default") {
  try {
    const response = await fetch("/api/data", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ type, id, data }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to save data");
    }

    return await response.json();
  } catch (error) {
    console.error(`Error saving ${type} data:`, error);
    throw error;
  }
}

export async function deleteData(type: DataType, id = "default") {
  try {
    const response = await fetch(`/api/data?type=${type}&id=${id}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to delete data");
    }

    return await response.json();
  } catch (error) {
    console.error(`Error deleting ${type} data:`, error);
    throw error;
  }
}

export async function listSpecs() {
  try {
    const response = await fetch("/api/data/list?type=spec", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to list specs");
    }

    return await response.json();
  } catch (error) {
    console.error("Error listing specs:", error);
    return [];
  }
}


export async function deleteSpec(id: string) {
  return deleteData("spec", id);
}
