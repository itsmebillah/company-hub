import { Link2 } from "lucide-react";

type ResourceIconProps = {
  icon: string;
  title: string;
};

export function ResourceIcon({ icon, title }: ResourceIconProps) {
  if (icon.startsWith("http")) {
    return (
      <img
        src={icon}
        alt=""
        className="size-10 rounded-lg border bg-background object-cover"
      />
    );
  }

  if (icon.trim()) {
    return (
      <div className="flex size-10 items-center justify-center rounded-lg border bg-background text-sm font-semibold">
        {icon.slice(0, 2).toUpperCase()}
      </div>
    );
  }

  return (
    <div className="flex size-10 items-center justify-center rounded-lg bg-secondary text-secondary-foreground">
      <Link2 className="size-4" aria-hidden="true" />
      <span className="sr-only">{title}</span>
    </div>
  );
}
