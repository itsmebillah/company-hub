export function getRenderableImageSrc(value: string | null | undefined) {
  const src = value?.trim();

  if (!src) {
    return null;
  }

  if (
    src.startsWith("/") ||
    src.startsWith("http://") ||
    src.startsWith("https://") ||
    src.startsWith("data:image/") ||
    src.startsWith("blob:")
  ) {
    return src;
  }

  return null;
}
