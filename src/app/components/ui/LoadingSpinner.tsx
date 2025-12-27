import * as React from 'react';
import { cn } from '../../lib/utils/cn';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  color?: 'blue' | 'white' | 'gray' | 'purple';
  className?: string;
  showText?: boolean;
  text?: string;
}

const LoadingSpinner = React.forwardRef<HTMLDivElement, LoadingSpinnerProps>(
  ({ size = 'md', color = 'blue', className, showText = false, text = 'Loading...' }, ref) => {
    
    const sizeClasses = {
      sm: 'h-4 w-4 border-2',
      md: 'h-8 w-8 border-3',
      lg: 'h-12 w-12 border-4',
      xl: 'h-16 w-16 border-4',
    };

    const colorClasses = {
      blue: 'border-blue-200 border-t-blue-600',
      white: 'border-gray-200 border-t-white',
      gray: 'border-gray-200 border-t-gray-600',
      purple: 'border-purple-200 border-t-purple-600',
    };

    return (
      <div 
        ref={ref}
        className={cn(
          "flex flex-col items-center justify-center gap-3",
          className
        )}
      >
        <div className="relative">
          <div
            className={cn(
              "rounded-full animate-spin",
              sizeClasses[size],
              colorClasses[color]
            )}
          />
          {size === 'md' || size === 'lg' || size === 'xl' ? (
            <div className={cn(
              "absolute inset-0 flex items-center justify-center",
              size === 'md' ? "text-xs" : size === 'lg' ? "text-sm" : "text-base"
            )}>
              <div className={cn(
                "rounded-full",
                size === 'md' ? "h-6 w-6" : size === 'lg' ? "h-10 w-10" : "h-14 w-14",
                color === 'blue' ? 'bg-blue-50' :
                color === 'white' ? 'bg-gray-800' :
                color === 'gray' ? 'bg-gray-50' :
                'bg-purple-50'
              )} />
            </div>
          ) : null}
        </div>
        
        {showText && (
          <p className={cn(
            "text-sm font-medium",
            color === 'blue' ? 'text-blue-600' :
            color === 'white' ? 'text-white' :
            color === 'gray' ? 'text-gray-600' :
            'text-purple-600'
          )}>
            {text}
          </p>
        )}
      </div>
    );
  }
);
LoadingSpinner.displayName = 'LoadingSpinner';

export { LoadingSpinner };

// Simple spinner variant
export const Spinner = ({ className }: { className?: string }) => (
  <div className={cn("animate-spin rounded-full border-2 border-gray-300 border-t-blue-600", className)} />
);

// Dots loader variant
export const DotsLoader = ({ className }: { className?: string }) => (
  <div className={cn("flex items-center space-x-1", className)}>
    <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse" />
    <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse delay-150" />
    <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse delay-300" />
  </div>
);