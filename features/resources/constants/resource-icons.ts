import {
  BarChart3,
  BookOpen,
  BriefcaseBusiness,
  Building2,
  CalendarDays,
  FileText,
  Globe2,
  GraduationCap,
  HeartPulse,
  LifeBuoy,
  Link2,
  Mail,
  MessageSquare,
  ShieldCheck,
  ShoppingBag,
  Users,
  Wrench,
  Zap,
  type LucideIcon,
} from "lucide-react";

type ResourceIconOption = {
  value: string;
  label: string;
  icon: LucideIcon;
};

export const RESOURCE_ICON_OPTIONS: ResourceIconOption[] = [
  { value: "link-2", label: "Link", icon: Link2 },
  { value: "globe-2", label: "Website", icon: Globe2 },
  { value: "book-open", label: "Knowledge", icon: BookOpen },
  { value: "file-text", label: "Document", icon: FileText },
  { value: "bar-chart-3", label: "Report", icon: BarChart3 },
  { value: "calendar-days", label: "Calendar", icon: CalendarDays },
  { value: "users", label: "People", icon: Users },
  { value: "building-2", label: "Company", icon: Building2 },
  { value: "briefcase-business", label: "Work", icon: BriefcaseBusiness },
  { value: "graduation-cap", label: "Learning", icon: GraduationCap },
  { value: "heart-pulse", label: "Benefits", icon: HeartPulse },
  { value: "life-buoy", label: "Support", icon: LifeBuoy },
  { value: "mail", label: "Email", icon: Mail },
  { value: "message-square", label: "Message", icon: MessageSquare },
  { value: "shield-check", label: "Security", icon: ShieldCheck },
  { value: "shopping-bag", label: "Store", icon: ShoppingBag },
  { value: "wrench", label: "Tool", icon: Wrench },
  { value: "zap", label: "Quick action", icon: Zap },
];

function normalizeIconName(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

const iconAliases = new Map<string, LucideIcon>();

for (const option of RESOURCE_ICON_OPTIONS) {
  iconAliases.set(normalizeIconName(option.value), option.icon);
  iconAliases.set(normalizeIconName(option.label), option.icon);
  iconAliases.set(
    normalizeIconName(option.icon.displayName ?? ""),
    option.icon,
  );
}

const legacyAliases: Record<string, string> = {
  globe: "globe-2",
  "bar-chart": "bar-chart-3",
  building: "building-2",
  briefcase: "briefcase-business",
  message: "message-square",
  shield: "shield-check",
};

for (const [alias, canonicalValue] of Object.entries(legacyAliases)) {
  const option = RESOURCE_ICON_OPTIONS.find(
    (item) => item.value === canonicalValue,
  );

  if (option) {
    iconAliases.set(normalizeIconName(alias), option.icon);
  }
}

export function getResourceIconComponent(value: string | null | undefined) {
  if (!value) {
    return null;
  }

  return iconAliases.get(normalizeIconName(value)) ?? null;
}
