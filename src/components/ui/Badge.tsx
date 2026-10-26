import React from 'react';

const variants = {
  green:  'bg-green-50  text-green-700  border-green-100',
  red:    'bg-red-50    text-red-700    border-red-100',
  yellow: 'bg-yellow-50 text-yellow-700 border-yellow-100',
  blue:   'bg-blue-50   text-blue-700   border-blue-100',
  gray:   'bg-gray-50   text-gray-700   border-gray-100',
  purple: 'bg-purple-50 text-purple-700 border-purple-100',
} as const;

interface BadgeProps {
  label: string;
  variant?: keyof typeof variants;
}

export const Badge: React.FC<BadgeProps> = ({ label, variant = 'gray' }) => (
  <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border ${variants[variant]}`}>
    {label}
  </span>
);
