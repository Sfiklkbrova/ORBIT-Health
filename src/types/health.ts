export type TabType = 'home' | 'health' | 'history' | 'profile';

export interface VitalMetric {
  id: string;
  name: string;
  value: string;
  unit: string;
  status: 'Optimal' | 'Normal' | 'Good' | 'Attention';
  iconName: string;
  accentColor: string;
  subtext: string;
  isSample: boolean;
  trend: 'up' | 'stable' | 'down';
  changeText: string;
}

export interface DailyActivityData {
  steps: number;
  goalSteps: number;
  calories: number;
  activeMinutes: number;
  distanceKm: number;
}

export interface HealthStatusData {
  vitalScore: number;
  statusText: string;
  missionDay: number;
  systemCheck: 'Pass' | 'Optimal' | 'Warning';
  activity: DailyActivityData;
}

export interface AiInsightData {
  title: string;
  timestamp: string;
  sampleBadge: string;
  summary: string;
  keyPoints: {
    label: string;
    value: string;
    status: 'optimal' | 'normal' | 'notice';
  }[];
  detailedAnalysis: string;
  recommendations: string[];
  nasaCitations?: {
    source: string;
    accession?: string;
    title: string;
    finding: string;
  }[];
  scientificDisclaimer?: string;
}

export interface HistoryItem {
  id: string;
  date: string;
  time: string;
  title: string;
  vitalScore: number;
  metrics: {
    hr: string;
    spo2: string;
    bp: string;
    temp: string;
  };
  notes: string;
}

