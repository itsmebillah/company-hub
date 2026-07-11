"use client";

import Link from "next/link";
import { useRef, useState, useTransition, type ChangeEvent } from "react";
import {
  AlertCircle,
  ArrowLeft,
  Download,
  FileSpreadsheet,
  Loader2,
  Play,
  RotateCcw,
  ShieldCheck,
  Trash2,
  UploadCloud,
  Users,
  XCircle,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { parseEmployeeImportFile } from "@/features/employee-import/services/employee-import-parser";
import type {
  EmployeeImportActionState,
  EmployeeImportExecutionState,
  EmployeeImportFailedRowExport,
  EmployeeImportFileMetadata,
  EmployeeImportFoundationData,
  EmployeeImportPreviewResult,
  EmployeeImportUploadValues,
} from "@/features/employee-import/types/employee-import.types";

type EmployeeImportPageProps = {
  data: EmployeeImportFoundationData;
  onPreviewImport: (
    values: EmployeeImportUploadValues,
  ) => Promise<EmployeeImportActionState>;
  onProcessBatch: (jobId: string) => Promise<EmployeeImportExecutionState>;
  onGetFailedRows: (jobId: string) => Promise<EmployeeImportFailedRowExport[]>;
};

type ImportSummaryState = {
  imported: number;
  failed: number;
  remaining: number;
  skipped: number;
  duplicate: number;
  total: number;
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

function buildFailedRowCsv(rows: EmployeeImportFailedRowExport[]) {
  const headers = [
    "row_number",
    "employee_id",
    "employee_name",
    "phone",
    "role_name",
    "manager_employee_id",
    "joining_date",
    "status",
    "email",
    "date_of_birth",
    "photo_url",
    "reason",
  ];

  const escape = (value: string) => `"${value.replace(/"/g, '""')}"`;
  const body = rows.map((row) =>
    [
      String(row.rowNumber),
      row.employeeId,
      row.employeeName,
      row.phone,
      row.roleName,
      row.managerEmployeeId,
      row.joiningDate,
      row.status,
      row.email,
      row.dateOfBirth,
      row.photoUrl,
      row.reason,
    ]
      .map(escape)
      .join(","),
  );

  return [headers.join(","), ...body].join("\n");
}

function downloadCsv(fileName: string, content: string) {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");

  anchor.href = url;
  anchor.download = fileName;
  anchor.click();
  URL.revokeObjectURL(url);
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
  onPreviewImport,
  onProcessBatch,
  onGetFailedRows,
}: EmployeeImportPageProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isPreparingPreview, startPreviewTransition] = useTransition();
  const [isImporting, startImportTransition] = useTransition();
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<EmployeeImportFileMetadata | null>(
    null,
  );
  const [previewState, setPreviewState] = useState<EmployeeImportActionState | null>(
    null,
  );
  const [progressMessage, setProgressMessage] = useState("");
  const [summary, setSummary] = useState<ImportSummaryState | null>(null);
  const [batchRows, setBatchRows] = useState<string[]>([]);
  const [failedRows, setFailedRows] = useState<EmployeeImportFailedRowExport[]>([]);

  const preview = previewState?.ok ? previewState.preview : null;

  function resetImportState() {
    setSelectedFile(null);
    setPreviewState(null);
    setProgressMessage("");
    setSummary(null);
    setBatchRows([]);
    setFailedRows([]);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  async function preparePreview(file: File) {
    const metadata: EmployeeImportFileMetadata = {
      name: file.name,
      size: file.size,
      mimeType: file.type,
      lastModified: file.lastModified,
    };

    setSelectedFile(metadata);
    setProgressMessage("Parsing file...");
    setSummary(null);
    setBatchRows([]);
    setFailedRows([]);

    startPreviewTransition(async () => {
      try {
        const parsed = await parseEmployeeImportFile(file);
        setProgressMessage("Running validation preview...");
        const result = await onPreviewImport({
          file: { ...metadata, mimeType: metadata.mimeType || parsed.fileType },
          rows: parsed.rows,
        });
        setPreviewState(result);
        setProgressMessage(
          result.ok
            ? "Preview ready. Review rows, then start the import."
            : result.message,
        );
      } catch (error) {
        setPreviewState({
          ok: false,
          message:
            error instanceof Error ? error.message : "Unable to parse import file.",
          issues: [
            {
              field: "file",
              message:
                error instanceof Error ? error.message : "Unable to parse import file.",
            },
          ],
        });
        setProgressMessage("Unable to parse the selected file.");
      }
    });
  }

  function onFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    void preparePreview(file);
  }

  function startImport(jobId: string) {
    startImportTransition(async () => {
      setProgressMessage("Import started...");
      const failedExportRows: EmployeeImportFailedRowExport[] = [];

      while (true) {
        const result = await onProcessBatch(jobId);

        if (!result.ok) {
          setProgressMessage(result.message);
          break;
        }

        setSummary({
          imported: result.importedCount,
          failed: result.failedCount,
          remaining: result.remainingCount,
          skipped: result.skippedCount,
          duplicate: result.duplicateCount,
          total: result.totalRows,
        });
        setBatchRows(
          result.rows.map(
            (row) =>
              `Row ${row.rowNumber}: ${row.employeeId || "Unknown"} - ${row.status} (${row.reason})`,
          ),
        );
        setProgressMessage(
          result.completed
            ? "Import completed."
            : `Importing... ${result.importedCount} imported, ${result.failedCount} failed, ${result.remainingCount} remaining.`,
        );

        if (result.completed) {
          const rows = await onGetFailedRows(jobId);
          failedExportRows.push(...rows);
          setFailedRows(rows);
          break;
        }
      }
    });
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
              Parse, validate, preview, import, and summarize employee files for{" "}
              {data.companyName}.
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
          <Button type="button" variant="outline" onClick={resetImportState}>
            <RotateCcw className="size-4" aria-hidden="true" />
            Reset
          </Button>
          <Button type="button" onClick={() => fileInputRef.current?.click()}>
            <UploadCloud className="size-4" aria-hidden="true" />
            Browse File
          </Button>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept=".csv,.xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv"
        className="hidden"
        onChange={onFileChange}
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Employees"
          value={String(data.employeeCount)}
          description="Existing records used for duplicate validation."
        />
        <StatCard
          title="Active Roles"
          value={String(data.roleCount)}
          description="Role mapping uses active role definitions from the company."
        />
        <StatCard
          title="Manager Options"
          value={String(data.managerCount)}
          description="Manager mapping uses active employees inside the current company."
        />
        <StatCard
          title="Upload Limit"
          value={formatBytes(data.maxUploadSizeBytes)}
          description="Maximum supported upload size for CSV and Excel import files."
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
        <div className="space-y-6">
          <section className="rounded-xl border bg-card p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-lg bg-secondary text-secondary-foreground">
                <UploadCloud className="size-5" aria-hidden="true" />
              </div>
              <div>
                <h2 className="text-base font-semibold">Upload</h2>
                <p className="text-sm text-muted-foreground">
                  Drag and drop a CSV or Excel file, replace it at any time, or remove it.
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
                  void preparePreview(file);
                }
              }}
              className={`mt-5 flex min-h-56 w-full flex-col items-center justify-center rounded-xl border border-dashed px-6 py-10 text-center transition-colors ${
                isDragging
                  ? "border-primary bg-primary/5"
                  : "border-border bg-background hover:border-primary/40 hover:bg-accent/20"
              }`}
            >
              <div className="flex size-12 items-center justify-center rounded-full bg-secondary text-secondary-foreground">
                <FileSpreadsheet className="size-6" aria-hidden="true" />
              </div>
              <p className="mt-4 text-base font-semibold">Drop CSV or Excel here</p>
              <p className="mt-2 max-w-lg text-sm text-muted-foreground">
                Supported formats: {data.supportedFormats.join(" and ")}. File parsing and
                preview validation run before any employee is imported.
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
                <div className="flex gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    Replace
                  </Button>
                  <Button type="button" size="sm" variant="outline" onClick={resetImportState}>
                    <Trash2 className="size-4" aria-hidden="true" />
                    Remove
                  </Button>
                </div>
              </div>

              {(isPreparingPreview || isImporting) && (
                <div className="mt-4 inline-flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                  {progressMessage || "Working..."}
                </div>
              )}

              {!isPreparingPreview && !isImporting && progressMessage ? (
                <p className="mt-4 text-sm text-muted-foreground">{progressMessage}</p>
              ) : null}

              {previewState && !previewState.ok ? (
                <div className="mt-4 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
                  <div className="flex items-center gap-2 font-medium">
                    <AlertCircle className="size-4" aria-hidden="true" />
                    {previewState.message}
                  </div>
                  <ul className="mt-2 space-y-1">
                    {previewState.issues.map((issue) => (
                      <li key={`${issue.field}-${issue.message}`}>{issue.message}</li>
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
                  End-to-end import pipeline with real parsing, preview, import, and summary.
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
          </section>

          {preview ? (
            <section className="rounded-xl border bg-card p-5 shadow-sm">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 className="text-base font-semibold">Preview</h2>
                  <p className="text-sm text-muted-foreground">
                    Review valid rows, invalid rows, and duplicate detection before import.
                  </p>
                </div>
                <Button
                  type="button"
                  onClick={() => startImport(preview.jobId)}
                  disabled={isImporting || preview.summary.validRows === 0}
                >
                  <Play className="size-4" aria-hidden="true" />
                  Start Import
                </Button>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <StatCard
                  title="Total Rows"
                  value={String(preview.summary.totalRows)}
                  description="Parsed from the selected file."
                />
                <StatCard
                  title="Valid Rows"
                  value={String(preview.summary.validRows)}
                  description="Ready for import execution."
                />
                <StatCard
                  title="Invalid Rows"
                  value={String(preview.summary.invalidRows)}
                  description="Require correction before import."
                />
                <StatCard
                  title="Duplicate Rows"
                  value={String(preview.summary.duplicateRows)}
                  description="Detected in-file or against current company records."
                />
              </div>

              <div className="mt-5 overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-muted-foreground">
                      <th className="px-3 py-2 font-medium">Row</th>
                      <th className="px-3 py-2 font-medium">Employee ID</th>
                      <th className="px-3 py-2 font-medium">Name</th>
                      <th className="px-3 py-2 font-medium">Phone</th>
                      <th className="px-3 py-2 font-medium">Role</th>
                      <th className="px-3 py-2 font-medium">Manager</th>
                      <th className="px-3 py-2 font-medium">Status</th>
                      <th className="px-3 py-2 font-medium">Issues</th>
                    </tr>
                  </thead>
                  <tbody>
                    {preview.rows.map((row) => (
                      <tr key={row.rowNumber} className="border-b last:border-b-0">
                        <td className="px-3 py-3">{row.rowNumber}</td>
                        <td
                          className={`px-3 py-3 ${
                            row.issues.some((issue) => issue.field === "employeeId")
                              ? "bg-destructive/10 text-destructive"
                              : ""
                          }`}
                        >
                          {row.normalized.employeeId}
                        </td>
                        <td className="px-3 py-3">{row.normalized.name}</td>
                        <td
                          className={`px-3 py-3 ${
                            row.issues.some((issue) => issue.field === "phone")
                              ? "bg-destructive/10 text-destructive"
                              : ""
                          }`}
                        >
                          {row.normalized.phone}
                        </td>
                        <td
                          className={`px-3 py-3 ${
                            row.issues.some((issue) => issue.field === "roleName")
                              ? "bg-destructive/10 text-destructive"
                              : ""
                          }`}
                        >
                          {row.normalized.roleName}
                        </td>
                        <td
                          className={`px-3 py-3 ${
                            row.issues.some((issue) => issue.field === "managerEmployeeId")
                              ? "bg-destructive/10 text-destructive"
                              : ""
                          }`}
                        >
                          {row.normalized.managerEmployeeId || "—"}
                        </td>
                        <td
                          className={`px-3 py-3 ${
                            row.issues.some((issue) => issue.field === "status")
                              ? "bg-destructive/10 text-destructive"
                              : ""
                          }`}
                        >
                          {row.normalized.status}
                        </td>
                        <td className="px-3 py-3">
                          {row.issues.length > 0 ? (
                            <ul className="space-y-1 text-xs text-destructive">
                              {row.issues.map((issue) => (
                                <li key={`${row.rowNumber}-${issue.field}-${issue.message}`}>
                                  {issue.message}
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <span className="text-emerald-600">Valid</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          ) : null}

          {summary ? (
            <section className="rounded-xl border bg-card p-5 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-lg bg-secondary text-secondary-foreground">
                  <Users className="size-5" aria-hidden="true" />
                </div>
                <div>
                  <h2 className="text-base font-semibold">Import Summary</h2>
                  <p className="text-sm text-muted-foreground">
                    Real-time progress and final results from batch execution.
                  </p>
                </div>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
                <StatCard title="Imported" value={String(summary.imported)} description="Successfully created employees." />
                <StatCard title="Failed" value={String(summary.failed)} description="Rows that failed during execution." />
                <StatCard title="Remaining" value={String(summary.remaining)} description="Valid rows still waiting for processing." />
                <StatCard title="Skipped" value={String(summary.skipped)} description="Preview-invalid rows not sent to execution." />
                <StatCard title="Duplicate" value={String(summary.duplicate)} description="Rows flagged as duplicates during preview." />
              </div>

              {failedRows.length > 0 ? (
                <div className="mt-5 flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() =>
                      downloadCsv(
                        "employee-import-failed-rows.csv",
                        buildFailedRowCsv(failedRows),
                      )
                    }
                  >
                    <Download className="size-4" aria-hidden="true" />
                    Export Failed Rows
                  </Button>
                </div>
              ) : null}

              {batchRows.length > 0 ? (
                <div className="mt-5 rounded-lg border bg-background p-4">
                  <p className="font-medium">Latest Batch Result</p>
                  <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                    {batchRows.map((row) => (
                      <li key={row}>{row}</li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </section>
          ) : null}
        </div>

        <div className="space-y-4">
          <section className="rounded-xl border bg-card p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-lg bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300">
                <ShieldCheck className="size-5" aria-hidden="true" />
              </div>
              <div>
                <h2 className="text-base font-semibold">Validation Rules</h2>
                <p className="text-sm text-muted-foreground">
                  Preview checks run before any employee is imported.
                </p>
              </div>
            </div>
            <ul className="mt-5 space-y-3 text-sm text-muted-foreground">
              <li>Employee ID required, uppercased, unique in file, and unique in database.</li>
              <li>Phone required, Bangladesh-formatted, and duplicate-checked in file and database.</li>
              <li>Role must exist in the current company.</li>
              <li>Manager must exist in the current company and satisfy hierarchy rules.</li>
              <li>Joining date and optional date of birth must use YYYY-MM-DD format.</li>
              <li>Status must be active, inactive, or archived.</li>
            </ul>
          </section>

          <section className="rounded-xl border bg-card p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                <UploadCloud className="size-5" aria-hidden="true" />
              </div>
              <div>
                <h2 className="text-base font-semibold">Import History</h2>
                <p className="text-sm text-muted-foreground">
                  Recent import jobs stored in the database.
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
                      {job.fileType.toUpperCase()} • {job.totalRows} row(s) • {job.successfulRows} success • {job.failedRows} failed
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="mt-5 rounded-lg border border-dashed bg-background p-6 text-center text-sm text-muted-foreground">
                No import history yet.
              </div>
            )}
          </section>

          {failedRows.length > 0 ? (
            <section className="rounded-xl border bg-card p-5 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-lg bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300">
                  <XCircle className="size-5" aria-hidden="true" />
                </div>
                <div>
                  <h2 className="text-base font-semibold">Failed Rows</h2>
                  <p className="text-sm text-muted-foreground">
                    Execution and preview failures are available for export.
                  </p>
                </div>
              </div>
              <div className="mt-5 space-y-3">
                {failedRows.slice(0, 5).map((row) => (
                  <div key={`${row.rowNumber}-${row.employeeId}`} className="rounded-lg border bg-background p-4">
                    <p className="font-medium">
                      Row {row.rowNumber}: {row.employeeId || "Unknown Employee"}
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">{row.reason}</p>
                  </div>
                ))}
              </div>
            </section>
          ) : null}
        </div>
      </div>
    </section>
  );
}
