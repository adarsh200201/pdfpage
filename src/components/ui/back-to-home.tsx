import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

interface BackToHomeProps {
  className?: string;
  containerClassName?: string;
}

/**
 * Centralized Back to Home button component
 * Uses consistent styling across all pages matching the Merge page design
 */
export const BackToHome: React.FC<BackToHomeProps> = ({
  className,
  containerClassName,
}) => {
  return (
    <div className={cn("flex items-center space-x-2 mb-8", containerClassName)}>
      <Link
        to="/"
        className={cn(
          "text-body-medium text-text-light hover:text-brand-red transition-colors",
          className
        )}
      >
        <ArrowLeft className="w-4 h-4 mr-1 inline" />
        Back to Home
      </Link>
    </div>
  );
};

export default BackToHome;
