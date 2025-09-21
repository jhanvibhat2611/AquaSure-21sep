// utils/data.ts
export interface Project {
  id: string;
  name: string;
  description: string;
  district: string;
  city: string;
  createdAt: string;
  policyMakerThresholds: {
    HMPI: number;
  };
}

export interface Sample {
  id: string;
  projectId: string;
  sampleId: string;
  metal: string;
  Si: number; // mg/L
  Ii: number;
  Mi: number;
  latitude: number;
  longitude: number;
  district: string;
  city: string;
  date: string;
}

export interface Alert {
  id: string;
  projectId: string;
  sampleId: string;
  message: string;
  severity: 'low' | 'medium' | 'high';
  acknowledged: boolean;
  createdAt: string;
}

export interface Policy {
  id: string;
  name: string;
  metal: string;
  threshold: number;
  createdBy: string;
  createdAt: string;
}

export const projects: Project[] = [
  {
    id: "p1",
    name: "Ganga Water Quality Study - Varanasi",
    description: "Comprehensive study of heavy metal pollution levels in Ganga river water samples at various locations in Varanasi.",
    district: "Varanasi",
    city: "Varanasi",
    createdAt: "2025-01-10",
    policyMakerThresholds: {
      HMPI: 100,
    },
  },
  {
    id: "p2",
    name: "Yamuna Water Quality Study - Delhi",
    description: "Monitoring water quality and HMPI levels in Yamuna river across multiple sampling points in Delhi.",
    district: "New Delhi",
    city: "Delhi",
    createdAt: "2025-02-05",
    policyMakerThresholds: {
      HMPI: 80,
    },
  },
  {
    id: "p3",
    name: "Cauvery Water Quality Study - Karnataka",
    description: "Analysis of heavy metal contamination in Cauvery river samples near Karnataka industrial areas.",
    district: "Mysuru",
    city: "Karnataka",
    createdAt: "2025-03-02",
    policyMakerThresholds: {
      HMPI: 90,
    },
  },
  {
    id: "p4",
    name: "Narmada Water Quality Assessment - Gujarat",
    description: "Environmental assessment of Narmada river water quality focusing on industrial pollution impacts.",
    district: "Bharuch",
    city: "Gujarat",
    createdAt: "2025-01-25",
    policyMakerThresholds: {
      HMPI: 85,
    },
  },
  {
    id: "p5",
    name: "Godavari River Monitoring - Maharashtra",
    description: "Long-term monitoring project for Godavari river water quality and ecosystem health.",
    district: "Nashik",
    city: "Maharashtra",
    createdAt: "2025-02-15",
    policyMakerThresholds: {
      HMPI: 95,
    },
  },
];

export const samples: Sample[] = [
  {
    id: "s1",
    projectId: "p1",
    sampleId: "GNG-001",
    metal: "Lead",
    Si: 0.09,
    Ii: 0.3,
    Mi: 0.7,
    latitude: 25.3176,
    longitude: 82.9739,
    district: "Varanasi",
    city: "Varanasi",
    date: "2025-01-12",
  },
  {
    id: "s2",
    projectId: "p2",
    sampleId: "YMN-004",
    metal: "Arsenic",
    Si: 0.05,
    Ii: 0.2,
    Mi: 0.5,
    latitude: 28.7041,
    longitude: 77.1025,
    district: "New Delhi",
    city: "Delhi",
    date: "2025-02-07",
  },
  {
    id: "s3",
    projectId: "p3",
    sampleId: "CVR-007",
    metal: "Chromium",
    Si: 0.03,
    Ii: 0.1,
    Mi: 0.4,
    latitude: 12.2958,
    longitude: 76.6394,
    district: "Mysuru",
    city: "Karnataka",
    date: "2025-03-05",
  },
  {
    id: "s4",
    projectId: "p1",
    sampleId: "GNG-002",
    metal: "Mercury",
    Si: 0.012,
    Ii: 0.25,
    Mi: 0.6,
    latitude: 25.2677,
    longitude: 82.9890,
    district: "Varanasi",
    city: "Varanasi",
    date: "2025-01-15",
  },
  {
    id: "s5",
    projectId: "p2",
    sampleId: "YMN-005",
    metal: "Cadmium",
    Si: 0.008,
    Ii: 0.15,
    Mi: 0.45,
    latitude: 28.6519,
    longitude: 77.2315,
    district: "New Delhi",
    city: "Delhi",
    date: "2025-02-10",
  },
  {
    id: "s6",
    projectId: "p4",
    sampleId: "NRM-001",
    metal: "Lead",
    Si: 0.15,
    Ii: 0.4,
    Mi: 0.8,
    latitude: 21.7051,
    longitude: 72.9960,
    district: "Bharuch",
    city: "Gujarat",
    date: "2025-01-28",
  },
  {
    id: "s7",
    projectId: "p5",
    sampleId: "GDV-003",
    metal: "Arsenic",
    Si: 0.035,
    Ii: 0.18,
    Mi: 0.52,
    latitude: 19.9975,
    longitude: 73.7898,
    district: "Nashik",
    city: "Maharashtra",
    date: "2025-02-18",
  },
];

