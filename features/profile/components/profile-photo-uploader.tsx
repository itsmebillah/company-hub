"use client";

import { useEffect, useMemo, useState, type ChangeEvent } from "react";
import { AlertCircle, Camera, Loader2, RotateCcw, Upload } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  getProfilePhotoSrc,
  PROFILE_PHOTOS_BUCKET,
} from "@/lib/media";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type ProfilePhotoUploaderProps = {
  employeeId: string;
  name: string;
  value: string;
  onChange: (value: string) => void;
};

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

function profilePhotoPath(employeeId: string, file: File) {
  const safeName = file.name.toLowerCase().replace(/[^a-z0-9._-]/g, "-");
  const normalizedEmployeeId = employeeId.trim().toUpperCase();

  return `${normalizedEmployeeId}/${Date.now()}-${safeName}`;
}

export function ProfilePhotoUploader({
  employeeId,
  name,
  value,
  onChange,
}: ProfilePhotoUploaderProps) {
  const [previewUrl, setPreviewUrl] = useState("");
  const [hasImageError, setHasImageError] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [zoom, setZoom] = useState(1);
  const [position, setPosition] = useState(50);
  const initials = useMemo(() => getInitials(name) || "CH", [name]);
  const storedPhotoUrl = useMemo(() => getProfilePhotoSrc(value), [value]);

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  useEffect(() => {
    setHasImageError(false);
  }, [storedPhotoUrl]);

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    const nextPreviewUrl = URL.createObjectURL(file);
    const storagePath = profilePhotoPath(employeeId, file);

    setPreviewUrl(nextPreviewUrl);
    setUploadError("");
    setIsUploading(true);

    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase.storage
      .from(PROFILE_PHOTOS_BUCKET)
      .upload(storagePath, file, {
        cacheControl: "3600",
        contentType: file.type || undefined,
        upsert: true,
      });

    setIsUploading(false);

    if (error) {
      URL.revokeObjectURL(nextPreviewUrl);
      setPreviewUrl("");
      setUploadError("Unable to upload profile photo. Please try another image.");
      onChange("");
      return;
    }

    onChange(storagePath);
  }

  return (
    <section className="rounded-xl border bg-card p-5 shadow-sm">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
        <div className="relative size-32 overflow-hidden rounded-full border bg-muted">
          {previewUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={previewUrl}
              alt=""
              className="size-full object-cover"
              style={{
                objectPosition: `${position}% 50%`,
                transform: `scale(${zoom})`,
              }}
            />
          ) : storedPhotoUrl && !hasImageError ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={storedPhotoUrl}
              alt=""
              className="size-full object-cover"
              onError={() => setHasImageError(true)}
            />
          ) : (
            <div className="flex size-full items-center justify-center bg-primary/10 text-3xl font-semibold text-primary">
              {initials}
            </div>
          )}
          {isUploading ? (
            <div className="absolute inset-0 flex items-center justify-center bg-background/70">
              <Loader2 className="size-6 animate-spin text-primary" />
            </div>
          ) : null}
        </div>

        <div className="min-w-0 flex-1 space-y-4">
          <div>
            <h2 className="font-semibold">Profile Photo</h2>
            <p className="text-sm text-muted-foreground">
              Upload, preview, and store your avatar path.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
            <input
              value={value}
              onChange={(event) => onChange(event.target.value)}
              placeholder={`${employeeId}/avatar.jpg`}
              className="h-11 w-full rounded-md border bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
            <label className="inline-flex h-11 cursor-pointer items-center justify-center gap-2 rounded-md border bg-background px-4 text-sm font-medium">
              {isUploading ? (
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              ) : (
                <Upload className="size-4" aria-hidden="true" />
              )}
              {isUploading ? "Uploading" : "Replace"}
              <input
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={handleFileChange}
                disabled={isUploading}
              />
            </label>
          </div>

          {uploadError ? (
            <div className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
              <AlertCircle className="mt-0.5 size-4 shrink-0" />
              <p>{uploadError}</p>
            </div>
          ) : null}

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="space-y-2">
              <span className="text-xs font-medium text-muted-foreground">
                Crop Zoom
              </span>
              <input
                type="range"
                min="1"
                max="2"
                step="0.05"
                value={zoom}
                onChange={(event) => setZoom(Number(event.target.value))}
                className="w-full"
              />
            </label>
            <label className="space-y-2">
              <span className="text-xs font-medium text-muted-foreground">
                Crop Position
              </span>
              <input
                type="range"
                min="0"
                max="100"
                value={position}
                onChange={(event) => setPosition(Number(event.target.value))}
                className="w-full"
              />
            </label>
          </div>

          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setZoom(1);
              setPosition(50);
              setUploadError("");
              onChange("");
            }}
          >
            {value ? (
              <RotateCcw className="size-4" aria-hidden="true" />
            ) : (
              <Camera className="size-4" aria-hidden="true" />
            )}
            Use Default Avatar
          </Button>
        </div>
      </div>
    </section>
  );
}
