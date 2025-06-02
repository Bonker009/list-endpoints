"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  Bold,
  Italic,
  List,
  ListOrdered,
  Code,
  Link,
  Heading2,
  Eye,
} from "lucide-react";
import { MarkdownHelpModal } from "./markdown-help-modal";

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  height?: string;
}

export function MarkdownEditor({
  value,
  onChange,
  placeholder = "Write your notes here...",
  className = "",
  height = "min-h-[200px]",
}: MarkdownEditorProps) {
  const [activeTab, setActiveTab] = useState<string>("write");

  const insertText = (before: string, after = "") => {
    const textarea = document.querySelector("textarea") as HTMLTextAreaElement;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const selectedText = value.substring(start, end);
      const newText =
        value.substring(0, start) +
        before +
        selectedText +
        after +
        value.substring(end);
      onChange(newText);

      setTimeout(() => {
        textarea.focus();
        if (selectedText.length > 0) {
          textarea.setSelectionRange(
            start + before.length,
            start + before.length + selectedText.length
          );
        } else {
          textarea.setSelectionRange(
            start + before.length,
            start + before.length
          );
        }
      }, 0);
    }
  };

  const handleBold = () => insertText("**", "**");
  const handleItalic = () => insertText("*", "*");
  const handleHeading = () => insertText("## ");
  const handleUnorderedList = () => insertText("- ");
  const handleOrderedList = () => insertText("1. ");
  const handleCode = () => insertText("```\n", "\n```");
  const handleLink = () => insertText("[", "](url)");

  return (
    <div className={`w-full ${className}`}>
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="flex items-center justify-between mb-2">
          <TabsList>
            <TabsTrigger value="write" className="flex items-center">
              <Code className="h-4 w-4 mr-2" />
              Write
            </TabsTrigger>
            <TabsTrigger value="preview" className="flex items-center">
              <Eye className="h-4 w-4 mr-2" />
              Preview
            </TabsTrigger>
          </TabsList>

          {activeTab === "write" && (
            <div className="flex items-center space-x-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={handleBold}
                title="Bold"
              >
                <Bold className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleItalic}
                title="Italic"
              >
                <Italic className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleHeading}
                title="Heading"
              >
                <Heading2 className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleUnorderedList}
                title="Bullet List"
              >
                <List className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleOrderedList}
                title="Numbered List"
              >
                <ListOrdered className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleCode}
                title="Code Block"
              >
                <Code className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleLink}
                title="Link"
              >
                <Link className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>

        <TabsContent value="write" className="mt-0">
          <Textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className={`font-mono ${height} p-4`}
          />
        </TabsContent>

        <TabsContent value="preview" className="mt-0">
          <Card
            className={`${height} overflow-auto p-4 prose prose-sm max-w-none`}
          >
            {value ? (
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{value}</ReactMarkdown>
            ) : (
              <p className="text-gray-400 italic">Nothing to preview</p>
            )}
          </Card>
        </TabsContent>
      </Tabs>

      <div className="mt-2 text-xs text-gray-500">
        <p>
          Supports{" "}
          <a
            href="https://www.markdownguide.org/cheat-sheet/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-500 hover:underline"
          >
            Markdown
          </a>
          : Bold, italic, lists, code blocks, and more.
        </p>
      </div>
    </div>
  );
}
