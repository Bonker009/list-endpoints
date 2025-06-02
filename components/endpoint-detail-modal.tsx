"use client";
import RandExp from "randexp";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Check, X, Copy } from "lucide-react";
import { MarkdownEditor } from "./markdown-editor";
import { MarkdownHelpModal } from "./markdown-help-modal";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import CustomDialogContent from "./custom-dialog-variants";
import { ApiTester } from "./api-tester";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import TestCaseGeneratorPanel from "./TestCaseGeneratorPanel";

type EndpointDetailModalProps = {
  isOpen: boolean;
  onClose: () => void;
  endpoint: any;
  path: string;
  method: string;
  apiData: any;
  status: {
    working: boolean;
    notes: string;
  };
  onToggleStatus: (path: string, method: string) => void;
  onUpdateNotes: (path: string, method: string, notes: string) => void;
  getControllerColor: (controller: string) => string;
};

export function EndpointDetailModal({
  isOpen,
  onClose,
  endpoint,
  path,
  method,
  apiData,
  status,
  onToggleStatus,
  onUpdateNotes,
  getControllerColor,
}: EndpointDetailModalProps) {
  if (!endpoint) return null;

  const methodData = apiData.paths[path][method.toLowerCase()];
  const methodColor = getMethodColor(method);

  function getMethodColor(method: string) {
    switch (method.toUpperCase()) {
      case "GET":
        return "bg-blue-100 text-blue-800";
      case "POST":
        return "bg-green-100 text-green-800";
      case "PUT":
        return "bg-yellow-100 text-yellow-800";
      case "DELETE":
        return "bg-red-100 text-red-800";
      case "PATCH":
        return "bg-orange-100 text-orange-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  }

  // Function to copy text to clipboard
  function copyToClipboard(text: string) {
    navigator.clipboard
      .writeText(text)
      .then(() => {
        // Could add a toast notification here
        console.log("Copied to clipboard");
      })
      .catch((err) => {
        console.error("Failed to copy: ", err);
      });
  }

  function generateSampleRequest(schema: any, components: any): any {
    if (!schema) return null;

    if (schema.$ref) {
      const refPath = schema.$ref.replace("#/components/schemas/", "");
      if (components?.schemas?.[refPath]) {
        return generateSampleRequest(components.schemas[refPath], components);
      }
      return { refPath: "Reference not found" };
    }

    if (schema.type === "object") {
      const result: any = {};
      if (schema.properties) {
        Object.keys(schema.properties).forEach((propName) => {
          const isRequired =
            schema.required && schema.required.includes(propName);
          if (isRequired || Math.random() > 0.3) {
            result[propName] = generateSampleRequest(
              schema.properties[propName],
              components
            );
          }
        });
      }
      return result;
    } else if (schema.type === "array") {
      return [generateSampleRequest(schema.items, components)];
    } else if (schema.type === "string") {
      if (schema.format === "date-time") return "2023-01-01T12:00:00Z";
      if (schema.format === "date") return "2023-01-01";
      if (schema.format === "uuid")
        return "123e4567-e89b-12d3-a456-426614174000";
      if (schema.format === "email") return "user@example.com";
      if (schema.format === "uri") return "https://example.com";
      if (schema.enum) return schema.enum[0];
      if (schema.pattern) {
        try {
          const pattern = new RegExp(schema.pattern);
          return new RandExp(pattern).gen();
        } catch (err) {
          return `Invalid regex pattern: ${schema.pattern}`;
        }
      }
      return "string value";
    } else if (schema.type === "integer" || schema.type === "number") {
      if (schema.minimum !== undefined && schema.maximum !== undefined) {
        return Math.floor((schema.minimum + schema.maximum) / 2);
      }
      if (schema.minimum !== undefined) return schema.minimum;
      if (schema.maximum !== undefined) return schema.maximum;
      return schema.type === "integer" ? 42 : 42.5;
    } else if (schema.type === "boolean") {
      return true;
    } else if (schema.oneOf || schema.anyOf) {
      const options = schema.oneOf || schema.anyOf;
      return generateSampleRequest(options[0], components);
    }

    return null;
  }

  // Get request body schema
  const requestBodySchema =
    methodData?.requestBody?.content?.["application/json"]?.schema;
  const requestSample = requestBodySchema
    ? generateSampleRequest(requestBodySchema, apiData.components)
    : null;

  // Get response schema
  const responseSchema =
    methodData?.responses?.["200"]?.content?.["*/*"]?.schema;
  const responseSample = responseSchema
    ? generateSampleRequest(responseSchema, apiData.components)
    : null;

  const [apiUrl, setApiUrl] = useState(
    apiData.servers?.[0]?.url || "http://localhost:8080"
  );
  const [token, setToken] = useState("");

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <CustomDialogContent size="full" className="px-12 py-10 flex flex-col">
        <DialogHeader className="">
          <DialogTitle className="flex items-center justify-between jus gap-2">
            <div>
              <span
                className={`px-2  rounded text-xs font-bold uppercase ${methodColor}`}
              >
                {method}
              </span>
              <span className="text-xl">{path}</span>
            </div>
            <div className="">
              <Button
                variant={status.working ? "default" : "outline"}
                size="sm"
                onClick={() => onToggleStatus(path, method)}
                className="flex items-center"
              >
                {status.working ? (
                  <>
                    <Check className="h-4 w-4 mr-1" /> Working
                  </>
                ) : (
                  <>
                    <X className="h-4 w-4 mr-1" /> Not Working
                  </>
                )}
              </Button>
            </div>
          </DialogTitle>
          <DialogDescription className="flex items-center gap-2">
            <span>{methodData.operationId}</span>
            {methodData.tags && methodData.tags.length > 0 && (
              <span className="ml-2">
                {methodData.tags.map((tag: string) => (
                  <Badge
                    key={tag}
                    className={`mr-1 ${getControllerColor(tag)}`}
                  >
                    {tag}
                  </Badge>
                ))}
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="details">
          <TabsList className="grid w-full grid-cols-7">
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="schema">Schema</TabsTrigger>
            <TabsTrigger value="request">Request Sample</TabsTrigger>
            <TabsTrigger value="response">Response Sample</TabsTrigger>

            <TabsTrigger value="notes">Notes</TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="space-y-6">
            {/* Parameters Section */}
            <Accordion
              type="multiple"
              defaultValue={["parameters", "requestBody", "responses"]}
            >
              <AccordionItem value="parameters">
                <AccordionTrigger className="text-lg font-semibold flex items-center gap-2">
                  <span>🧩</span> Parameters
                </AccordionTrigger>
                <AccordionContent>
                  {methodData.parameters && methodData.parameters.length > 0 ? (
                    <div className="border rounded-md overflow-hidden">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Name
                            </th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              In
                            </th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Type
                            </th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Required
                            </th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Description
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-100">
                          {methodData.parameters.map(
                            (param: any, i: number) => (
                              <tr key={i} className="hover:bg-gray-50">
                                <td className="px-4 py-2 text-sm font-medium">
                                  {param.name}
                                </td>
                                <td className="px-4 py-2 text-sm">
                                  {param.in}
                                </td>
                                <td className="px-4 py-2 text-sm">
                                  {param.schema?.type ||
                                    param.schema?.$ref?.split("/").pop() ||
                                    "-"}
                                </td>
                                <td className="px-4 py-2 text-sm">
                                  {param.required ? (
                                    <span className="text-green-600 font-semibold">
                                      Yes
                                    </span>
                                  ) : (
                                    <span className="text-gray-400">No</span>
                                  )}
                                </td>
                                <td className="px-4 py-2 text-sm">
                                  {param.description || "-"}
                                </td>
                              </tr>
                            )
                          )}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-gray-500 italic px-2 py-4">
                      No parameters for this endpoint.
                    </div>
                  )}
                </AccordionContent>
              </AccordionItem>

              {/* Request Body Section */}
              <AccordionItem value="requestBody">
                <AccordionTrigger className="text-lg font-semibold flex items-center gap-2">
                  <span>📦</span> Request Body
                </AccordionTrigger>
                <AccordionContent>
                  {methodData.requestBody ? (
                    <div className="border rounded-md p-4 bg-gray-50">
                      {Object.keys(methodData.requestBody.content).map(
                        (contentType) => (
                          <div key={contentType} className="mb-2">
                            <span className="font-medium">{contentType}</span>
                            {methodData.requestBody.content[contentType]
                              .schema && (
                              <div className="ml-4 text-sm">
                                Schema:{" "}
                                <code className="bg-gray-100 px-1 py-0.5 rounded">
                                  {methodData.requestBody.content[
                                    contentType
                                  ].schema.$ref
                                    ?.split("/")
                                    .pop() || "Schema"}
                                </code>
                              </div>
                            )}
                          </div>
                        )
                      )}
                      {methodData.requestBody.required && (
                        <div className="text-red-500 text-sm mt-1">
                          Required
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-gray-500 italic px-2 py-4">
                      No request body required.
                    </div>
                  )}
                </AccordionContent>
              </AccordionItem>

              {/* Responses Section */}
              <AccordionItem value="responses">
                <AccordionTrigger className="text-lg font-semibold flex items-center gap-2">
                  <span>📨</span> Responses
                </AccordionTrigger>
                <AccordionContent>
                  <div className="border rounded-md overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status
                          </th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Description
                          </th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Content Type
                          </th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Schema
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-100">
                        {Object.entries(methodData.responses).map(
                          ([code, response]: [string, any]) => (
                            <tr key={code} className="hover:bg-gray-50">
                              <td className="px-4 py-2 text-sm font-medium">
                                {code}
                              </td>
                              <td className="px-4 py-2 text-sm">
                                {response.description}
                              </td>
                              <td className="px-4 py-2 text-sm">
                                {response.content
                                  ? Object.keys(response.content).join(", ")
                                  : "-"}
                              </td>
                              <td className="px-4 py-2 text-sm">
                                {response.content
                                  ? Object.values(response.content).map(
                                      (content: any, i: number) => (
                                        <div key={i}>
                                          {content.schema?.$ref
                                            ?.split("/")
                                            .pop() ||
                                            content.schema?.type ||
                                            "-"}
                                        </div>
                                      )
                                    )
                                  : "-"}
                              </td>
                            </tr>
                          )
                        )}
                      </tbody>
                    </table>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </TabsContent>

          <TabsContent value="schema" className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">Request Schema:</h4>
              <pre className="bg-slate-300 p-4 rounded-md overflow-x-auto text-sm">
                {methodData.requestBody?.content?.["application/json"]?.schema
                  ? JSON.stringify(
                      methodData.requestBody.content["application/json"].schema,
                      null,
                      2
                    )
                  : "No request schema available"}
              </pre>
            </div>

            <div>
              <h4 className="font-medium mb-2">Response Schema:</h4>
              <pre className="bg-slate-300 p-4 rounded-md overflow-x-auto text-sm">
                {methodData.responses["200"]?.content?.["*/*"]?.schema
                  ? JSON.stringify(
                      methodData.responses["200"].content["*/*"].schema,
                      null,
                      2
                    )
                  : "No response schema available"}
              </pre>
            </div>
          </TabsContent>

          <TabsContent value="request" className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">Sample Request:</h4>
              {requestSample ? (
                <div className="relative group rounded-md overflow-hidden">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10"
                    onClick={() =>
                      copyToClipboard(JSON.stringify(requestSample, null, 2))
                    }
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                  <SyntaxHighlighter
                    language="json"
                    style={vscDarkPlus}
                    customStyle={{
                      margin: 0,
                      borderRadius: "0.375rem",
                    }}
                  >
                    {JSON.stringify(requestSample, null, 2)}
                  </SyntaxHighlighter>
                </div>
              ) : (
                <div className="bg-gray-50 p-4 rounded-md text-gray-500">
                  No request body required
                </div>
              )}
            </div>

            {methodData.parameters && methodData.parameters.length > 0 && (
              <div>
                <h4 className="font-medium mb-2">Sample Request URL:</h4>
                <div className="bg-gray-50 p-4 rounded-md overflow-x-auto relative group">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => {
                      const url = `${
                        apiData.servers && apiData.servers[0]?.url
                          ? apiData.servers[0].url
                          : "http://localhost:8080"
                      }${path.replace(/{([^}]+)}/g, (match, param) => {
                        const parameter = methodData.parameters.find(
                          (p: any) => p.name === param
                        );
                        if (parameter?.schema?.format === "uuid") {
                          return "123e4567-e89b-12d3-a456-426614174000";
                        }
                        return match;
                      })}${
                        methodData.parameters.filter(
                          (p: any) => p.in === "query"
                        ).length > 0
                          ? "?"
                          : ""
                      }${methodData.parameters
                        .filter((p: any) => p.in === "query")
                        .map((p: any, i: number) => {
                          let value = "value";
                          if (p.schema?.type === "boolean") value = "true";
                          if (p.schema?.type === "integer") value = "1";
                          return `${i > 0 ? "&" : ""}${p.name}=${value}`;
                        })
                        .join("")}`;
                      copyToClipboard(url);
                    }}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                  <code className="text-sm">
                    {apiData.servers && apiData.servers[0]?.url
                      ? apiData.servers[0].url
                      : "http://localhost:8080"}
                    {path.replace(/{([^}]+)}/g, (match, param) => {
                      const parameter = methodData.parameters.find(
                        (p: any) => p.name === param
                      );
                      if (parameter?.schema?.format === "uuid") {
                        return "123e4567-e89b-12d3-a456-426614174000";
                      }
                      return match;
                    })}
                    {methodData.parameters.filter((p: any) => p.in === "query")
                      .length > 0
                      ? "?"
                      : ""}
                    {methodData.parameters
                      .filter((p: any) => p.in === "query")
                      .map((p: any, i: number) => {
                        let value = "value";
                        if (p.schema?.type === "boolean") value = "true";
                        if (p.schema?.type === "integer") value = "1";
                        return `${i > 0 ? "&" : ""}${p.name}=${value}`;
                      })
                      .join("")}
                  </code>
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="response" className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">Sample Response (200 OK):</h4>
              {responseSample ? (
                <div className="relative group rounded-md overflow-hidden">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10"
                    onClick={() =>
                      copyToClipboard(JSON.stringify(responseSample, null, 2))
                    }
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                  <SyntaxHighlighter
                    language="json"
                    style={vscDarkPlus}
                    customStyle={{
                      margin: 0,
                      borderRadius: "0.375rem",
                    }}
                  >
                    {JSON.stringify(responseSample, null, 2)}
                  </SyntaxHighlighter>
                </div>
              ) : (
                <div className="bg-gray-50 p-4 rounded-md text-gray-500">
                  No response schema available
                </div>
              )}
            </div>

            {Object.entries(methodData.responses).length > 1 && (
              <div>
                <h4 className="font-medium mb-2">Other Response Codes:</h4>
                <Accordion type="single" collapsible className="w-full">
                  {Object.entries(methodData.responses)
                    .filter(([code]) => code !== "200")
                    .map(([code, response]: [string, any]) => (
                      <AccordionItem key={code} value={code}>
                        <AccordionTrigger className="px-4 py-2 bg-gray-50 hover:bg-gray-100 rounded-t-md">
                          <div className="flex items-center">
                            <Badge
                              className={`mr-2 ${
                                code.startsWith("2")
                                  ? "bg-green-100 text-green-800"
                                  : code.startsWith("4")
                                  ? "bg-red-100 text-red-800"
                                  : code.startsWith("5")
                                  ? "bg-orange-100 text-orange-800"
                                  : "bg-blue-100 text-blue-800"
                              }`}
                            >
                              {code}
                            </Badge>
                            <span>{response.description}</span>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="bg-gray-50 rounded-b-md border-t overflow-hidden">
                          <div className="relative group">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10"
                              onClick={() =>
                                copyToClipboard(
                                  JSON.stringify(
                                    {
                                      success: code.startsWith("2"),
                                      message: response.description,
                                      status: code,
                                      payload: null,
                                      timestamp: new Date().toISOString(),
                                    },
                                    null,
                                    2
                                  )
                                )
                              }
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                            <SyntaxHighlighter
                              language="json"
                              style={vscDarkPlus}
                              customStyle={{
                                margin: 0,
                                borderRadius: "0.375rem",
                              }}
                            >
                              {JSON.stringify(
                                {
                                  success: code.startsWith("2"),
                                  message: response.description,
                                  status: code,
                                  payload: null,
                                  timestamp: new Date().toISOString(),
                                },
                                null,
                                2
                              )}
                            </SyntaxHighlighter>
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                </Accordion>
              </div>
            )}

            {methodData.responses["200"]?.content?.["*/*"]?.schema && (
              <div>
                <h4 className="font-medium mb-2">Response Structure:</h4>
                <div className="bg-slate-300 p-4 rounded-md">
                  <ul className="space-y-2">
                    {Object.entries(responseSample || {}).map(
                      ([key, value]) => (
                        <li key={key} className="text-sm">
                          <span className="font-semibold">{key}</span>:
                          <span className="text-gray-600 ml-2">
                            {typeof value === "object"
                              ? Array.isArray(value)
                                ? "Array"
                                : "Object"
                              : typeof value}
                          </span>
                          <span className="text-gray-500 ml-2">
                            {typeof value !== "object" &&
                            String(value).length < 50
                              ? `Example: ${String(value)}`
                              : ""}
                          </span>
                        </li>
                      )
                    )}
                  </ul>
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="notes">
            <div className="space-y-4">
              <div className="flex justify-between items-center mb-2">
                <h4 className="font-medium">Notes:</h4>
              </div>
              <MarkdownEditor
                value={status.notes || ""}
                onChange={(value) => onUpdateNotes(path, method, value)}
                placeholder={
                  status.working
                    ? "Add notes about this endpoint using Markdown...\n\n## Usage\n\n## Examples\n\n## Notes"
                    : "Add comments about why this endpoint is not working using Markdown...\n\n## Issues\n\n## Workarounds\n\n## Todo"
                }
                height="min-h-[300px]"
              />
            </div>
          </TabsContent>
        </Tabs>
      </CustomDialogContent>
    </Dialog>
  );
}
