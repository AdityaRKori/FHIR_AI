import React, { useState, useEffect, useMemo } from 'react';
import type { Patient, Observation, Condition, Encounter } from '../types';
import { generateHealthSummary } from '../services/geminiService';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { XIcon, UserCircleIcon, ClipboardListIcon, SparklesIcon, HeartIcon, ChartBarIcon, CalendarIcon } from './icons/Icons';

interface PatientDetailModalProps {
  patient: Patient;
  observations: Observation[];
  conditions: Condition[];
  encounters: Encounter[];
  onClose: () => void;
}

type Tab = 'summary' | 'vitals' | 'history';

const VitalSign: React.FC<{ label: string; value: string; }> = ({ label, value }) => (
    <div className="flex justify-between py-2 border-b border-slate-200">
        <dt className="text-sm font-medium text-slate-500">{label}</dt>
        <dd className="text-sm font-semibold text-slate-800">{value}</dd>
    </div>
);

export const PatientDetailModal: React.FC<PatientDetailModalProps> = ({ patient, observations, conditions, encounters, onClose }) => {
  const [summary, setSummary] = useState<string>('Generating AI summary...');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<Tab>('summary');

  useEffect(() => {
    const fetchSummary = async () => {
      setIsLoading(true);
      const result = await generateHealthSummary(patient, observations, conditions);
      setSummary(result);
      setIsLoading(false);
    };
    fetchSummary();
  }, [patient, observations, conditions]);

  const name = patient.name?.[0]?.text || `${patient.name?.[0]?.given?.join(' ')} ${patient.name?.[0]?.family}`;
  const age = patient.birthDate ? Math.floor((new Date().getTime() - new Date(patient.birthDate).getTime()) / 3.15576e+10) : 'N/A';
  
  const getVitalValue = (obs: Observation) => {
      if(obs.valueQuantity) return `${obs.valueQuantity.value.toFixed(1)} ${obs.valueQuantity.unit}`;
      if(obs.component) return obs.component.map(c => `${c.valueQuantity?.value.toFixed(0)}${c.valueQuantity?.unit}`).join('/');
      return 'N/A';
  }

  const TabButton: React.FC<{tab: Tab, label: string, icon: React.FC<any>}> = ({tab, label, icon: Icon}) => (
    <button onClick={() => setActiveTab(tab)} className={`flex items-center px-4 py-2 text-sm font-semibold rounded-md transition-colors ${activeTab === tab ? 'bg-indigo-100 text-indigo-700' : 'text-slate-600 hover:bg-slate-100'}`}>
        <Icon className="w-5 h-5 mr-2" />
        {label}
    </button>
  );

  const renderContent = () => {
    switch(activeTab) {
        case 'summary':
            return (
                <div className="bg-indigo-50 p-5 rounded-lg border border-indigo-200">
                    <h3 className="flex items-center text-lg font-semibold text-slate-800 mb-3">
                        <SparklesIcon className="w-6 h-6 mr-2 text-indigo-500" />
                        AI Health Summary
                    </h3>
                    {isLoading ? (
                      <div className="flex items-center space-x-2 text-slate-500">
                        <svg className="animate-spin h-5 w-5 text-indigo-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span>Generating...</span>
                      </div>
                    ) : (
                        <p className="text-sm text-slate-700 leading-relaxed">{summary}</p>
                    )}
                </div>
            );
        case 'vitals':
            return (
                 <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-slate-50 p-4 rounded-lg">
                        <h3 className="flex items-center text-lg font-semibold text-slate-800 mb-3">
                            <HeartIcon className="w-6 h-6 mr-2 text-red-500" />
                            Recent Vitals
                        </h3>
                        <dl>
                            {observations.length > 0 ? observations.slice(0, 5).map(obs => (
                                 <VitalSign key={obs.id} label={obs.code.text || obs.code.coding?.[0]?.display || 'Vital'} value={getVitalValue(obs)} />
                            )) : <p className="text-sm text-slate-500">No observation data found.</p>}
                        </dl>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-lg">
                        <h3 className="flex items-center text-lg font-semibold text-slate-800 mb-3">
                            <ClipboardListIcon className="w-6 h-6 mr-2 text-amber-500" />
                            Active Conditions
                        </h3>
                        <ul className="space-y-2">
                            {conditions.length > 0 ? conditions.map(cond => (
                                <li key={cond.id} className="text-sm font-medium text-slate-900 bg-white p-2 rounded-md shadow-sm">{cond.code.text || cond.code.coding?.[0]?.display}</li>
                            )) : <p className="text-sm text-slate-500">No condition data found.</p>}
                        </ul>
                    </div>
                </div>
            );
        case 'history':
            return (
                <div className="bg-slate-50 p-4 rounded-lg">
                    <h3 className="flex items-center text-lg font-semibold text-slate-800 mb-3">
                        <CalendarIcon className="w-6 h-6 mr-2 text-emerald-500" />
                        Encounter History
                    </h3>
                    <div className="space-y-3 max-h-80 overflow-y-auto pr-2">
                        {encounters && encounters.length > 0 ? [...encounters]
                            .sort((a, b) => new Date(b.period?.start || 0).getTime() - new Date(a.period?.start || 0).getTime())
                            .map(e => (
                                <div key={e.id} className="p-3 bg-white rounded-md shadow-sm border-l-4 border-sky-400">
                                    <p className="font-semibold text-slate-800">{e.type?.[0]?.text || e.class?.display || 'Encounter'}</p>
                                    <p className="text-sm text-slate-500">{e.period?.start ? new Date(e.period.start).toLocaleString() : 'Date not specified'}</p>
                                    <p className="text-sm text-slate-600 mt-1">Status: <span className="font-medium capitalize">{e.status}</span></p>
                                </div>
                            )) : <p className="text-sm text-slate-500 text-center py-8">No encounter history found.</p>}
                    </div>
                </div>
            );
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 bg-white p-4 border-b border-slate-200 flex justify-between items-center z-10 rounded-t-xl">
          <h2 className="text-xl font-bold text-slate-800">Patient Details</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <XIcon className="h-6 w-6" />
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto space-y-6">
            {/* Demographics */}
            <div className="bg-slate-50 p-4 rounded-lg">
                <h3 className="flex items-center text-lg font-semibold text-slate-800 mb-3">
                    <UserCircleIcon className="w-6 h-6 mr-2 text-sky-500" />
                    Demographics
                </h3>
                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2">
                    <VitalSign label="Name" value={name} />
                    <VitalSign label="Gender" value={patient.gender || 'Unknown'} />
                    <VitalSign label="Age" value={`${age} years`} />
                    <VitalSign label="Date of Birth" value={patient.birthDate || 'Unknown'} />
                </dl>
            </div>
            
             {/* Tabs */}
            <div className="border-b border-slate-200">
                <nav className="flex space-x-2" aria-label="Tabs">
                    <TabButton tab="summary" label="AI Summary" icon={SparklesIcon} />
                    <TabButton tab="vitals" label="Vitals & Conditions" icon={HeartIcon} />
                    <TabButton tab="history" label="Encounter History" icon={CalendarIcon} />
                </nav>
            </div>

            {/* Tab Content */}
            <div className="mt-4">
                {renderContent()}
            </div>
        </div>
      </div>
    </div>
  );
};