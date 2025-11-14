import React from 'react';

interface DashboardCardProps {
  title: string;
  value: string | number;
  icon: React.ElementType;
  color: 'indigo' | 'sky' | 'amber' | 'emerald';
}

export const DashboardCard: React.FC<DashboardCardProps> = ({ title, value, icon: Icon, color }) => {
  const colorClasses = {
    indigo: { bg: 'bg-indigo-500', from: 'from-indigo-500', to: 'to-indigo-400', text: 'text-indigo-600' },
    sky: { bg: 'bg-sky-500', from: 'from-sky-500', to: 'to-sky-400', text: 'text-sky-600' },
    amber: { bg: 'bg-amber-500', from: 'from-amber-500', to: 'to-amber-400', text: 'text-amber-600' },
    emerald: { bg: 'bg-emerald-500', from: 'from-emerald-500', to: 'to-emerald-400', text: 'text-emerald-600' },
  };
  const selectedColor = colorClasses[color];

  return (
    <div className="bg-white p-6 rounded-xl shadow-md flex items-center space-x-4 transition-transform transform hover:-translate-y-1">
      <div className={`p-4 rounded-lg bg-gradient-to-br ${selectedColor.from} ${selectedColor.to} text-white shadow-lg`}>
        <Icon className="h-7 w-7" />
      </div>
      <div>
        <p className="text-sm font-medium text-slate-500">{title}</p>
        <p className="text-3xl font-bold text-slate-800">{value}</p>
      </div>
    </div>
  );
};