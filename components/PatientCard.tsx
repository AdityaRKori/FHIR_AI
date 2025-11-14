import React from 'react';
import type { Patient } from '../types';
import { UserIcon } from './icons/Icons';

interface PatientCardProps {
  patient: Patient;
  onSelectPatient: (patient: Patient) => void;
}

export const PatientCard: React.FC<PatientCardProps> = ({ patient, onSelectPatient }) => {
  const name = patient.name?.[0]?.text || `${patient.name?.[0]?.given?.join(' ')} ${patient.name?.[0]?.family}`;
  const birthDate = patient.birthDate;
  const age = birthDate ? Math.floor((new Date().getTime() - new Date(birthDate).getTime()) / 3.15576e+10) : 'N/A';

  return (
    <div
      onClick={() => onSelectPatient(patient)}
      className="bg-white p-4 rounded-xl shadow-md cursor-pointer hover:shadow-lg hover:ring-2 hover:ring-indigo-500 transition-all duration-200"
    >
      <div className="flex items-center space-x-4">
        <div className="flex-shrink-0 bg-slate-100 rounded-full p-3">
            <UserIcon className="w-6 h-6 text-slate-500" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-base font-semibold text-indigo-600 truncate">{name}</p>
          <p className="text-sm text-slate-500">{patient.gender ? patient.gender.charAt(0).toUpperCase() + patient.gender.slice(1) : 'Unknown' }, {age} years</p>
        </div>
      </div>
    </div>
  );
};