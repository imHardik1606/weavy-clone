import * as React from 'react';
import { cn } from '../../lib/utils/cn';
import { Loader2 } from 'lucide-react';

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ 
    className, 
    variant = 'default', 
    size = 'default', 
    isLoading = false,
    leftIcon,
    rightIcon,
    children, 
    disabled,
    ...props 
  }, ref) => {
    
    const variantClasses = {
      default: "bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500",
      destructive: "bg-red-600 text-white hover:bg-red-700 focus:ring-red-500",
      outline: "border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 focus:ring-blue-500",
      secondary: "bg-gray-100 text-gray-900 hover:bg-gray-200 focus:ring-gray-500",
      ghost: "hover:bg-gray-100 hover:text-gray-900 focus:ring-gray-500",
      link: "text-blue-600 hover:text-blue-800 hover:underline p-0 h-auto",
    };

    const sizeClasses = {
      default: "h-10 px-4 py-2 text-sm",
      sm: "h-8 px-3 py-1 text-xs",
      lg: "h-12 px-6 py-3 text-base",
      icon: "h-10 w-10 p-0",
    };

    return (
      <button
        className={cn(
          "inline-flex items-center justify-center rounded-lg font-medium",
          "transition-colors duration-200",
          "focus:outline-none focus:ring-2 focus:ring-offset-2",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          variantClasses[variant],
          sizeClasses[size],
          className
        )}
        ref={ref}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading && (
          <Loader2 className={cn(
            "animate-spin",
            children ? "mr-2" : "",
            size === 'sm' ? "h-3 w-3" : "h-4 w-4"
          )} />
        )}
        {!isLoading && leftIcon && (
          <span className={cn(
            children ? "mr-2" : "",
            size === 'sm' ? "h-3 w-3" : "h-4 w-4"
          )}>
            {leftIcon}
          </span>
        )}
        {children}
        {!isLoading && rightIcon && (
          <span className={cn(
            children ? "ml-2" : "",
            size === 'sm' ? "h-3 w-3" : "h-4 w-4"
          )}>
            {rightIcon}
          </span>
        )}
      </button>
    );
  }
);
Button.displayName = 'Button';

export { Button };