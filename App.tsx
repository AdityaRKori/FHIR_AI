import React, { useState, useEffect, useCallback } from 'react';
import { Sidebar } from './components/Sidebar';
import { Header, DateRange } from './components/Header';
import { AnalyticsDashboard } from './components/AnalyticsDashboard';
import { PatientDashboard } from './components/PatientDashboard';
import { EncountersTimeline } from './components/EncountersTimeline';
import { Loader } from './components/Loader';
import { PatientDetailModal } from './components/PatientDetailModal';
import { getPatientsByIds, getObservations, getConditions, getEncounters, ProcessedData, getOverallData } from './services/fhirService';
import type { Patient, Observation, Condition, Encounter } from './types';
import { HomeIcon, UsersIcon, ClockIcon } from './components/icons/Icons';

type View = 'dashboard' | 'patients' | 'timeline';

const App: React.FC = () => {
  const [view, setView] = useState<View>('dashboard');
  const [data, setData] = useState<ProcessedData | null>(null);
  const [comparativeData, setComparativeData] = useState<ProcessedData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [isSidebarOpen, setSidebarOpen] = useState(false);

  const initialEndDate = new Date();
  const initialStartDate = new Date();
  initialStartDate.setMonth(initialStartDate.getMonth() - 2);

  const [dateRange, setDateRange] = useState<DateRange>({
    start: { year: initialStartDate.getFullYear(), month: initialStartDate.getMonth() + 1 },
    end: { year: initialEndDate.getFullYear(), month: initialEndDate.getMonth() + 1 }
  });
  const [isOverallView, setIsOverallView] = useState(true);

  const processFetchedData = (patients: Patient[], observations: Observation[], conditions: Condition[], encounters: Encounter[]): ProcessedData => {
      const patientMap = new Map<string, Patient>();
      patients.forEach(p => patientMap.set(`Patient/${p.id}`, p));

      const observationMap = new Map<string, Observation[]>();
      observations.forEach(o => {
        if (o.subject?.reference) {
          const patientId = o.subject.reference;
          if (!observationMap.has(patientId)) observationMap.set(patientId, []);
          observationMap.get(patientId)?.push(o);
        }
      });

      const conditionMap = new Map<string, Condition[]>();
      conditions.forEach(c => {
        if (c.subject?.reference) {
          const patientId = c.subject.reference;
          if (!conditionMap.has(patientId)) conditionMap.set(patientId, []);
          conditionMap.get(patientId)?.push(c);
        }
      });

      const encounterMap = new Map<string, Encounter[]>();
      encounters.forEach(e => {
        if (e.subject?.reference) {
          const patientId = e.subject.reference;
          if (!encounterMap.has(patientId)) encounterMap.set(patientId, []);
          encounterMap.get(patientId)?.push(e);
        }
      });
      
      return { patients, observations, conditions, encounters, patientMap, observationMap, conditionMap, encounterMap };
  }
  
  const fetchDataForPeriod = async (start: string, end: string): Promise<ProcessedData> => {
      const [observations, conditions, encounters] = await Promise.all([
        getObservations(start, end),
        getConditions(start, end),
        getEncounters(start, end),
      ]);

      const patientIdSet = new Set<string>();
      [...observations, ...conditions, ...encounters].forEach(resource => {
        if (resource.subject?.reference) {
            patientIdSet.add(resource.subject.reference.replace('Patient/', ''));
        }
      });
      const uniquePatientIds = Array.from(patientIdSet);

      const patients = uniquePatientIds.length > 0 ? await getPatientsByIds(uniquePatientIds) : [];
      return processFetchedData(patients, observations, conditions, encounters);
  };

  const fetchDataForRange = useCallback(async (range: DateRange) => {
    setLoading(true);
    setError(null);
    setData(null);
    setComparativeData(null);

    try {
        const currentStart = `${range.start.year}-${String(range.start.month).padStart(2, '0')}`;
        const currentEnd = `${range.end.year}-${String(range.end.month).padStart(2, '0')}`;
        
        // Calculate previous period for comparison
        const startDate = new Date(range.start.year, range.start.month - 1, 1);
        const endDate = new Date(range.end.year, range.end.month, 0);
        const diffMonths = (endDate.getFullYear() - startDate.getFullYear()) * 12 + (endDate.getMonth() - startDate.getMonth()) + 1;

        const prevEndDate = new Date(startDate);
        prevEndDate.setDate(prevEndDate.getDate() - 1);
        const prevStartDate = new Date(prevEndDate);
        prevStartDate.setMonth(prevStartDate.getMonth() - (diffMonths -1));
        
        const previousStart = `${prevStartDate.getFullYear()}-${String(prevStartDate.getMonth() + 1).padStart(2, '0')}`;
        const previousEnd = `${prevEndDate.getFullYear()}-${String(prevEndDate.getMonth() + 1).padStart(2, '0')}`;

        const [currentData, prevData] = await Promise.all([
          fetchDataForPeriod(currentStart, currentEnd),
          fetchDataForPeriod(previousStart, previousEnd)
        ]);
        
        setData(currentData);
        setComparativeData(prevData);

    } catch (err) {
      setError('Failed to fetch FHIR data for the selected range. Please try again later.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);
  
  const fetchOverallData = useCallback(async () => {
    setLoading(true);
    setError(null);
    setData(null);
    setComparativeData(null);
    try {
        const { patients, observations, conditions, encounters } = await getOverallData();
        setData(processFetchedData(patients, observations, conditions, encounters));
    } catch(err) {
        setError('Failed to fetch overall FHIR data. Please try again later.');
        console.error(err);
    } finally {
        setLoading(false);
    }
  }, []);


  useEffect(() => {
    if (isOverallView) {
        fetchOverallData();
    } else {
        fetchDataForRange(dateRange);
    }
  }, [isOverallView, dateRange, fetchDataForRange, fetchOverallData]);

  const handleSelectPatient = (patient: Patient) => {
    setSelectedPatient(patient);
  };

  const handleCloseModal = () => {
    setSelectedPatient(null);
  };
  
  const handleRefresh = () => {
    if (isOverallView) {
        fetchOverallData();
    } else {
        fetchDataForRange(dateRange);
    }
  };


  const renderView = () => {
    if (!data) return null;

    switch (view) {
      case 'dashboard':
        return <AnalyticsDashboard data={data} comparativeData={comparativeData} isOverallView={isOverallView} dateRange={dateRange} />;
      case 'patients':
        return <PatientDashboard patients={data.patients} onSelectPatient={handleSelectPatient} />;
      case 'timeline':
        return <EncountersTimeline encounters={data.encounters} patientMap={data.patientMap} />;
      default:
        return <AnalyticsDashboard data={data} comparativeData={comparativeData} isOverallView={isOverallView} dateRange={dateRange} />;
    }
  };
  
  const navigationItems = [
    { name: 'Dashboard', view: 'dashboard', icon: HomeIcon },
    { name: 'Patients', view: 'patients', icon: UsersIcon },
    { name: 'Timeline', view: 'timeline', icon: ClockIcon },
  ];

  return (
    <div className="flex h-screen bg-slate-100 font-sans">
      <Sidebar 
        currentView={view} 
        setView={setView} 
        navigationItems={navigationItems}
        isOpen={isSidebarOpen}
        setIsOpen={setSidebarOpen}
      />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header 
          onRefresh={handleRefresh} 
          toggleSidebar={() => setSidebarOpen(!isSidebarOpen)} 
          currentView={view}
          dateRange={dateRange}
          setDateRange={setDateRange}
          isOverallView={isOverallView}
          setIsOverallView={setIsOverallView}
        />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-slate-100 p-4 sm:p-6 lg:p-8">
          {loading && <Loader />}
          {error && <div className="text-center text-red-500">{error}</div>}
          {!loading && !error && renderView()}
        </main>
      </div>
      {selectedPatient && data && (
        <PatientDetailModal
          patient={selectedPatient}
          observations={data.observationMap.get(`Patient/${selectedPatient.id}`) || []}
          conditions={data.conditionMap.get(`Patient/${selectedPatient.id}`) || []}
          encounters={data.encounterMap.get(`Patient/${selectedPatient.id}`) || []}
          onClose={handleCloseModal}
        />
      )}
    </div>
  );
};

export default App;
