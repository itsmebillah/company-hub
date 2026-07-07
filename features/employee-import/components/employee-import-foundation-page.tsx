"use client";

import Link from "next/link";
import { useMemo, useRef, useState, useTransition, type ChangeEvent } from "react";
import {
  ArrowLeft,
  Download,
  FileSpreadsheet,
  Loader2,
  ShieldCheck,
  UploadCloud,
  Users,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import type {
  EmployeeImportActionState,
  EmployeeImportFileMetadata,
  EmployeeImportFoundationData,
  EmployeeImportUploadValues,
} from "@/features/employee-import/types/employee-import.types";

type EmployeeImportFoundationPageProps = {
  data: EmployeeImportFoundationData;
  onPrepareImport: (
    values: EmployeeImportUploadValues,
  ) => Promise<EmployeeImportActionState>;
};

function formatBytes(value: number) {
  if (value < 1024) {
    return `${value} B`;
  }

  if (value < 1024 * 1024) {
    return `${(value / 1024).toFixed(1)} KB`;
  }

  return `${(value / (1024 * 1024)).toFixed(1)} MB`;
}

function StatCard({
  title,
  value,
  description,
}: {
  title: string;
  value: string;
  description: string;
}) {
  return (
    <div className="rounded-xl border bg-card p-5 shadow-sm">
      <p className="text-sm font-medium text-muted-foreground">{title}</p>
      <p className="mt-3 text-3xl font-semibold tracking-tight">{value}</p>
      <p className="mt-2 text-sm text-muted-foreground">{description}</p>
    </div>
  );
}

export function EmployeeImportFoundationPage({
  data,
  onPrepareImport,
}: EmployeeImportFoundationPageProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isPending, startTransition] = useTransition();
  const [selectedFile, setSelectedFile] = useState<EmployeeImportFileMetadata | null>(
    null,
  );
  const [result, setResult] = useState<EmployeeImportActionState | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const acceptedFormats = useMemo(
    () => ".csv,.xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv",
    [],
  );

  function toFileMetadata(file: File): EmployeeImportFileMetadata {
    return {
      name: file.name,
      size: file.size,
      mimeType: file.type,
    };
  }

  function runPreparation(file: File) {
    const metadata = toFileMetadata(file);
    setSelectedFile(metadata);

    startTransition(async () => {
      const nextResult = await onPrepareImport({ file: metadata });
      setResult(nextResult);
    });
  }

  function onFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    runPreparation(file);
  }

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-2">
          <Link
            href="/admin/users"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
            Back to Employees
          </Link>
          <div>
            <h1 className="text-2xl font-semibold">Import Employees</h1>
            <p className="text-sm text-muted-foreground">
              Prepare a safe, scalable employee import workflow for {data.companyName}
              without executing records yet.
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          <Button asChild variant="outline">
            <Link href="/admin/users/import/template">
              <Download className="size-4" aria-hidden="true" />
              Download Template
            </Link>
          </Button>
          <Button type="button" onClick={() => fileInputRef.current?.click()}>
            <UploadCloud className="size-4" aria-hidden="true" />
            Choose File
          </Button>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept={acceptedFormats}
        className="hidden"
        onChange={onFileChange}
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Employees"
          value={String(data.employeeCount)}
          description="Existing records available for duplicate detection architecture."
        />
        <StatCard
          title="Active Roles"
          value={String(data.roleCount)}
          description="Future role mapping will use current active role definitions."
        />
        <StatCard
          title="Manager Options"
          value={String(data.managerCount)}
          description="Reporting manager checks will reuse the current employee hierarchy."
        />
        <StatCard
          title="Upload Limit"
          value={formatBytes(data.maxUploadSizeBytes)}
          description="Foundation file validation is ready for CSV and Excel uploads."
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-6">
          <section className="rounded-xl border bg-card p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-lg bg-secondary text-secondary-foreground">
                <UploadCloud className="size-5" aria-hidden="true" />
              </div>
              <div>
                <h2 className="text-base font-semibold">Upload Source</h2>
                <p className="text-sm text-muted-foreground">
                  Drag and drop a CSV or Excel file, or choose one from your device.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(event) => {
                event.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={(event) => {
                event.preventDefault();
                setIsDragging(false);
              }}
              onDrop={(event) => {
                event.preventDefault();
                setIsDragging(false);
                const file = event.dataTransfer.files?.[0];

                if (file) {
                  runPreparation(file);
                }
              }}
              className={`mt-5 flex min-h-52 w-full flex-col items-center justify-center rounded-xl border border-dashed px-6 py-10 text-center transition-colors ${
                isDragging
                  ? "border-primary bg-primary/5"
                  : "border-border bg-background hover:border-primary/40 hover:bg-accent/20"
              }`}
            >
              <div className="flex size-12 items-center justify-center rounded-full bg-secondary text-secondary-foreground">
                <FileSpreadsheet className="size-6" aria-hidden="true" />
              </div>
              <p className="mt-4 text-base font-semibold">
                Drop your import file here
              </p>
              <p className="mt-2 max-w-lg text-sm text-muted-foreground">
                Supported formats: {data.supportedFormats.join(" and ")}. This sprint
                validates file readiness only and does not import employees yet.
              </p>
              <p className="mt-4 text-xs text-muted-foreground">
                Maximum size: {formatBytes(data.maxUploadSizeBytes)}
              </p>
            </button>

            <div className="mt-5 rounded-lg border bg-background p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-medium">Selected file</p>
                  <p className="text-sm text-muted-foreground">
                    {selectedFile
                      ? `${selectedFile.name} • ${formatBytes(selectedFile.size)}`
                      : "No file selected yet."}
                  </p>
                </div>
                {isPending ? (
                  <div className="inline-flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                    Preparing foundation
                  </div>
                ) : null}
              </div>

              {result?.ok ? (
                <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-200">
                  {result.message}
                </div>
              ) : null}

              {result && !result.ok ? (
                <div className="mt-4 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
                  <p className="font-medium">{result.message}</p>
                  <ul className="mt-2 space-y-1">
                    {result.issues.map((issue) => (
                      <li key={`${issue.field}-${issue.message}`}>
                        {issue.message}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>
          </section>

          <section className="rounded-xl border bg-card p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-lg bg-secondary text-secondary-foreground">
                <ShieldCheck className="size-5" aria-hidden="true" />
              </div>
              <div>
                <h2 className="text-base font-semibold">Import Wizard</h2>
                <p className="text-sm text-muted-foreground">
                  The pipeline is designed now so future sprints can add parsing,
                  validation, preview, import, and summary without refactoring.
                </p>
              </div>
            </div>

            <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {data.wizardSteps.map((step, index) => (
                <div key={step.key} className="rounded-lg border bg-background p-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Step {index + 1}
                  </p>
                  <p className="mt-2 font-medium">{step.label}</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {step.description}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-5 rounded-lg border bg-background p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="font-medium">Progress Placeholder</p>
                  <p className="text-sm text-muted-foreground">
                    {result?.ok
                      ? result.preparedFile.progressLabel
                      : "Upload validation is available now. Preview and execution remain disabled until later sprints."}
                  </p>
                </div>
                <span className="rounded-full bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground">
                  Foundation Only
                </span>
              </div>
            </div>
          </section>

          <section className="rounded-xl border bg-card p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-lg bg-secondary text-secondary-foreground">
                <FileSpreadsheet className="size-5" aria-hidden="true" />
              </div>
              <div>
                <h2 className="text-base font-semibold">Template Columns</h2>
                <p className="text-sm text-muted-foreground">
                  Start imports with one stable schema across CSV and Excel sources.
                </p>
              </div>
            </div>

            <div className="mt-5 overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="px-3 py-2 font-medium">Column</th>
                    <th className="px-3 py-2 font-medium">Required</th>
                    <th className="px-3 py-2 font-medium">Description</th>
                    <th className="px-3 py-2 font-medium">Example</th>
                  </tr>
                </thead>
                <tbody>
                  {data.templateColumns.map((column) => (
                    <tr key={column.key} className="border-b last:border-b-0">
                      <td className="px-3 py-3 font-medium">{column.label}</td>
                      <td className="px-3 py-3">
                        {column.required ? "Yes" : "No"}
                      </td>
                      <td className="px-3 py-3 text-muted-foreground">
                        {column.description}
                      </td>
                      <td className="px-3 py-3 text-muted-foreground">
                        {column.example}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>

        <div className="space-y-4">
          <section className="rounded-xl border bg-card p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-lg bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300">
                <Users className="size-5" aria-hidden="true" />
              </div>
              <div>
                <h2 className="text-base font-semibold">Validation Scope</h2>
                <p className="text-sm text-muted-foreground">
                  Rules prepared in the architecture for later row-level validation.
                </p>
              </div>
            </div>
            <ul className="mt-5 space-y-3 text-sm text-muted-foreground">
              <li>Employee ID required, uppercase-normalized, and checked for uniqueness.</li>
              <li>Phone required and prepared for Bangladesh mobile number validation.</li>
              <li>Role must match an existing active company role.</li>
              <li>Manager must match an existing active employee record.</li>
              <li>Joining date format validation is prepared for future preview checks.</li>
            </ul>
          </section>

          <section className="rounded-xl border bg-card p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                <UploadCloud className="size-5" aria-hidden="true" />
              </div>
              <div>
                <h2 className="text-base font-semibold">Recent Import Jobs</h2>
                <p className="text-sm text-muted-foreground">
                  Job history storage is ready even though execution has not started yet.
                </p>
              </div>
            </div>

            {data.recentJobs.length > 0 ? (
              <div className="mt-5 space-y-3">
                {data.recentJobs.map((job) => (
                  <div key={job.id} className="rounded-lg border bg-background p-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-medium">{job.sourceFileName}</p>
                      <span className="rounded-full bg-secondary px-2.5 py-1 text-xs font-medium text-secondary-foreground">
                        {job.status}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {job.fileType.toUpperCase()} • {job.totalRows} row(s)
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="mt-5 rounded-lg border border-dashed bg-background p-6 text-center text-sm text-muted-foreground">
                No import jobs yet. Future sprints will populate this history after
                preview and execution are enabled.
              </div>
            )}
          </section>
        </div>
      </div>
    </section>
  );
}
