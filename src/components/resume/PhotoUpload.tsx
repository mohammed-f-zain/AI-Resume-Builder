"use client";

import { useRef } from "react";
import { Camera, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Label } from "@/components/ui/Input";
import { cn } from "@/lib/utils";

const MAX_BYTES = 1.5 * 1024 * 1024; // ~1.5MB after compression still ok as data URL

interface PhotoUploadProps {
  value?: string;
  onChange: (dataUrl: string) => void;
  label: string;
  hint: string;
  removeLabel: string;
  className?: string;
}

export function PhotoUpload({
  value,
  onChange,
  label,
  hint,
  removeLabel,
  className,
}: PhotoUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File | undefined) => {
    if (!file || !file.type.startsWith("image/")) return;
    if (file.size > MAX_BYTES * 2) {
      // Still try to read; browser may compress via canvas below for huge files
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (typeof result !== "string") return;

      // Downscale large images to keep draft storage reasonable
      const img = new Image();
      img.onload = () => {
        const maxSide = 400;
        const scale = Math.min(1, maxSide / Math.max(img.width, img.height));
        const w = Math.round(img.width * scale);
        const h = Math.round(img.height * scale);
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          onChange(result);
          return;
        }
        ctx.drawImage(img, 0, 0, w, h);
        onChange(canvas.toDataURL("image/jpeg", 0.85));
      };
      img.onerror = () => onChange(result);
      img.src = result;
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className={cn("space-y-2", className)}>
      <Label>{label}</Label>
      <p className="text-xs text-[#6b7c93]">{hint}</p>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        {value ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={value}
            alt=""
            className="h-20 w-20 shrink-0 rounded-lg object-cover ring-1 ring-[#e2e8f0]"
          />
        ) : (
          <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-lg bg-[#f4f7fa] ring-1 ring-[#e2e8f0]">
            <Camera className="h-7 w-7 text-slate-400" />
          </div>
        )}
        <div className="flex min-w-0 flex-wrap gap-2">
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="hidden"
            onChange={(e) => {
              handleFile(e.target.files?.[0]);
              e.target.value = "";
            }}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => inputRef.current?.click()}
          >
            <Camera className="h-4 w-4" />
            {label}
          </Button>
          {value && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onChange("")}
            >
              <Trash2 className="h-4 w-4" />
              {removeLabel}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