export const standards = {
  WHO: {
    Lead: 0.01,
    Arsenic: 0.01,
    Chromium: 0.05,
    Mercury: 0.006,
    Cadmium: 0.003,
  },
  BBI: {
    Lead: 0.05,
    Arsenic: 0.05,
    Chromium: 0.1,
    Mercury: 0.001,
    Cadmium: 0.005,
  },
};

export const alerts: Alert[] = [
  {
    id: "a1",
    projectId: "p1",
    sampleId: "GNG-001",
    message: "Lead levels (0.09 mg/L) exceeded WHO safe limits (0.01 mg/L) in Ganga water sample GNG-001.",
    severity: "high",
    acknowledged: false,
    createdAt: "2025-01-12T10:30:00Z",
  },
  {
    id: "a2",
    projectId: "p2",
    sampleId: "YMN-004",
    message: "Arsenic levels (0.05 mg/L) equal to BBI threshold in Yamuna water sample YMN-004.",
    severity: "medium",
    acknowledged: false,
    createdAt: "2025-02-07T14:15:00Z",
  },
  {
    id: "a3",
    projectId: "p1",
    sampleId: "GNG-002",
    message: "Mercury levels (0.012 mg/L) significantly exceeded WHO safe limits (0.006 mg/L) in sample GNG-002.",
    severity: "high",
    acknowledged: false,
    createdAt: "2025-01-15T09:45:00Z",
  },
  {
    id: "a4",
    projectId: "p4",
    sampleId: "NRM-001",
    message: "Lead contamination (0.15 mg/L) at critical levels in Narmada sample NRM-001.",
    severity: "high",
    acknowledged: false,
    createdAt: "2025-01-28T16:20:00Z",
  },
];

export const policies: Policy[] = [
  {
    id: "pol1",
    name: "Lead Contamination Policy",
    metal: "Lead",
    threshold: 0.02,
    createdBy: "Policy Maker",
    createdAt: "2025-01-01",
  },
  {
    id: "pol2",
    name: "Arsenic Safety Standard",
    metal: "Arsenic",
    threshold: 0.015,
    createdBy: "Policy Maker",
    createdAt: "2025-01-05",
  },
  {
    id: "pol3",
    name: "Mercury Control Regulation",
    metal: "Mercury",
    threshold: 0.008,
    createdBy: "Policy Maker",
    createdAt: "2025-01-10",
  },
];

// HMPI Calculation Function
export function calculateHMPI(sample: Sample): number {
  const { Si, Ii, Mi } = sample;
  const hmpi = (Si / Ii) * Mi * 100;
  return Math.round(hmpi * 100) / 100; // Round to 2 decimal places
}

// Risk Level Assessment
export function getRiskLevel(hmpi: number): { level: string; color: string } {
  if (hmpi >= 100) return { level: "Very High Risk", color: "#DC2626" };
  if (hmpi >= 50) return { level: "High Risk", color: "#EA580C" };
  if (hmpi >= 25) return { level: "Moderate Risk", color: "#D97706" };
  if (hmpi >= 10) return { level: "Low Risk", color: "#65A30D" };
  return { level: "Safe", color: "#059669" };
}

// Sample Excel Template
export const excelTemplate = {
  headers: [
    "SampleID",
    "ProjectID", 
    "District",
    "City",
    "Latitude",
    "Longitude",
    "Metal",
    "Si",
    "Ii",
    "Mi",
    "Date"
  ],
  sampleData: [
    ["GNG-008", "p1", "Varanasi", "Varanasi", "25.3176", "82.9739", "Lead", "0.09", "0.3", "0.7", "2025-01-20"],
    ["YMN-006", "p2", "New Delhi", "Delhi", "28.7041", "77.1025", "Arsenic", "0.05", "0.2", "0.5", "2025-02-12"],
  ]
};