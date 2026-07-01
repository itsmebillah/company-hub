import type {
  ResourceOpenMode,
  ResourceSort,
  ResourceType,
} from "@/features/resources/types/resource.types";

export const RESOURCE_TYPES: Array<{
  value: ResourceType;
  label: string;
}> = [
  { value: "google_sheet", label: "Google Sheet" },
  { value: "apps_script", label: "Apps Script" },
  { value: "power_bi", label: "Power BI" },
  { value: "looker", label: "Looker Studio" },
  { value: "website", label: "Website" },
  { value: "pdf", label: "PDF" },
  { value: "internal", label: "Internal Page" },
];

export const OPEN_MODES: Array<{
  value: ResourceOpenMode;
  label: string;
}> = [
  { value: "same_tab", label: "Same Tab" },
  { value: "new_tab", label: "New Tab" },
  { value: "external", label: "External" },
];

export const RESOURCE_SORTS: Array<{
  value: ResourceSort;
  label: string;
}> = [
  { value: "display_order", label: "Display Order" },
  { value: "title", label: "Title" },
  { value: "created_at", label: "Newest" },
  { value: "status", label: "Status" },
];

export function getResourceTypeLabel(value: ResourceType) {
  return RESOURCE_TYPES.find((item) => item.value === value)?.label ?? value;
}

export function getOpenModeLabel(value: ResourceOpenMode) {
  return OPEN_MODES.find((item) => item.value === value)?.label ?? value;
}
