"use client";

import { useEffect, useMemo, useState, type ChangeEvent } from "react";
import { Camera, RotateCcw, Upload } from "lucide-react";

import { Button } from "@/components/ui/button";

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

  return `profile-photos/${employeeId}/${safeName}`;
}

export function ProfilePhotoUploader({
  employeeId,
  name,
  value,
  onChange,
}: ProfilePhotoUploaderProps) {
  const [previewUrl, setPreviewUrl] = useState("");
  const [zoom, setZoom] = useState(1);
  const [position, setPosition] = useState(50);
  const initials = useMemo(() => getInitials(name) || "CH", [name]);

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    setPreviewUrl(URL.createObjectURL(file));
    onChange(profilePhotoPath(employeeId, file));
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
          ) : value ? (
            <div className="flex size-full items-center justify-center text-center text-xs text-muted-foreground">
              {value}
            </div>
          ) : (
            <div className="flex size-full items-center justify-center bg-primary/10 text-3xl font-semibold text-primary">
              {initials}
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1 space-y-4">
          <div>
            <h2 className="font-semibold">Profile Photo</h2>
            <p className="text-sm text-muted-foreground">
              Preview, crop, and store the future storage path for your avatar.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
            <input
              value={value}
              onChange={(event) => onChange(event.target.value)}
              placeholder={`profile-photos/${employeeId}/avatar.jpg`}
              className="h-11 w-full rounded-md border bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
            <label className="inline-flex h-11 cursor-pointer items-center justify-center gap-2 rounded-md border bg-background px-4 text-sm font-medium">
              <Upload className="size-4" aria-hidden="true" />
              Replace
              <input
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={handleFileChange}
              />
            </label>
          </div>

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
