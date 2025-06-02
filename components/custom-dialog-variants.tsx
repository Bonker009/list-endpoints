"use client";

import type React from "react";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

type DialogSize = "sm" | "md" | "lg" | "xl" | "full";

const sizeClasses: Record<DialogSize, string> = {
  sm: "max-w-sm h-auto",
  md: "max-w-md h-auto",
  lg: "max-w-lg max-h-[80vh]",
  xl: "max-w-4xl w-[90vw] max-h-[80vh] h-[600px] overflow-auto",
  full: "max-w-[95vw] w-[95vw] max-h-[90vh] h-[90vh] overflow-auto",
};

interface CustomDialogContentProps
  extends React.ComponentPropsWithoutRef<typeof DialogContent> {
  size?: DialogSize;
}

export default function CustomDialogContent({
  size = "md",
  className,
  children,
  ...props
}: CustomDialogContentProps) {
  return (
    <DialogContent className={cn(sizeClasses[size], className)} {...props}>
      {children}
    </DialogContent>
  );
}

