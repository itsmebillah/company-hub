"use client";

import { RotateCcw, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  RESOURCE_SORTS,
  RESOURCE_TYPES,
} from "@/features/resources/constants/resource-options";
import type { ResourceCategoryOption } from "@/features/resources/types/resource.types";

type ResourceFiltersProps = {
  categories: ResourceCategoryOption[];
  search: string;
  categoryId: string;
  resourceType: string;
  status: string;
  featured: string;
  sort: string;
  onChange: (filters: Record<string, string>) => void;
  onReset: () => void;
};

export function ResourceFilters({
  categories,
  search,
  categoryId,
  resourceType,
  status,
  featured,
  sort,
  onChange,
  onReset,
}: ResourceFiltersProps) {
  return (
    <div className="rounded-2xl border bg-card p-3 shadow-sm">
      <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-6">
        <label className="relative xl:col-span-2">
          <span className="sr-only">Search resources</span>
          <Search
            className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <input
            value={search}
            onChange={(event) => onChange({ search: event.target.value })}
            placeholder="Search resources"
            className="h-9 w-full rounded-xl border bg-background pl-9 pr-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </label>

        <select
          value={categoryId}
          onChange={(event) => onChange({ categoryId: event.target.value })}
          className="h-9 rounded-xl border bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label="Filter by category"
        >
          <option value="">All Categories</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>

        <select
          value={resourceType}
          onChange={(event) => onChange({ resourceType: event.target.value })}
          className="h-9 rounded-xl border bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label="Filter by type"
        >
          <option value="">All Types</option>
          {RESOURCE_TYPES.map((type) => (
            <option key={type.value} value={type.value}>
              {type.label}
            </option>
          ))}
        </select>

        <select
          value={status}
          onChange={(event) => onChange({ status: event.target.value })}
          className="h-9 rounded-xl border bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label="Filter by status"
        >
          <option value="">All Statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="archived">Archived</option>
        </select>

        <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-2">
          <select
            value={featured}
            onChange={(event) => onChange({ featured: event.target.value })}
            className="h-9 rounded-xl border bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label="Filter by featured"
          >
            <option value="">All</option>
            <option value="true">Featured</option>
            <option value="false">Not Featured</option>
          </select>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="h-9 w-9 rounded-xl px-0"
            onClick={onReset}
            aria-label="Reset filters"
            title="Reset filters"
          >
            <RotateCcw className="size-4" aria-hidden="true" />
          </Button>
        </div>
      </div>

      <div className="mt-2 flex flex-col gap-1.5 sm:flex-row sm:items-center sm:gap-2">
        <span className="text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
          Sort
        </span>
        <select
          value={sort}
          onChange={(event) => onChange({ sort: event.target.value })}
          className="h-9 rounded-xl border bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring sm:w-auto"
          aria-label="Sort resources"
        >
          {RESOURCE_SORTS.map((item) => (
            <option key={item.value} value={item.value}>
              {item.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
