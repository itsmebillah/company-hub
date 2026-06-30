import { ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";

type PaginationProps = {
  page: number;
  pageCount: number;
  rowsPerPage: number;
  onPageChange: (page: number) => void;
  onRowsPerPageChange: (rowsPerPage: number) => void;
};

export function Pagination({
  page,
  pageCount,
  rowsPerPage,
  onPageChange,
  onRowsPerPageChange,
}: PaginationProps) {
  return (
    <div className="flex flex-col gap-3 border-t p-4 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-2">
        <span>Rows per page</span>
        <select
          value={rowsPerPage}
          onChange={(event) => onRowsPerPageChange(Number(event.target.value))}
          className="h-9 rounded-md border bg-background px-2 outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <option value={5}>5</option>
          <option value={10}>10</option>
          <option value={20}>20</option>
        </select>
      </div>
      <div className="flex items-center justify-between gap-3 sm:justify-end">
        <span>
          Page {page} of {pageCount}
        </span>
        <div className="flex gap-2">
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={page <= 1}
            onClick={() => onPageChange(Math.max(page - 1, 1))}
          >
            <ChevronLeft className="size-4" aria-hidden="true" />
            Previous
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={page >= pageCount}
            onClick={() => onPageChange(Math.min(page + 1, pageCount))}
          >
            Next
            <ChevronRight className="size-4" aria-hidden="true" />
          </Button>
        </div>
      </div>
    </div>
  );
}
