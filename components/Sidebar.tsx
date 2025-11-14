import React from 'react';
import { HealthIcon } from './icons/Icons';

interface SidebarProps {
  currentView: string;
  setView: (view: any) => void;
  navigationItems: { name: string; view: string; icon: React.FC<any> }[];
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentView, setView, navigationItems, isOpen, setIsOpen }) => {
  const baseItemClass = 'flex items-center px-4 py-3 text-slate-200 hover:bg-slate-700 hover:text-white rounded-lg transition-colors duration-200 font-medium';
  const activeItemClass = 'bg-slate-900 text-white';

  return (
    <>
      {/* Mobile-first drawer */}
      <div className={`fixed inset-0 z-30 bg-gray-900 bg-opacity-50 transition-opacity lg:hidden ${isOpen ? 'block' : 'hidden'}`} onClick={() => setIsOpen(false)}></div>
      <div className={`fixed inset-y-0 left-0 z-40 w-64 bg-slate-800 text-white transform ${isOpen ? 'translate-x-0' : '-translate-x-full'} transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0 lg:flex lg:flex-shrink-0`}>
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-center h-20 border-b border-slate-700">
             <HealthIcon className="h-8 w-8 text-sky-400" />
            <h1 className="ml-3 text-2xl font-bold">FHIR Health</h1>
          </div>
          <nav className="flex-1 px-4 py-6 space-y-2">
            {navigationItems.map(item => (
              <a
                key={item.name}
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  setView(item.view);
                  setIsOpen(false);
                }}
                className={`${baseItemClass} ${currentView === item.view ? activeItemClass : ''}`}
              >
                <item.icon className="h-6 w-6 mr-3" />
                {item.name}
              </a>
            ))}
          </nav>
        </div>
      </div>
    </>
  );
};