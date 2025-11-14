
import React, { useState, useMemo } from 'react';
import type { Patient } from '../types';
import { PatientCard } from './PatientCard';
import { SearchIcon } from './icons/Icons';

interface PatientDashboardProps {
  patients: Patient[];
  onSelectPatient: (patient: Patient) => void;
}

export const PatientDashboard: React.FC<PatientDashboardProps> = ({ patients, onSelectPatient }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredPatients = useMemo(() => {
    if (!searchTerm) return patients;
    return patients.filter(p => {
      const name = p.name?.[0]?.text || `${p.name?.[0]?.given?.join(' ')} ${p.name?.[0]?.family}`;
      return name.toLowerCase().includes(searchTerm.toLowerCase());
    });
  }, [patients, searchTerm]);

  return (
    <div className="space-y-6">
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <SearchIcon className="h-5 w-5 text-gray-400" />
        </div>
        <input
          type="text"
          placeholder="Search by patient name..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
        />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredPatients.map(patient => (
          <PatientCard key={patient.id} patient={patient} onSelectPatient={onSelectPatient} />
        ))}
      </div>
    </div>
  );
};
