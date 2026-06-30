export function RoleBadge({ role }: { role: string }) {
  return (
    <span className="inline-flex h-7 items-center rounded-full border bg-secondary px-2.5 text-xs font-medium text-secondary-foreground">
      {role}
    </span>
  );
}
