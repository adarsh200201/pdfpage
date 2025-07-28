import React from 'react';
import { cn } from '@/lib/utils';

interface PdfPageLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'default' | 'minimal' | 'icon-only' | 'text-only';
  className?: string;
  showHover?: boolean;
}

const PdfPageLogo: React.FC<PdfPageLogoProps> = ({
  size = 'md',
  variant = 'default',
  className,
  showHover = true
}) => {
  const sizeClasses = {
    sm: {
      icon: 'w-6 h-6',
      container: 'w-8 h-8',
      text: 'text-lg',
      spacing: 'space-x-1.5'
    },
    md: {
      icon: 'w-7 h-7',
      container: 'w-10 h-10',
      text: 'text-xl',
      spacing: 'space-x-2'
    },
    lg: {
      icon: 'w-8 h-8',
      container: 'w-12 h-12',
      text: 'text-2xl',
      spacing: 'space-x-3'
    },
    xl: {
      icon: 'w-10 h-10',
      container: 'w-14 h-14',
      text: 'text-3xl',
      spacing: 'space-x-4'
    }
  };

  const currentSize = sizeClasses[size];

  // Modern PDF icon with clean design
  const LogoIcon = () => (
    <div className={cn(
      currentSize.container,
      "bg-gradient-to-br from-red-500 via-red-600 to-red-700 rounded-xl flex items-center justify-center shadow-lg transition-all duration-300",
      showHover && "group-hover:shadow-2xl group-hover:scale-105",
      "relative overflow-hidden"
    )}>
      {/* Background pattern for depth */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
      
      {/* Main PDF icon */}
      <svg
        viewBox="0 0 24 24"
        className={cn(currentSize.icon, "text-white relative z-10")}
        fill="currentColor"
      >
        <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
        <path d="M8,12V14H10V16H8V18H10.5C11.3,18 12,17.3 12,16.5V15.5C12,14.7 11.3,14 10.5,14H10V12H8M10,13H10.5C10.8,13 11,13.2 11,13.5C11,13.8 10.8,14 10.5,14H10V13Z" />
      </svg>
      
      {/* Glow effect */}
      {showHover && (
        <div className="absolute -inset-1 bg-gradient-to-r from-red-600/30 to-red-700/30 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-sm -z-10"></div>
      )}
    </div>
  );

  // Brand text with modern typography
  const BrandText = ({ showFull = true }) => (
    <div className="flex flex-col leading-none">
      <span className={cn(
        currentSize.text,
        "font-black bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 bg-clip-text text-transparent tracking-tight"
      )}>
        {showFull ? 'PdfPage' : 'PDF'}
      </span>
      {showFull && size !== 'sm' && (
        <span className="text-xs text-gray-500 font-medium tracking-wider uppercase">
          Pro Tools
        </span>
      )}
    </div>
  );

  // Return based on variant
  switch (variant) {
    case 'icon-only':
      return (
        <div className={cn("group", className)}>
          <LogoIcon />
        </div>
      );
      
    case 'text-only':
      return (
        <div className={cn("group", className)}>
          <BrandText />
        </div>
      );
      
    case 'minimal':
      return (
        <div className={cn("flex items-center group", currentSize.spacing, className)}>
          <LogoIcon />
          <BrandText showFull={false} />
        </div>
      );
      
    default:
      return (
        <div className={cn("flex items-center group", currentSize.spacing, className)}>
          <LogoIcon />
          <BrandText />
        </div>
      );
  }
};

export default PdfPageLogo;
