"use client";

import { useState, useEffect, useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ChevronDown,
  ChevronRight,
  Info,
  Check,
  X,
  BarChart,
  Shield,
  PlaneTakeoff,
  Download,
} from "lucide-react";
import { EndpointDetailModal } from "@/components/endpoint-detail-modal";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Header } from "@/components/header";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchData, saveData } from "@/lib/data-service";
import { toast } from "sonner";

import Link from "next/link";
import { useParams } from "next/navigation";

type EndpointStatus = {
  path: string;
  method: string;
  working: boolean;
  notes: string;
};

type EndpointData = {
  path: string;
  method: string;
  controller: string;
  operationId: string;
  working: boolean;
  notes: string;
};

const controllerColors: Record<string, string> = {
  "resume-controller": "bg-purple-100 text-purple-800 border-purple-200",
  "topic-controller": "bg-emerald-100 text-emerald-800 border-emerald-200",
  "user-controller": "bg-amber-100 text-amber-800 border-amber-200",
  "auth-controller": "bg-sky-100 text-sky-800 border-sky-200",
  "file-controller": "bg-rose-100 text-rose-800 border-rose-200",
  default: "bg-gray-100 text-gray-800 border-gray-200",
};

export default function Documentation() {
  const params = useParams();
  const id = params?.id as string;

  const [apiData, setApiData] = useState<any>(null);

  const [endpointStatuses, setEndpointStatuses] = useState<EndpointStatus[]>(
    []
  );
  const [endpoints, setEndpoints] = useState<EndpointData[]>([]);
  const [activeTab, setActiveTab] = useState("all");
  const [selectedEndpoint, setSelectedEndpoint] = useState<EndpointData | null>(
    null
  );
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [expandedControllers, setExpandedControllers] = useState<
    Record<string, boolean>
  >({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [controllerSearch, setControllerSearch] = useState("");

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        setError(null);

        const specData = await fetchData("spec", id);
        if (!specData) {
          setError(`API specification '${id}' not found`);
          return;
        }

        setApiData(specData);

        const statusData = await fetchData("status", id);
        if (statusData && Array.isArray(statusData)) {
          setEndpointStatuses(statusData);
        }

        const settingsData = await fetchData("settings", id);
        if (settingsData && settingsData.expandedControllers) {
          setExpandedControllers(settingsData.expandedControllers);
        }
      } catch (error) {
        console.error("Error loading data:", error);
        setError("Failed to load API documentation");
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [id]);

  useEffect(() => {
    if (!apiData) return;

    try {
      const extractedEndpoints: EndpointData[] = [];

      Object.entries(apiData.paths || {}).forEach(
        ([path, methods]: [string, any]) => {
          Object.entries(methods).forEach(([method, data]: [string, any]) => {
            const controller =
              data.tags && data.tags.length > 0 ? data.tags[0] : "unknown";
            const status = endpointStatuses.find(
              (status) =>
                status.path === path && status.method === method.toLowerCase()
            );

            extractedEndpoints.push({
              path,
              method: method.toUpperCase(),
              controller,
              operationId: data.operationId || "unknown",
              working: status?.working || false,
              notes: status?.notes || "",
            });
          });
        }
      );

      setEndpoints(extractedEndpoints);

      const controllers = [
        ...new Set(extractedEndpoints.map((e) => e.controller)),
      ];
      const newExpandedState: Record<string, boolean> = {
        ...expandedControllers,
      };

      controllers.forEach((controller) => {
        if (newExpandedState[controller] === undefined) {
          newExpandedState[controller] = true;
        }
      });

      setExpandedControllers(newExpandedState);
      saveSettings();
    } catch (error) {
      console.error("Error processing API data:", error);
      toast.error("Error", {
        description: "Failed to process API data",
      });
    }
  }, [apiData, endpointStatuses]);

  const saveSettings = async () => {
    try {
      await saveData("settings", { expandedControllers }, id);
    } catch (error) {
      console.error("Error saving settings:", error);
    }
  };

  const saveEndpointStatuses = async (statuses: EndpointStatus[]) => {
    try {
      await saveData("status", statuses, id);
    } catch (error) {
      console.error("Error saving endpoint statuses:", error);
      toast.error("Error", {
        description: "Failed to save endpoint statuses",
      });
    }
  };

  const endpointsByController = useMemo(() => {
    const grouped: Record<string, EndpointData[]> = {};

    let filteredEndpoints = endpoints;
    if (activeTab === "working") {
      filteredEndpoints = endpoints.filter((endpoint) => endpoint.working);
    } else if (activeTab === "not-working") {
      filteredEndpoints = endpoints.filter((endpoint) => !endpoint.working);
    }

    filteredEndpoints.forEach((endpoint) => {
      if (!grouped[endpoint.controller]) {
        grouped[endpoint.controller] = [];
      }
      grouped[endpoint.controller].push(endpoint);
    });

    return grouped;
  }, [endpoints, activeTab]);

  const filteredControllers = useMemo(() => {
    const controllers = Object.entries(endpointsByController);
    if (!controllerSearch) return controllers;

    return controllers.filter(([controller]) =>
      controller.toLowerCase().includes(controllerSearch.toLowerCase())
    );
  }, [endpointsByController, controllerSearch]);

  const toggleEndpointStatus = async (path: string, method: string) => {
    try {
      const methodLower = method.toLowerCase();

      const existingStatusIndex = endpointStatuses.findIndex(
        (status) => status.path === path && status.method === methodLower
      );

      let updatedStatuses;

      if (existingStatusIndex >= 0) {
        updatedStatuses = [...endpointStatuses];
        updatedStatuses[existingStatusIndex] = {
          ...updatedStatuses[existingStatusIndex],
          working: !updatedStatuses[existingStatusIndex].working,
        };
      } else {
        updatedStatuses = [
          ...endpointStatuses,
          {
            path,
            method: methodLower,
            working: true,
            notes: "",
          },
        ];
      }

      setEndpointStatuses(updatedStatuses);
      await saveEndpointStatuses(updatedStatuses);

      setEndpoints(
        endpoints.map((endpoint) => {
          if (endpoint.path === path && endpoint.method === method) {
            return {
              ...endpoint,
              working: !endpoint.working,
            };
          }
          return endpoint;
        })
      );

      if (
        selectedEndpoint &&
        selectedEndpoint.path === path &&
        selectedEndpoint.method === method
      ) {
        setSelectedEndpoint({
          ...selectedEndpoint,
          working: !selectedEndpoint.working,
        });
      }
    } catch (error) {
      console.error("Error toggling endpoint status:", error);
      toast.error("Error", {
        description: "Failed to update endpoint status",
      });
    }
  };

  const updateEndpointNotes = async (
    path: string,
    method: string,
    notes: string
  ) => {
    try {
      const methodLower = method.toLowerCase();

      const existingStatusIndex = endpointStatuses.findIndex(
        (status) => status.path === path && status.method === methodLower
      );

      let updatedStatuses;

      if (existingStatusIndex >= 0) {
        updatedStatuses = [...endpointStatuses];
        updatedStatuses[existingStatusIndex] = {
          ...updatedStatuses[existingStatusIndex],
          notes,
        };
      } else {
        updatedStatuses = [
          ...endpointStatuses,
          {
            path,
            method: methodLower,
            working: false,
            notes,
          },
        ];
      }

      setEndpointStatuses(updatedStatuses);
      await saveEndpointStatuses(updatedStatuses);

      setEndpoints(
        endpoints.map((endpoint) => {
          if (endpoint.path === path && endpoint.method === method) {
            return {
              ...endpoint,
              notes,
            };
          }
          return endpoint;
        })
      );

      if (
        selectedEndpoint &&
        selectedEndpoint.path === path &&
        selectedEndpoint.method === method
      ) {
        setSelectedEndpoint({
          ...selectedEndpoint,
          notes,
        });
      }
    } catch (error) {
      console.error("Error updating endpoint notes:", error);
      toast.error("Error", {
        description: "Failed to update endpoint notes",
      });
    }
  };

  const getMethodColor = (method: string) => {
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
  };

  const getControllerColor = (controller: string) => {
    return controllerColors[controller] || controllerColors.default;
  };

  // Filter endpoints based on active tab
  const filteredEndpoints = () => {
    if (activeTab === "all") return endpoints;
    if (activeTab === "working")
      return endpoints.filter((endpoint) => endpoint.working);
    if (activeTab === "not-working")
      return endpoints.filter((endpoint) => !endpoint.working);
    return endpoints;
  };

  const openEndpointModal = (endpoint: EndpointData) => {
    setSelectedEndpoint(endpoint);
    setIsModalOpen(true);
  };

  const closeEndpointModal = () => {
    setIsModalOpen(false);
  };

  const getEndpointStatus = (path: string, method: string) => {
    const status = endpointStatuses.find(
      (status) => status.path === path && status.method === method.toLowerCase()
    );
    return {
      working: status?.working || false,
      notes: status?.notes || "",
    };
  };

  const toggleControllerExpanded = async (controller: string) => {
    const newExpandedState = {
      ...expandedControllers,
      [controller]: !expandedControllers[controller],
    };
    setExpandedControllers(newExpandedState);

    try {
      await saveData("settings", { expandedControllers: newExpandedState }, id);
    } catch (error) {
      console.error("Error saving controller expanded state:", error);
    }
  };

  const totalEndpoints = endpoints.length;
  const workingEndpoints = endpoints.filter((e) => e.working).length;
  const implementationRate =
    totalEndpoints > 0
      ? Math.round((workingEndpoints / totalEndpoints) * 100)
      : 0;

  const handleDownloadCSV = () => {
    // Prepare CSV header in the desired order
    const header = ["Method", "Path", "Controller", "Note"];
    // Prepare rows in the same order
    const rows = endpoints.map((ep) => [
      `"${ep.method}"`,
      `"${ep.path}"`,
      `"${ep.controller}"`,
      ep.notes ? `"${ep.notes.replace(/"/g, '""')}"` : "",
    ]);
    // Combine header and rows
    const csvContent = [header, ...rows]
      .map((row) => row.join(","))
      .join("\r\n");

    // Create a blob and trigger download
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${apiData?.info?.title || "api-endpoints"}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header title="Loading API Documentation" showBackButton={true} />
        <main className="container mx-auto py-8 px-4">
          <Card className="mb-6">
            <CardHeader>
              <Skeleton className="h-8 w-64 mb-2" />
              <Skeleton className="h-4 w-48" />
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-6 w-3/4" />
              </div>
            </CardContent>
          </Card>

          <Skeleton className="h-10 w-full mb-6" />

          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-32 mb-2" />
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header title="API Documentation Error" showBackButton={true} />
        <main className="container mx-auto py-8 px-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-red-600">
                Error Loading Documentation
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-4">{error}</p>
              <Button onClick={() => (window.location.href = "/")}>
                Return to Home
              </Button>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header
        title={apiData?.info?.title || "API Documentation"}
        showBackButton={true}
      />
      <main className="container mx-auto py-8 px-4">
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">
                  {apiData?.info?.title || "API Documentation"}
                </CardTitle>
                <CardDescription className="text-sm text-slate-500">
                  Version: {apiData?.info?.version || "N/A"}
                </CardDescription>
              </div>
              <div className="flex items-center space-x-2">
                <Badge className="bg-blue-100 text-blue-800 border-blue-200 px-3 py-1">
                  {totalEndpoints} Endpoints
                </Badge>
                <Badge className="bg-green-100 text-green-800 border-green-200 px-3 py-1">
                  {workingEndpoints} Working
                </Badge>
                <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200 px-3 py-1">
                  {implementationRate}% Implementation Rate
                </Badge>
                <Badge className="bg-blue-100 text-blue-800 border-blue-200 px-3 py-1">
                  <BarChart className="inline h-4 w-4 mr-1" />
                  Penh Seyha
                </Badge>
                <Badge className="bg-green-100 text-green-800 border-green-200 px-3 py-1">
                  <Shield className="inline h-4 w-4 mr-1" />
                  {apiData?.components?.securitySchemes?.bearerAuth?.scheme}
                </Badge>
                <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200 px-3 py-1">
                  <PlaneTakeoff className="inline h-4 w-4 mr-1" />
                  {apiData?.components?.securitySchemes?.bearerAuth?.type}
                </Badge>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-1"
                  onClick={handleDownloadCSV}
                >
                  <Download className="h-4 w-4" />
                  Download CSV
                </Button>
              </div>
            </div>

            <CardDescription className="text-sm text-slate-700 ">
              {apiData?.info?.description || "No description available"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <h3 className="text-lg font-medium mb-2">Servers:</h3>
              <ul className="space-y-1">
                {apiData?.servers?.map((server: any, index: number) => (
                  <li key={index} className="text-sm">
                    {server.url} - {server.description}
                  </li>
                ))}
              </ul>
            </div>
          </CardContent>
        </Card>

        <Tabs
          defaultValue="all"
          className="mb-6 w-full"
          onValueChange={setActiveTab}
        >
          <TabsList className="w-full">
            <TabsTrigger value="all" className="flex-1">
              All Endpoints
            </TabsTrigger>
            <TabsTrigger value="working" className="flex-1">
              Working
            </TabsTrigger>
            <TabsTrigger value="not-working" className="flex-1">
              Not Working
            </TabsTrigger>
            <TabsTrigger value="by-controller" className="flex-1">
              By Controller
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="mt-6 w-full">
            <EndpointsTable
              endpoints={filteredEndpoints()}
              getMethodColor={getMethodColor}
              getControllerColor={getControllerColor}
              toggleEndpointStatus={toggleEndpointStatus}
              openEndpointModal={openEndpointModal}
            />
          </TabsContent>

          <TabsContent value="working" className="mt-6">
            <EndpointsTable
              endpoints={filteredEndpoints()}
              getMethodColor={getMethodColor}
              getControllerColor={getControllerColor}
              toggleEndpointStatus={toggleEndpointStatus}
              openEndpointModal={openEndpointModal}
            />
          </TabsContent>

          <TabsContent value="not-working" className="mt-6">
            <EndpointsTable
              endpoints={filteredEndpoints()}
              getMethodColor={getMethodColor}
              getControllerColor={getControllerColor}
              toggleEndpointStatus={toggleEndpointStatus}
              openEndpointModal={openEndpointModal}
            />
          </TabsContent>

          <TabsContent value="by-controller" className="mt-6">
            <div className="space-y-6">
              {/* Add search input */}
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search controllers..."
                  value={controllerSearch}
                  onChange={(e) => setControllerSearch(e.target.value)}
                  className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <div className="absolute right-3 top-2.5 text-gray-400">
                  {controllerSearch && (
                    <button
                      onClick={() => setControllerSearch("")}
                      className="hover:text-gray-600"
                    >
                      ×
                    </button>
                  )}
                </div>
              </div>

              {filteredControllers.length === 0 ? (
                <Card>
                  <CardContent className="py-8">
                    <p className="text-center text-gray-500">
                      {controllerSearch
                        ? `No controllers matching "${controllerSearch}"`
                        : "No endpoints found"}
                    </p>
                  </CardContent>
                </Card>
              ) : (
                filteredControllers.map(([controller, controllerEndpoints]) => (
                  <Collapsible
                    key={controller}
                    open={expandedControllers[controller]}
                    onOpenChange={() => toggleControllerExpanded(controller)}
                    className="border rounded-md overflow-hidden shadow-sm"
                  >
                    <CollapsibleTrigger className="flex items-center justify-between w-full p-4 bg-gray-50 hover:bg-gray-100 transition-colors">
                      <div className="flex items-center">
                        {expandedControllers[controller] ? (
                          <ChevronDown className="h-5 w-5 mr-2" />
                        ) : (
                          <ChevronRight className="h-5 w-5 mr-2" />
                        )}
                        <Badge
                          className={`${getControllerColor(
                            controller
                          )} px-3 py-1`}
                        >
                          {controller}
                        </Badge>
                        <span className="ml-2 text-sm text-gray-500">
                          {controllerEndpoints.length} endpoints
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline" className="bg-white">
                          {controllerEndpoints.filter((e) => e.working).length}{" "}
                          working
                        </Badge>
                        <Badge variant="outline" className="bg-white">
                          {controllerEndpoints.filter((e) => !e.working).length}{" "}
                          not working
                        </Badge>
                      </div>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <EndpointsTable
                        endpoints={controllerEndpoints}
                        getMethodColor={getMethodColor}
                        getControllerColor={getControllerColor}
                        toggleEndpointStatus={toggleEndpointStatus}
                        openEndpointModal={openEndpointModal}
                        hideController={true}
                      />
                    </CollapsibleContent>
                  </Collapsible>
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>

        {selectedEndpoint && (
          <EndpointDetailModal
            isOpen={isModalOpen}
            onClose={closeEndpointModal}
            endpoint={selectedEndpoint}
            path={selectedEndpoint.path}
            method={selectedEndpoint.method}
            apiData={apiData}
            status={getEndpointStatus(
              selectedEndpoint.path,
              selectedEndpoint.method
            )}
            onToggleStatus={toggleEndpointStatus}
            onUpdateNotes={updateEndpointNotes}
            getControllerColor={getControllerColor}
          />
        )}
      </main>
    </div>
  );
}

type EndpointsTableProps = {
  endpoints: EndpointData[];
  getMethodColor: (method: string) => string;
  getControllerColor: (controller: string) => string;
  toggleEndpointStatus: (path: string, method: string) => void;
  openEndpointModal: (endpoint: EndpointData) => void;
  hideController?: boolean;
};

function EndpointsTable({
  endpoints,
  getMethodColor,
  getControllerColor,
  toggleEndpointStatus,
  openEndpointModal,
  hideController = false,
}: EndpointsTableProps) {
  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle>Endpoints</CardTitle>
        <CardDescription>Total: {endpoints.length} endpoints</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="border rounded-md overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Method</TableHead>
                <TableHead>Path</TableHead>
                {!hideController && <TableHead>Controller</TableHead>}
                <TableHead>Operation ID</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Notes</TableHead>
                <TableHead>Details</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {endpoints.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={hideController ? 6 : 7}
                    className="text-center py-8 text-gray-500"
                  >
                    No endpoints found
                  </TableCell>
                </TableRow>
              ) : (
                endpoints.map((endpoint, index) => (
                  <TableRow
                    key={`${endpoint.path}-${endpoint.method}-${index}`}
                    className={endpoint.working ? "bg-green-50" : "bg-red-50"}
                  >
                    <TableCell>
                      <span
                        className={`inline-block px-2 py-1 rounded text-xs font-bold uppercase ${getMethodColor(
                          endpoint.method
                        )}`}
                      >
                        {endpoint.method}
                      </span>
                    </TableCell>
                    <TableCell className="font-medium">
                      {endpoint.path}
                    </TableCell>
                    {!hideController && (
                      <TableCell>
                        <Badge
                          className={getControllerColor(endpoint.controller)}
                        >
                          {endpoint.controller}
                        </Badge>
                      </TableCell>
                    )}
                    <TableCell>{endpoint.operationId}</TableCell>
                    <TableCell>
                      <Button
                        variant={endpoint.working ? "default" : "outline"}
                        size="sm"
                        onClick={() =>
                          toggleEndpointStatus(endpoint.path, endpoint.method)
                        }
                        className="flex items-center"
                      >
                        {endpoint.working ? (
                          <>
                            <Check className="h-4 w-4 mr-1" /> Working
                          </>
                        ) : (
                          <>
                            <X className="h-4 w-4 mr-1" /> Not Working
                          </>
                        )}
                      </Button>
                    </TableCell>
                    <TableCell>
                      {endpoint.notes ? (
                        <div
                          className="max-w-[200px] truncate"
                          title={endpoint.notes}
                        >
                          {endpoint.notes}
                        </div>
                      ) : (
                        <span className="text-gray-400 text-sm">No notes</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEndpointModal(endpoint)}
                        className="flex items-center"
                      >
                        <Info className="h-4 w-4" />
                        <span className="sr-only">View Details</span>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
