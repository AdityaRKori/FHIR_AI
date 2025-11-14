
import React, { useMemo } from 'react';
import type { Encounter, Patient } from '../types';
import { ClockIcon, UserIcon, OfficeBuildingIcon } from './icons/Icons';

interface EncountersTimelineProps {
  encounters: Encounter[];
  patientMap: Map<string, Patient>;
}

export const EncountersTimeline: React.FC<EncountersTimelineProps> = ({ encounters, patientMap }) => {
  const sortedEncounters = useMemo(() => {
    return [...encounters]
      .filter(encounter => encounter.subject?.reference)
      .sort((a, b) => {
        const dateA = a.period?.start ? new Date(a.period.start).getTime() : 0;
        const dateB = b.period?.start ? new Date(b.period.start).getTime() : 0;
        return dateB - dateA;
      });
  }, [encounters]);

  const getPatientName = (reference: string) => {
    const patient = patientMap.get(reference);
    if (!patient) return 'Unknown Patient';
    return patient.name?.[0]?.text || `${patient.name?.[0]?.given?.join(' ')} ${patient.name?.[0]?.family}`;
  };

  const statusColors: { [key: string]: string } = {
    finished: 'bg-green-100 text-green-800',
    'in-progress': 'bg-yellow-100 text-yellow-800',
    cancelled: 'bg-red-100 text-red-800',
    planned: 'bg-blue-100 text-blue-800',
  };

  return (
    <div className="bg-white p-4 sm:p-6 rounded-lg shadow-md">
      <div className="relative pl-4 sm:pl-6 border-l-2 border-gray-200">
        {sortedEncounters.map((encounter, index) => (
          <div key={encounter.id} className="mb-8 relative">
            <div className="absolute -left-[2.8rem] sm:-left-[3.8rem] top-1 flex items-center justify-center w-8 h-8 bg-blue-500 rounded-full text-white">
               <OfficeBuildingIcon className="w-5 h-5"/>
            </div>
            <div className="ml-6 sm:ml-4">
              <div className="flex items-center justify-between">
                <h3 className="text-md sm:text-lg font-semibold text-gray-800">
                  {encounter.type?.[0]?.text || encounter.class?.display || 'Encounter'}
                </h3>
                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${statusColors[encounter.status] || 'bg-gray-100 text-gray-800'}`}>
                  {encounter.status}
                </span>
              </div>
              <div className="mt-2 text-sm text-gray-500 space-y-2">
                <div className="flex items-center">
                  <UserIcon className="w-4 h-4 mr-2" />
                  <span>{getPatientName(encounter.subject.reference)}</span>
                </div>
                <div className="flex items-center">
                  <ClockIcon className="w-4 h-4 mr-2" />
                  <span>{encounter.period?.start ? new Date(encounter.period.start).toLocaleString() : 'Date not specified'}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
