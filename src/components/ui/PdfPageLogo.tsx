import React from 'react';
import { cn } from '@/lib/utils';
import { LOGO_CONFIG } from '@/config/logo-config';

interface PdfPageLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'default' | 'minimal' | 'icon-only' | 'text-only';
  className?: string;
  showHover?: boolean;
  useImage?: boolean; // Option to use image version instead of SVG
}

const PdfPageLogo: React.FC<PdfPageLogoProps> = ({
  size = 'md',
  variant = 'default',
  className,
  showHover = true,
  useImage = true
}) => {
  const sizeClasses = {
    sm: {
      icon: 'w-6 h-6',
      container: 'w-8 h-8',
      text: 'text-lg',
      spacing: 'space-x-1.5'
    },
    md: {
      icon: 'w-8 h-8',
      container: 'w-12 h-12',
      text: 'text-xl',
      spacing: 'space-x-2'
    },
    lg: {
      icon: 'w-10 h-10',
      container: 'w-14 h-14',
      text: 'text-2xl',
      spacing: 'space-x-3'
    },
    xl: {
      icon: 'w-12 h-12',
      container: 'w-16 h-16',
      text: 'text-3xl',
      spacing: 'space-x-4'
    }
  };

  const currentSize = sizeClasses[size];

  // Official PdfPage PP Logo Component
  const LogoIcon = () => {
    if (useImage) {
      // Use the official hosted image version
      return (
        <div className={cn(
          currentSize.container,
          "relative overflow-hidden rounded-lg transition-all duration-300 bg-white shadow-sm border border-gray-100",
          showHover && "group-hover:scale-105 group-hover:shadow-md"
        )}>
          <img
            src={LOGO_CONFIG.getLogoUrl('webp', 512)}
            alt="PdfPage Logo"
            className={cn(currentSize.container, "object-contain p-1")}
            loading="lazy"
          />
          {/* Enhanced glow effect */}
          {showHover && (
            <div className="absolute -inset-1 bg-gradient-to-r from-red-500/40 to-red-600/40 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-sm -z-10"></div>
          )}
        </div>
      );
    }

    // SVG version for faster loading and scalability
    return (
      <div className={cn(
        currentSize.container,
        "relative overflow-hidden rounded-lg transition-all duration-300 bg-white",
        showHover && "group-hover:scale-105"
      )}>
        <svg
          viewBox="0 0 100 100"
          className={cn(currentSize.container)}
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Clean white background */}
          <rect width="100" height="100" fill="white" rx="8"/>

          {/* PP Logo - clear and bold design */}
          <g transform="translate(15, 20)">
            {/* First P - bold and clear */}
            <path
              d="M0 0 L0 60 L8 60 L8 35 L25 35 C30 35 32 30 32 25 C32 20 30 15 25 15 L8 15 L8 0 Z M8 7 L25 7 C27 7 28 10 28 15 C28 20 27 23 25 23 L8 23 Z"
              fill="#dc2626"
              stroke="#dc2626"
              strokeWidth="0.5"
            />

            {/* Second P - bold and clear */}
            <path
              d="M40 0 L40 60 L48 60 L48 35 L65 35 C70 35 72 30 72 25 C72 20 70 15 65 15 L48 15 L48 0 Z M48 7 L65 7 C67 7 68 10 68 15 C68 20 67 23 65 23 L48 23 Z"
              fill="#dc2626"
              stroke="#dc2626"
              strokeWidth="0.5"
            />
          </g>
        </svg>
        
        {/* Glow effect */}
        {showHover && (
          <div className="absolute -inset-1 bg-gradient-to-r from-red-600/30 to-red-700/30 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-sm -z-10"></div>
        )}
      </div>
    );
  };

  // Brand text with modern typography - enhanced visibility
  const BrandText = ({ showFull = true }) => (
    <div className="flex flex-col leading-none">
      <span className={cn(
        currentSize.text,
        "font-black text-gray-900 tracking-tight drop-shadow-sm"
      )}>
        <span className="text-red-600">Pdf</span>
        <span className="text-gray-900">Page</span>
      </span>
      {showFull && size !== 'sm' && (
        <span className="text-xs text-red-500 font-semibold tracking-wider uppercase">
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
