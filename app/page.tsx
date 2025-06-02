"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Header } from "@/components/header";
import { Skeleton } from "@/components/ui/skeleton";
import { listSpecs, deleteSpec } from "@/lib/data-service";
import { FileText, Plus, Upload, BarChart } from "lucide-react";

type ApiSpec = {
  id: string;
  title: string;
  version: string;
  lastModified: string;
};

export default function Home() {
  const [specs, setSpecs] = useState<ApiSpec[]>([]);
  const [loading, setLoading] = useState(true);

  // Helper to get unique display names with (1), (2), ...
  const getDisplayNames = (specs: ApiSpec[]) => {
    const nameCount: Record<string, number> = {};
    return specs.map((spec) => {
      let base = spec.title || "Untitled";
      if (!nameCount[base]) {
        nameCount[base] = 1;
        return { ...spec, displayTitle: base };
      } else {
        nameCount[base]++;
        return { ...spec, displayTitle: `${base} (${nameCount[base]})` };
      }
    });
  };

  useEffect(() => {
    async function loadSpecs() {
      try {
        setLoading(true);
        const specsList = await listSpecs();
        setSpecs(specsList);
      } catch (error) {
        console.error("Failed to load specs:", error);
      } finally {
        setLoading(false);
      }
    }

    loadSpecs();
  }, []);

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this API specification?")) {
      try {
        await deleteSpec(id);
        setSpecs((prev) => prev.filter((spec) => spec.id !== id));
      } catch (error) {
        alert("Failed to delete specification.");
      }
    }
  };

  // Use displayTitle for rendering
  const displaySpecs = getDisplayNames(specs);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header
        title="Poseidon"
        showBackButton={false}
        showHomeButton={false}
      />

      <main className="container mx-auto py-8 px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
          <Card>
            <CardHeader>
              <CardTitle>API Documentation</CardTitle>
              <CardDescription>
                View and manage your API endpoints
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-2">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
              ) : displaySpecs.length > 0 ? (
                <div className="space-y-2">
                  {displaySpecs.map((spec) => (
                    <div
                      key={spec.id}
                      className="border rounded-md overflow-hidden"
                    >
                      <div className="p-3 flex flex-col md:flex-row md:items-center justify-between bg-white">
                        <div className="flex items-center mb-2 md:mb-0">
                          <FileText className="h-5 w-5 mr-3 text-blue-500" />
                          <div>
                            <div className="font-medium">{spec.displayTitle}</div>
                            <div className="text-sm text-gray-500">
                              Version: {spec.version}
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2 mt-2 md:mt-0">
                          <Link href={`/documentation/${spec.id}`}>
                            <Button size="sm" className="bg-red-400 hover:bg-red-300">
                              View Docs
                            </Button>
                          </Link>
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-red-300 text-red-500 hover:bg-red-50"
                            onClick={() => handleDelete(spec.id)}
                          >
                            Delete
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 border-2 border-dashed rounded-md">
                  <p className="text-gray-500 mb-4">
                    No API specifications found
                  </p>
                  <Link href="/upload">
                    <Button className="bg-red-300 hover:bg-red-400 transform-fill duration-150">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Specification
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Upload OpenAPI Specification</CardTitle>
              <CardDescription>
                Upload or fetch your OpenAPI specification
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="mb-4">
                Upload your OpenAPI specification file or fetch it directly from
                your API.
              </p>
              <Link href="/upload">
                <Button className="bg-red-400 hover:bg-red-300">
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Specification
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
