import { ResourceVisual } from "@/features/resources/ui/resource-visual";

type ResourceIconProps = {
  icon: string;
  title: string;
  customImage?: string;
  url?: string;
};

export function ResourceIcon({
  icon,
  title,
  customImage,
  url,
}: ResourceIconProps) {
  return (
    <ResourceVisual
      icon={icon}
      customImage={customImage}
      url={url}
      title={title}
      className="bg-secondary text-secondary-foreground size-10 rounded-lg"
    />
  );
}
