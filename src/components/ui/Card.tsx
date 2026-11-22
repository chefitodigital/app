import React from 'react';
import { cn } from '../../lib/utils';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  hover?: boolean;
}

const paddingStyles = {
  none: '',
  sm: 'p-3 sm:p-4',
  md: 'p-4 sm:p-6',
  lg: 'p-5 sm:p-8',
};

export const Card = React.memo(function Card({ children, className, padding = 'md', hover = false, ...props }: CardProps) {
  return (
    <div
      {...props}
      className={cn(
        'ui-card relative bg-gray-50/70 backdrop-blur-xl rounded-2xl border border-gray-50/60 shadow-card',
        paddingStyles[padding],
        hover && 'transition-[transform,box-shadow,background-color] duration-200 ease-out hover:shadow-card-hover hover:-translate-y-0.5 hover:bg-gray-50/85',
        className
      )}
    >
      {children}
    </div>
  );
});

interface CardHeaderProps {
  children: React.ReactNode;
  className?: string;
  action?: React.ReactNode;
}

export function CardHeader({ children, className, action }: CardHeaderProps) {
  return (
    <div className={cn('flex items-center justify-between gap-3 mb-4 sm:mb-6', className)}>
      <div className="min-w-0 flex-1">{children}</div>
      {action && <div className="flex-shrink-0">{action}</div>}
    </div>
  );
}

interface CardTitleProps {
  children: React.ReactNode;
  className?: string;
  icon?: string;
  description?: string;
}

export function CardTitle({ children, className, icon, description }: CardTitleProps) {
  return (
    <div className={cn('min-w-0', className)}>
      <div className="flex items-center gap-2 sm:gap-3">
        {icon && (
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-accent/10 flex items-center justify-center flex-shrink-0">
            <i className={`fas fa-${icon} text-accent text-sm sm:text-base`}></i>
          </div>
        )}
        <div className="min-w-0">
          <h2 className="text-base sm:text-xl font-bold text-gray-800 font-title truncate">{children}</h2>
          {description && (
            <p className="text-xs sm:text-sm text-gray-500 mt-0.5 hidden sm:block">{description}</p>
          )}
        </div>
      </div>
    </div>
  );
}

export function CardContent({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn('', className)}>{children}</div>;
}

export function CardFooter({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('mt-6 pt-6 border-t border-gray-100', className)}>
      {children}
    </div>
  );
}
