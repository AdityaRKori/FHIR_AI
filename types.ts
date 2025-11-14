
export interface Resource {
  resourceType: string;
  id: string;
}

export interface Patient extends Resource {
  resourceType: 'Patient';
  name?: [{
    family?: string;
    given?: string[];
    text?: string;
  }];
  gender?: 'male' | 'female' | 'other' | 'unknown';
  birthDate?: string;
  address?: [{
    city?: string;
    country?: string;
  }];
}

export interface Observation extends Resource {
  resourceType: 'Observation';
  status: string;
  code: {
    text?: string;
    coding?: {
      system?: string;
      code?: string;
      display?: string;
    }[];
  };
  subject: {
    reference: string;
  };
  effectiveDateTime?: string;
  valueQuantity?: {
    value: number;
    unit: string;
    system?: string;
    code?: string;
  };
  component?: {
    code: {
      text?: string;
      coding?: {
        system?: string;
        code?: string;
        display?: string;
      }[];
    };
    valueQuantity?: {
      value: number;
      unit: string;
    };
  }[];
}

export interface Condition extends Resource {
  resourceType: 'Condition';
  clinicalStatus: {
    coding?: {
        system: string;
        code: string;
        display: string;
    }[];
  };
  code: {
    text?: string;
    coding?: {
      display: string;
    }[];
  };
  subject: {
    reference: string;
  };
}

export interface Encounter extends Resource {
  resourceType: 'Encounter';
  status: string;
  class: {
    system?: string;
    code?: string;
    display?: string;
  };
  type?: {
    text?: string;
    coding?: {
        display: string;
    }[];
  }[];
  subject: {
    reference: string;
  };
  period?: {
    start?: string;
    end?: string;
  };
}

export interface Bundle<T extends Resource> {
  resourceType: 'Bundle';
  type: string;
  total: number;
  entry: {
    fullUrl: string;
    resource: T;
  }[];
}
