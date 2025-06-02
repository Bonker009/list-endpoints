import { UseFormReturn } from "react-hook-form";

export interface ApiTesterProps {
  path: string;
  method: string;
  apiData: any;
  requestSample: any;
  responseSample: any;
}

export interface TestCase {
  id: string;
  name: string;
  description?: string;
  request: {
    url: string;
    method: string;
    headers: Record<string, string>;
    body?: any;
  };
  expectedResponse?: {
    status?: number;
    body?: any;
  };
  result?: TestResult;
}

export interface TestResult {
  id: string;
  timestamp: Date;
  request: {
    url: string;
    method: string;
    headers: Record<string, string>;
    body: any;
  };
  response: {
    status: number;
    statusText: string;
    headers: Record<string, string>;
    body: any;
    time: number;
  } | null;
  validations: {
    field: string;
    valid: boolean;
    message: string;
  }[];
  error?: string;
}

export interface RequestBuilderProps {
  method: string;
  apiData: any;
  path: string;
  requestSample: any;
  form: any;
  loading: boolean;
  requestBody: string;
  requestHeaders: Record<string, string>;
  activeAuthOption: string | null;
  setRequestBody: (body: string) => void;
  setRequestHeaders: (headers: Record<string, string>) => void;
  handleAddHeader: () => void;
  handleRemoveHeader: (key: string) => void;
  handleHeaderChange: (oldKey: string, newKey: string, value: string) => void;
  executeRequest: () => void;
}

export interface ResponseViewerProps {
  responseStatus: number | null;
  responseTime: number | null;
  responseBody: string;
  responseHeaders: Record<string, string>;
  copyToClipboard: (text: string) => void;
  getStatusBadgeColor?: (status: number) => string;
}

export interface AuthManagerProps {
  authOptions: Record<string, string>;
  activeAuthOption: string | null;
  saveAuthOptions: (options: Record<string, string>) => void;
  applyAuthToken: (name: string | null) => void;
  removeAuthToken: (name: string) => void;
}

export interface TestCaseManagerProps {
  testCases: TestCase[];
  setTestCases: React.Dispatch<React.SetStateAction<TestCase[]>>;
  form: UseFormReturn<any>;
  requestHeaders: Record<string, string>;
  requestBody: string;
  method: string;
  executeRequest: () => Promise<TestResult | null>;
  loading: boolean;
  setTestResults: React.Dispatch<React.SetStateAction<TestResult[]>>;
  setActiveResult: React.Dispatch<React.SetStateAction<string | null>>;
  saveTestCases: (testCases: TestCase[]) => void;
  bulkImportText: string;
  setBulkImportText: React.Dispatch<React.SetStateAction<string>>;
  bulkImportError: string;
  setBulkImportError: React.Dispatch<React.SetStateAction<string>>;
  bulkImportOpen: boolean;
  setBulkImportOpen: React.Dispatch<React.SetStateAction<boolean>>;
  getStatusBadgeColor: (status: number) => string;
}

export interface TestReportProps {
  testResults: TestResult[];
  activeResult: string | null;
  testCases: TestCase[];
  setActiveResult: (id: string | null) => void;
  getStatusBadgeColor: (status: number) => string;
  copyToClipboard: (text: string) => void;
}

export interface BulkImportDialogProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  bulkImportText: string;
  setBulkImportText: (text: string) => void;
  bulkImportError: string;
  handleBulkImport: () => void;
  requestBody: string;
}
