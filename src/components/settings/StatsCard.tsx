interface StatsCardProps {
  title: string;
  value: string | number;
  icon: string;
  description?: string;
}

export function StatsCard({ title, value, icon, description }: StatsCardProps) {
  const iconMap: Record<string, string> = {
    'eye': 'eye',
    'users': 'users',
    'calendar': 'calendar',
    'calendar-days': 'calendar-days',
    'shopping-bag': 'bag-shopping',
    'trending-up': 'arrow-trend-up',
    'bar-chart': 'chart-bar'
  };

  const fontAwesomeIcon = iconMap[icon] || icon;

  return (
    <div className="bg-gray-50 rounded-lg p-6 shadow-lg hover:shadow-xl transition-shadow duration-300">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm text-gray-600 font-medium mb-1">{title}</p>
          <p className="text-3xl font-bold text-gray-800">{value}</p>
          {description && (
            <p className="text-xs text-gray-500 mt-2">{description}</p>
          )}
        </div>
        <div className="flex-shrink-0 ml-4">
          <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center">
            <i className={`fa-solid fa-${fontAwesomeIcon} text-accent text-xl`}></i>
          </div>
        </div>
      </div>
    </div>
  );
}
