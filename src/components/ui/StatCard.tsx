import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  change?: string;
  positive?: boolean;
  icon: LucideIcon;
  iconColor?: string;
  iconBg?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  title, value, change, positive = true, icon: Icon,
  iconColor = 'text-brand-600', iconBg = 'bg-brand-50'
}) => (
  <div className="card">
    <div className="flex items-start justify-between">
      <div>
        <p className="text-sm text-gray-500 font-medium">{title}</p>
        <p className="text-2xl font-semibold text-gray-900 mt-1">{value}</p>
        {change && (
          <p className={`text-xs mt-1 font-medium ${positive ? 'text-green-600' : 'text-red-500'}`}>
            {positive ? '↑' : '↓'} {change} from yesterday
          </p>
        )}
      </div>
      <div className={`w-10 h-10 rounded-xl ${iconBg} flex items-center justify-center`}>
        <Icon className={`w-5 h-5 ${iconColor}`} />
      </div>
    </div>
  </div>
);
