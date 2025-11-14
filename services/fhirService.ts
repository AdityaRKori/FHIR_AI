import type { Patient, Observation, Condition, Encounter, Bundle, Resource } from '../types';

const BASE_URL = 'https://server.fire.ly/r4';

const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

async function fetchFhirResource<T extends Resource>(resourceType: string, params: string = '_count=50'): Promise<T[]> {
  const MAX_RETRIES = 3;
  const INITIAL_BACKOFF = 500; // ms

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await fetch(`${BASE_URL}/${resourceType}?${params}`);
      
      if (!response.ok) {
        if (response.status >= 400 && response.status < 500) {
            console.error(`Client error fetching ${resourceType}: ${response.status} ${response.statusText}. Not retrying.`);
            throw new Error(`Failed to fetch ${resourceType}: ${response.status} ${response.statusText}`);
        }
        throw new Error(`Server error fetching ${resourceType}: ${response.status} ${response.statusText}`);
      }

      const data: Bundle<T> = await response.json();
      return data?.entry?.map(e => e.resource).filter(Boolean) || [];
    } catch (error) {
      console.warn(`Attempt ${attempt} to fetch ${resourceType} failed.`, error);
      if (attempt === MAX_RETRIES) {
        console.error(`All ${MAX_RETRIES} attempts to fetch ${resourceType} failed.`);
        throw error;
      }
      
      const delayTime = INITIAL_BACKOFF * Math.pow(2, attempt - 1);
      await delay(delayTime);
    }
  }

  throw new Error(`Failed to fetch ${resourceType} after all retries.`);
}


export const getPatientsByIds = (ids: string[]) => {
    if (ids.length === 0) {
        return Promise.resolve([]);
    }
    const params = `_id=${ids.join(',')}&_count=${ids.length}`;
    return fetchFhirResource<Patient>('Patient', params);
};

const getDateRangeParams = (start: string, end: string) => {
    const [startYear, startMonth] = start.split('-').map(Number);
    const [endYear, endMonth] = end.split('-').map(Number);

    const startDate = `${startYear}-${String(startMonth).padStart(2, '0')}-01`;
    const lastDayOfMonth = new Date(endYear, endMonth, 0).getDate();
    const endDate = `${endYear}-${String(endMonth).padStart(2, '0')}-${String(lastDayOfMonth).padStart(2, '0')}`;
    
    return `ge${startDate}&date=le${endDate}`;
}

export const getObservations = (start: string, end: string) => fetchFhirResource<Observation>('Observation', `_count=200&_sort=-date&date=${getDateRangeParams(start, end)}`);
export const getConditions = (start: string, end: string) => {
    const [startYear, startMonth] = start.split('-').map(Number);
    const startDate = `${startYear}-${String(startMonth).padStart(2, '0')}-01`;
    // Condition uses recorded-date which doesn't support ranges in the same way. We will filter from the start of the range.
    // A more complex setup might be needed for true range filtering on this resource.
    return fetchFhirResource<Condition>('Condition', `_count=200&recorded-date=ge${startDate}`);
};
export const getEncounters = (start: string, end: string) => fetchFhirResource<Encounter>('Encounter', `_count=100&_sort=-date&date=${getDateRangeParams(start, end)}`);

// Fetch a representative sample of overall data for the main dashboard
export const getOverallData = async () => {
    const patients = await fetchFhirResource<Patient>('Patient', '_count=200&_sort=-_lastUpdated');
    const patientIds = patients.map(p => p.id);

    if (patientIds.length === 0) {
        return { patients: [], observations: [], conditions: [], encounters: [] };
    }

    const patientIdParam = `subject=${patientIds.map(id => `Patient/${id}`).join(',')}`;

    const [observations, conditions, encounters] = await Promise.all([
        fetchFhirResource<Observation>('Observation', `_count=500&${patientIdParam}&_sort=-date`),
        fetchFhirResource<Condition>('Condition', `_count=500&${patientIdParam}`),
        fetchFhirResource<Encounter>('Encounter', `_count=500&${patientIdParam}&_sort=-date`),
    ]);

    return { patients, observations, conditions, encounters };
};


export interface ProcessedData {
  patients: Patient[];
  observations: Observation[];
  conditions: Condition[];
  encounters: Encounter[];
  patientMap: Map<string, Patient>;
  observationMap: Map<string, Observation[]>;
  conditionMap: Map<string, Condition[]>;
  encounterMap: Map<string, Encounter[]>;
}
