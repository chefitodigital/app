import React from 'react';
import { cn } from '../../lib/utils';

interface PageHeaderProps {
  title: string;
  description?: string;
  icon?: string;
  action?: React.ReactNode;
  className?: string;
}

export function PageHeader({ title, description, icon, action, className }: PageHeaderProps) {
  return (
    <div className={cn('mb-8', className)}>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          {icon && (
            <div className="w-12 h-12 aspect-square shrink-0 rounded-lg bg-accent/10 flex items-center justify-center">
              <i className={`fas fa-${icon} text-xl text-accent`}></i>
            </div>
          )}
          <div>
            <h1 className="text-2xl font-bold text-gray-800 font-title">{title}</h1>
            {description && (
              <p className="text-gray-500 mt-1">{description}</p>
            )}
          </div>
        </div>
        {action && <div>{action}</div>}
      </div>
    </div>
  );
}
