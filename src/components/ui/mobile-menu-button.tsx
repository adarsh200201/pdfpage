import { Menu } from "lucide-react";
import { cn } from "@/lib/utils";

interface MobileMenuButtonProps {
  onClick: () => void;
  className?: string;
}

const MobileMenuButton = ({ onClick, className }: MobileMenuButtonProps) => {
  return (
    <button
      onClick={onClick}
      className={cn(
        "md:hidden p-2.5 rounded-xl bg-gradient-to-br from-blue-50 to-purple-50 hover:from-blue-100 hover:to-purple-100 border border-blue-100 hover:border-blue-200 transition-all duration-200 hover:scale-105 active:scale-95 shadow-sm hover:shadow-md",
        className,
      )}
      aria-label="Open menu"
    >
      <Menu className="w-5 h-5 text-blue-600" />
    </button>
  );
};

export default MobileMenuButton;
