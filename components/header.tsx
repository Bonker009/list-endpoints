import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Home, FlaskConical, Database } from "lucide-react";

type HeaderProps = {
  title: string;
  description?: string;
  showBackButton?: boolean;
  showHomeButton?: boolean;
};

export function Header({
  title,
  description,
  showBackButton = false,
  showHomeButton = true,
}: HeaderProps) {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-20 bg-gradient-to-r from-white via-slate-50 to-white border-b border-gray-200 shadow-sm">
      <div className="container mx-auto flex flex-col md:flex-row items-center justify-between py-4 px-6 gap-4">
        <div className="flex items-center gap-4 w-full md:w-auto">
          {showBackButton && (
            <Link href="/">
              <Button
                variant="ghost"
                size="icon"
                className="hover:bg-slate-100"
              >
                <ArrowLeft className="h-5 w-5" />
                <span className="sr-only">Back</span>
              </Button>
            </Link>
          )}

          {showHomeButton && (
            <Link href="/">
              <Button
                variant="ghost"
                size="icon"
                className="hover:bg-slate-100"
              >
                <Home className="h-5 w-5" />
                <span className="sr-only">Home</span>
              </Button>
            </Link>
          )}

          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-800">
              {title}
            </h1>
            {description && (
              <p className="text-sm text-gray-500 mt-1">{description}</p>
            )}
          </div>
        </div>
        <nav className="flex items-center gap-2 w-full md:w-auto justify-end">
          {/* {pathname !== "/documentation/test-endpoints" && (
            <Link href="/documentation/test-endpoints">
              <Button
                variant="outline"
                className="flex items-center gap-2 border-red-200 text-red-700 hover:bg-red-50 transition"
                size="sm"
              >
                <FlaskConical className="h-4 w-4" />
                <span>Test Endpoint</span>
              </Button>
            </Link>
          )} */}
          {pathname !== "/database-schema" && (
            <Link href="/database-schema">
              <Button
                variant="outline"
                className="flex items-center gap-2 border-blue-200 text-blue-700 hover:bg-blue-50 transition"
                size="sm"
              >
                <Database className="h-4 w-4" />
                <span>Database Schema</span>
              </Button>
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
