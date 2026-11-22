import React from 'react';
import { cn } from '../../lib/utils';
import { LoadingSpinner } from './LoadingSpinner';
import { motion } from 'motion/react';

interface ButtonProps extends Omit<React.ComponentProps<typeof motion.button>, 'children'> {
  children?: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export function Button({
  children,
  className,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  disabled,
  ...props
}: ButtonProps) {
  const baseStyles = "inline-flex items-center justify-center gap-2 font-medium [&>i]:!mr-0 [&>i]:!ml-0 disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2";

  const variants = {
    primary: "bg-accent text-gray-50 hover:bg-accent/90",
    secondary: "bg-gray-100 text-gray-800 hover:bg-gray-200",
    outline: "border-2 border-accent text-accent hover:bg-accent hover:text-gray-50",
  };

  const sizes = {
    sm: "px-3 text-sm h-[var(--btn-height-sm)] rounded-full",
    md: "px-4 h-[var(--btn-height-md)] rounded-full",
    lg: "px-6 text-lg h-[var(--btn-height-lg)] rounded-full",

  };

  return (
    <motion.button
      whileTap={{ transform: 'scale(0.98)' }}
      transition={{ duration: 0.12, ease: [0.23, 1, 0.32, 1] }}
      className={cn(
        baseStyles,
        variants[variant],
        sizes[size],
        "transition-[background-color,border-color,color,box-shadow] duration-200",
        isLoading && "cursor-wait",
        className
      )}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <LoadingSpinner size="sm" />
      ) : leftIcon ? (
        <span>{leftIcon}</span>
      ) : null}
      {children}
      {rightIcon && !isLoading && <span>{rightIcon}</span>}
    </motion.button>
  );
}
