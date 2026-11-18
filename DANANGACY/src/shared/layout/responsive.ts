export type ResponsiveLayout = {
  isWideLayout: boolean;
  horizontalPadding: number;
  maxWidth: number | undefined;
};

export function getResponsiveLayout(width: number): ResponsiveLayout {
  const isWideLayout = width >= 768;
  return {
    isWideLayout,
    horizontalPadding: isWideLayout ? 24 : width >= 400 ? 20 : 16,
    maxWidth: isWideLayout ? 768 : undefined,
  };
}
