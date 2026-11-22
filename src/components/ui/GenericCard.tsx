import React, { ReactNode } from 'react';
import { Card } from './Card';

export interface CardAction {
  icon: string;
  label: string;
  onClick: () => void;
  variant?: 'primary' | 'secondary';
  className?: string;
}

export interface CardBadge {
  text: string;
  variant?: 'default' | 'accent';
}

export interface CardStat {
  label: string;
  value: string | number;
  icon?: string;
}

interface GenericCardProps {
  title: string;
  subtitle?: string;
  badges?: CardBadge[];
  avatar?: {
    src?: string;
    fallbackIcon?: string;
  };
  stats?: CardStat[];
  content?: ReactNode;
  actions?: CardAction[];
  className?: string;
  onClick?: () => void;
}

const getBadgeClasses = (variant: CardBadge['variant'] = 'default') => {
  const variants = {
    default: 'bg-gray-100 text-gray-600',
    accent: 'bg-accent/10 text-accent',
  };
  return variants[variant];
};

const getActionClasses = (variant: CardAction['variant'] = 'secondary') => {
  const variants = {
    primary: 'text-accent hover:bg-accent/10',
    secondary: 'text-gray-600 hover:bg-gray-100',
  };
  return variants[variant];
};

export const GenericCard = React.memo(function GenericCard({
  title,
  subtitle,
  badges,
  avatar,
  stats,
  content,
  actions,
  className = '',
  onClick,
}: GenericCardProps) {
  return (
    <Card
      padding="none"
      className={`overflow-hidden transition-shadow duration-300 hover:shadow-card-hover ${className}`}
      onClick={onClick}
    >
      <div className="p-5">
        <div className="flex items-start gap-4 mb-4">
          {avatar && (
            <div className="w-16 h-16 rounded-lg bg-gray-100 flex items-center justify-center overflow-hidden flex-shrink-0">
              {avatar.src ? (
                <img
                  src={avatar.src}
                  alt={title}
                  loading="lazy"
                  className="w-full h-full object-cover"
                />
              ) : (
                <i className={`fas fa-${avatar.fallbackIcon || 'user'} text-2xl text-gray-400`}></i>
              )}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <h3 className="text-lg font-bold text-gray-800 font-title truncate">
                {title}
              </h3>
              {badges?.map((badge, index) => (
                <span
                  key={index}
                  className={`px-2 py-0.5 text-xs font-semibold rounded-full ${getBadgeClasses(badge.variant)}`}
                >
                  {badge.text}
                </span>
              ))}
            </div>
            {subtitle && (
              <p className="text-sm text-gray-500">{subtitle}</p>
            )}
          </div>
        </div>

        {stats && stats.length > 0 && (
          <div className={`grid grid-cols-${Math.min(stats.length, 3)} gap-3 mb-4`}>
            {stats.map((stat, index) => (
              <div key={index} className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1 flex items-center gap-1">
                  {stat.icon && <i className={`fas fa-${stat.icon} text-xs`}></i>}
                  {stat.label}
                </p>
                <p className="text-lg font-bold text-gray-800">
                  {stat.value}
                </p>
              </div>
            ))}
          </div>
        )}

        {content && (
          <div className="mb-4">
            {content}
          </div>
        )}

        {actions && actions.length > 0 && (
          <div className="flex gap-2 pt-3 border-t border-gray-100">
            {actions.map((action, index) => (
              <button
                key={index}
                onClick={(e) => {
                  e.stopPropagation();
                  action.onClick();
                }}
                className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${getActionClasses(action.variant)} ${action.className || ''}`}
                title={action.label}
              >
                <i className={`fas fa-${action.icon}`}></i>
                <span className="hidden sm:inline">{action.label}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
});
