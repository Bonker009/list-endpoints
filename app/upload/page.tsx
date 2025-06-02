"use client";

import type React from "react";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Header } from "@/components/header";
import { saveData } from "@/lib/data-service";
import { toast } from "sonner";
import { fetchApiSpecFromUrl } from "@/lib/fetch-document/document-service";

export default function UploadPage() {
  const router = useRouter();
  const [apiSpec, setApiSpec] = useState("");
  const [apiUrl, setApiUrl] = useState("http://localhost:8080/v3/api-docs");
  const [specName, setSpecName] = useState("default");
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      readFile(file);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      readFile(file);
    }
  };

  const readFile = (file: File) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      const content = e.target?.result as string;
      setApiSpec(content);

      const fileName = file.name.replace(/\.[^/.]+$/, "");
      if (fileName) {
        setSpecName(fileName);
      }
    };

    reader.readAsText(file);
  };

  const fetchApiSpec = async () => {
    setIsLoading(true);
    try {
      console.log("Fetching API spec from:", apiUrl);
      const { spec, name } = await fetchApiSpecFromUrl(apiUrl);

      setApiSpec(spec);
      setSpecName(name);

      toast.success("Success", {
        description: "API specification fetched successfully",
      });
    } catch (error) {
      console.error("Error fetching API spec:", error);
      toast("Error", {
        description: String(error),
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async () => {
    try {
      setIsSaving(true);

      const parsedSpec = JSON.parse(apiSpec);

      await saveData("spec", parsedSpec, specName);

      toast.success("Success", {
        description: "API specification uploaded successfully",
      });

      router.push(`/documentation/${specName}`);
    } catch (error) {
      console.error("Error saving API spec:", error);
      toast.error("Error", {
        description:
          error instanceof SyntaxError
            ? "Invalid JSON format. Please check your API specification."
            : "Failed to save specification.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header
        title="Upload OpenAPI Specification"
        description="Upload or fetch your API specification"
        showBackButton={true}
      />

      <main className="container mx-auto py-8 px-4">
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Fetch from API</CardTitle>
            <CardDescription>
              Fetch OpenAPI specification directly from your API
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label htmlFor="spec-name">Specification Name</Label>
                <Input
                  id="spec-name"
                  value={specName}
                  onChange={(e) => setSpecName(e.target.value)}
                  placeholder="Enter a name for this specification"
                  className="mb-4"
                />
              </div>

              <div className="flex flex-col sm:flex-row gap-2">
                <div className="flex-1">
                  <Label htmlFor="api-url">API Documentation URL</Label>
                  <Input
                    id="api-url"
                    value={apiUrl}
                    onChange={(e) => setApiUrl(e.target.value)}
                    placeholder="http://localhost:8080/v3/api-docs"
                  />
                </div>
                <div className="flex items-end">
                  <Button
                    onClick={fetchApiSpec}
                    disabled={isLoading}
                    className="bg-red-400 hover:bg-red-300"
                  >
                    {isLoading ? "Fetching..." : "Fetch"}
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Upload Specification</CardTitle>
            <CardDescription>
              Upload your OpenAPI specification file in JSON format
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div
              className={`border-2 border-dashed rounded-lg p-10 text-center mb-6 ${
                isDragging ? "border-primary bg-primary/10" : "border-gray-300"
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <Upload className="mx-auto h-12 w-12 text-gray-400" />
              <p className="mt-2 text-sm text-gray-600">
                Drag and drop your OpenAPI specification file here, or click to
                browse
              </p>
              <input
                type="file"
                accept=".json"
                onChange={handleFileChange}
                className="hidden"
                id="file-upload"
              />
              <label htmlFor="file-upload">
                <Button className="mt-4" asChild>
                  Browse Files
                </Button>
              </label>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Or paste your OpenAPI specification here:
                </label>
                <Textarea
                  value={apiSpec}
                  onChange={(e) => setApiSpec(e.target.value)}
                  placeholder="Paste your OpenAPI JSON here..."
                  className="font-mono h-64"
                />
              </div>

              <Button
                onClick={handleSubmit}
                className="w-full bg-red-400 hover:bg-red-300"
                disabled={isSaving}
              >
                {isSaving ? "Saving..." : "Upload and Process"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
