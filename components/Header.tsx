import React from 'react';
import { RefreshIcon, MenuIcon } from './icons/Icons';

export interface DateRange {
  start: { year: number; month: number };
  end: { year: number; month: number };
}

interface HeaderProps {
  onRefresh: () => void;
  toggleSidebar: () => void;
  currentView: string;
  dateRange: DateRange;
  setDateRange: (range: DateRange) => void;
  isOverallView: boolean;
  setIsOverallView: (isOverall: boolean) => void;
}

export const Header: React.FC<HeaderProps> = ({ 
  onRefresh, toggleSidebar, currentView, 
  dateRange, setDateRange,
  isOverallView, setIsOverallView
}) => {
  const viewTitles: { [key: string]: string } = {
    dashboard: 'Health Analytics Dashboard',
    patients: 'Patient Directory',
    timeline: 'Encounters Timeline'
  };

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 10 }, (_, i) => currentYear - i);
  const months = [
    { value: 1, name: 'January' }, { value: 2, name: 'February' }, { value: 3, name: 'March' },
    { value: 4, name: 'April' }, { value: 5, name: 'May' }, { value: 6, name: 'June' },
    { value: 7, name: 'July' }, { value: 8, name: 'August' }, { value: 9, name: 'September' },
    { value: 10, name: 'October' }, { value: 11, name: 'November' }, { value: 12, name: 'December' },
  ];
  
  const handleDateChange = (part: 'start' | 'end', type: 'year' | 'month', value: number) => {
    const newRange = { ...dateRange, [part]: { ...dateRange[part], [type]: value } };
    
    // Validation: ensure end date is not before start date
    const startDate = new Date(newRange.start.year, newRange.start.month - 1);
    const endDate = new Date(newRange.end.year, newRange.end.month - 1);
    
    if (endDate < startDate) {
        if (part === 'start') {
            newRange.end = newRange.start;
        } else {
            newRange.start = newRange.end;
        }
    }
    setDateRange(newRange);
  };

  const ToggleSwitch: React.FC = () => (
    <div className="flex items-center cursor-pointer bg-slate-200 rounded-full p-1">
      <button onClick={() => setIsOverallView(false)} className={`px-3 py-1 text-sm font-semibold rounded-full transition-colors ${!isOverallView ? 'bg-white text-slate-800 shadow' : 'text-slate-500'}`}>
        Date Range
      </button>
      <button onClick={() => setIsOverallView(true)} className={`px-3 py-1 text-sm font-semibold rounded-full transition-colors ${isOverallView ? 'bg-white text-slate-800 shadow' : 'text-slate-500'}`}>
        Overall
      </button>
    </div>
  );

  return (
    <header className="flex items-center justify-between p-4 bg-white border-b border-slate-200 shadow-sm flex-wrap gap-4">
      <div className="flex items-center">
        <button onClick={toggleSidebar} className="text-gray-500 focus:outline-none lg:hidden mr-4">
          <MenuIcon className="h-6 w-6" />
        </button>
        <h1 className="text-xl md:text-2xl font-semibold text-slate-800">{viewTitles[currentView]}</h1>
      </div>
      <div className="flex items-center gap-2 flex-wrap">
        <ToggleSwitch />
        <div className={`flex items-center gap-2 transition-opacity duration-300 ${isOverallView ? 'opacity-50 cursor-not-allowed' : 'opacity-100'}`}>
           <span className="text-sm font-medium text-slate-500">From:</span>
           <select
            value={dateRange.start.month}
            onChange={(e) => handleDateChange('start', 'month', Number(e.target.value))}
            className="px-2 py-2 border border-slate-300 rounded-md bg-white text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
            disabled={isOverallView}
          >
            {months.map(month => <option key={`start-month-${month.value}`} value={month.value}>{month.name}</option>)}
          </select>
          <select
            value={dateRange.start.year}
            onChange={(e) => handleDateChange('start', 'year', Number(e.target.value))}
            className="px-2 py-2 border border-slate-300 rounded-md bg-white text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
            disabled={isOverallView}
          >
            {years.map(year => <option key={`start-year-${year}`} value={year}>{year}</option>)}
          </select>
          <span className="text-sm font-medium text-slate-500 ml-2">To:</span>
           <select
            value={dateRange.end.month}
            onChange={(e) => handleDateChange('end', 'month', Number(e.target.value))}
            className="px-2 py-2 border border-slate-300 rounded-md bg-white text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
            disabled={isOverallView}
          >
            {months.map(month => <option key={`end-month-${month.value}`} value={month.value}>{month.name}</option>)}
          </select>
          <select
            value={dateRange.end.year}
            onChange={(e) => handleDateChange('end', 'year', Number(e.target.value))}
            className="px-2 py-2 border border-slate-300 rounded-md bg-white text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
            disabled={isOverallView}
          >
            {years.map(year => <option key={`end-year-${year}`} value={year}>{year}</option>)}
          </select>
        </div>
        <button
          onClick={onRefresh}
          className="flex items-center px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
        >
          <RefreshIcon className="h-5 w-5 mr-2" />
          Refresh
        </button>
      </div>
    </header>
  );
};
