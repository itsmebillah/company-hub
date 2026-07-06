"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";

import { EmptyState } from "@/components/common/empty-state";
import { CategoryCard } from "@/features/employee-resources/components/category-card";
import { EmployeeResourceCard } from "@/features/employee-resources/components/employee-resource-card";
import type { EmployeeResourcePortalData } from "@/features/employee-resources/types/employee-resource.types";

type EmployeeResourcePortalProps = {
  data: EmployeeResourcePortalData;
};

export function EmployeeResourcePortal({ data }: EmployeeResourcePortalProps) {
  const [search, setSearch] = useState("");
  const [activeCategoryId, setActiveCategoryId] = useState(
    data.categories[0]?.id ?? "",
  );

  const filteredCategories = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return data.categories
      .map((category) => ({
        ...category,
        resources: category.resources.filter((resource) => {
          if (!normalizedSearch) {
            return true;
          }

          return (
            resource.title.toLowerCase().includes(normalizedSearch) ||
            resource.description.toLowerCase().includes(normalizedSearch)
          );
        }),
      }))
      .filter((category) => category.resources.length > 0);
  }, [data.categories, search]);

  const activeCategory =
    filteredCategories.find((category) => category.id === activeCategoryId) ??
    filteredCategories[0];

  return (
    <div className="space-y-4">
      <div className="rounded-xl border bg-card p-3 shadow-sm">
        <label className="relative block">
          <span className="sr-only">Search resources</span>
          <Search
            className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search resources by title or description"
            className="h-11 w-full rounded-lg border bg-background pl-10 pr-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </label>
      </div>

      {filteredCategories.length === 0 ? (
        <EmptyState
          title="No Resources Available"
          description="No active resources are available for your role right now."
          className="bg-card shadow-sm"
        />
      ) : (
        <div className="grid gap-4 xl:grid-cols-[300px_minmax(0,1fr)]">
          <aside className="space-y-3">
            <h2 className="text-base font-semibold">Categories</h2>
            <div className="-mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-1 sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0 xl:grid-cols-1">
              {filteredCategories.map((category) => (
                <CategoryCard
                  key={category.id}
                  category={category}
                  isActive={category.id === activeCategory?.id}
                  onSelect={setActiveCategoryId}
                />
              ))}
            </div>
          </aside>

          <section className="space-y-3">
            <div>
              <h2 className="text-base font-semibold">
                {activeCategory?.name ?? "Resources"}
              </h2>
            </div>
            <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
              {activeCategory?.resources.map((resource) => (
                <EmployeeResourceCard key={resource.id} resource={resource} />
              ))}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
