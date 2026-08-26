import {
  Bell,
  Building2,
  CalendarDays,
  ChartNoAxesCombined,
  CircleHelp,
  ClipboardList,
  FolderKanban,
  Gauge,
  HeartPulse,
  LayoutDashboard,
  Link2,
  MapPin,
  Megaphone,
  ShieldCheck,
  SlidersHorizontal,
  UserRound,
  UsersRound,
} from "lucide-react";
import type { ComponentType } from "react";

import type { NavigationIconKey } from "@/lib/navigation/navigation-engine";

const icons = {
  announcement: Megaphone,
  attendance: Gauge,
  building: Building2,
  calendar: CalendarDays,
  company: Building2,
  dashboard: LayoutDashboard,
  feature: SlidersHorizontal,
  help: CircleHelp,
  leave: ClipboardList,
  live_location: MapPin,
  notification: Bell,
  profile: UserRound,
  quick_links: Link2,
  reports: ChartNoAxesCombined,
  resources: FolderKanban,
  roles: ShieldCheck,
  settings: SlidersHorizontal,
  system_health: HeartPulse,
  users: UsersRound,
} satisfies Record<NavigationIconKey, ComponentType<{ className?: string }>>;

export function NavigationIcon({
  name,
  className,
}: {
  name: NavigationIconKey;
  className?: string;
}) {
  const Icon = icons[name];
  return <Icon className={className} aria-hidden="true" />;
}
