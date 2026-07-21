"use client";

import { AlertTriangle, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";

interface ConfirmDeleteModalProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  cancelLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDeleteModal({
  open,
  title,
  description,
  confirmLabel,
  cancelLabel,
  onConfirm,
  onCancel,
}: ConfirmDeleteModalProps) {
  if (!open) return null;

  return (
    <div
      className="no-print fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4 transition-opacity"
      role="dialog"
      aria-modal="true"
      onClick={onCancel}
    >
      <Card
        className="w-full max-w-md shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <CardHeader className="flex flex-row items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-600">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <CardTitle className="text-lg">{title}</CardTitle>
            <CardDescription className="mt-1">{description}</CardDescription>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg p-1 text-[#6b7c93] hover:bg-[#f4f7fa]"
            aria-label={cancelLabel}
          >
            <X className="h-5 w-5" />
          </button>
        </CardHeader>
        <CardContent className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button variant="outline" onClick={onCancel}>
            {cancelLabel}
          </Button>
          <Button
            className="bg-red-600 text-white hover:bg-red-700"
            onClick={onConfirm}
          >
            {confirmLabel}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

export function LoadingOverlay({ label }: { label: string }) {
  return (
    <div className="flex items-center justify-center gap-2 rounded-xl border border-[#e2e8f0] bg-[#f4f7fa] px-4 py-8 text-sm text-[#6b7c93]">
      <Loader2 className="h-5 w-5 animate-spin text-[#1db4ce]" />
      {label}
    </div>
  );
}
