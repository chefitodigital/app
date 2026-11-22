interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  fullscreen?: boolean;
}

export function LoadingSpinner({ size = 'md', className = '', fullscreen = false }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16',
  };

  const borderSizes = {
    sm: 'border-2',
    md: 'border-4',
    lg: 'border-4',
    xl: 'border-4',
  };

  const spinner = (
    <div className={`relative ${className}`}>
      <div className={`${sizeClasses[size]} ${borderSizes[size]} border-accent rounded-full animate-spin border-t-transparent`}></div>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className={`${sizeClasses[size]} scale-75 bg-accent rounded-full animate-ping opacity-75`}></div>
      </div>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className={`${sizeClasses[size]} scale-50 bg-accent rounded-full animate-pulse`}></div>
      </div>
    </div>
  );

  if (fullscreen) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        {spinner}
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center">
      {spinner}
    </div>
  );
}