// Dashboard Types - Prepared for Backend Integration

export type ServiceStatus = 'online' | 'warning' | 'error' | 'offline';

export interface ServiceHealth {
  id: string;
  name: string;
  status: ServiceStatus;
  uptime: number; // percentage
  lastCheck: Date;
  latency?: number; // ms
}

export interface LatencyDataPoint {
  timestamp: Date;
  value: number;
  status: 'healthy' | 'warning' | 'critical';
}

export interface ErrorZone {
  id: string;
  name: string;
  category: 'authentication' | 'api' | 'database' | 'integration' | 'general';
  errorCount: number;
  trend: number; // percentage change
  severity: 'low' | 'medium' | 'high' | 'critical';
  lastOccurrence: Date;
}

export interface LogEntry {
  id: string;
  timestamp: Date;
  type: 'info' | 'warning' | 'error' | 'success' | 'debug';
  message: string;
  source?: string;
  userId?: string;
}

export interface ActiveUsersData {
  current: number;
  peak: number;
  peakTime: Date;
  trend: number; // percentage change from last hour
  history: { timestamp: Date; count: number }[];
}

export interface QueueMetrics {
  name: string;
  pending: number;
  processed: number;
  failed: number;
  processingRate: number; // per minute
  avgProcessingTime: number; // ms
}

export interface RevenueMetrics {
  mrr: number;
  mrrTrend: number; // percentage
  conversionsToday: number;
  conversionsWeek: number;
  conversionRate: number;
  history: { date: Date; revenue: number }[];
}

export interface SystemMetrics {
  cpu: number; // percentage
  memory: number; // percentage
  connections: number;
  requestsPerSecond: number;
  avgResponseTime: number; // ms
}

export interface DashboardData {
  services: ServiceHealth[];
  latency: LatencyDataPoint[];
  errors: ErrorZone[];
  logs: LogEntry[];
  activeUsers: ActiveUsersData;
  queues: QueueMetrics[];
  revenue: RevenueMetrics;
  system: SystemMetrics;
}
