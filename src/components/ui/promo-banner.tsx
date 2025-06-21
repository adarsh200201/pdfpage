interface PromoBannerProps {
  className?: string;
  onClose?: () => void;
  closeable?: boolean;
}

export function PromoBanner({
  className = "",
  onClose,
  closeable = true,
}: PromoBannerProps) {
  // Component disabled - promotional content removed
  return null;
}
