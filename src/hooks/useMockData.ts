import { useState, useEffect, useCallback } from 'react';
import type {
  DashboardData,
  ServiceHealth,
  LatencyDataPoint,
  ErrorZone,
  LogEntry,
  ActiveUsersData,
  QueueMetrics,
  RevenueMetrics,
  SystemMetrics,
  ServiceStatus,
} from '@/types/dashboard';

// Mock data generators
const generateLatency = (): number => {
  const base = 45;
  const variance = Math.random() * 60;
  const spike = Math.random() > 0.95 ? Math.random() * 200 : 0;
  return Math.round(base + variance + spike);
};

const getLatencyStatus = (latency: number): 'healthy' | 'warning' | 'critical' => {
  if (latency < 80) return 'healthy';
  if (latency < 150) return 'warning';
  return 'critical';
};

const generateServiceStatus = (): ServiceStatus => {
  const rand = Math.random();
  if (rand > 0.95) return 'error';
  if (rand > 0.85) return 'warning';
  if (rand > 0.02) return 'online';
  return 'offline';
};

const logMessages = [
  { type: 'info' as const, message: 'User #{userId} connected', source: 'auth' },
  { type: 'info' as const, message: 'API request completed in {ms}ms', source: 'api' },
  { type: 'success' as const, message: 'Payment processed for Order #{orderId}', source: 'billing' },
  { type: 'warning' as const, message: 'High memory usage detected: {percent}%', source: 'system' },
  { type: 'error' as const, message: 'Failed to connect to WhatsApp API', source: 'integration' },
  { type: 'info' as const, message: 'New message queued for delivery', source: 'queue' },
  { type: 'success' as const, message: 'Backup completed successfully', source: 'database' },
  { type: 'debug' as const, message: 'Cache invalidated for key: user_{userId}', source: 'cache' },
  { type: 'warning' as const, message: 'Rate limit approaching for client {clientId}', source: 'api' },
  { type: 'info' as const, message: 'Webhook delivered to {endpoint}', source: 'webhooks' },
];

const generateLogEntry = (): LogEntry => {
  const template = logMessages[Math.floor(Math.random() * logMessages.length)];
  const message = template.message
    .replace('{userId}', String(Math.floor(Math.random() * 9999) + 1000))
    .replace('{ms}', String(Math.floor(Math.random() * 200) + 10))
    .replace('{orderId}', String(Math.floor(Math.random() * 99999) + 10000))
    .replace('{percent}', String(Math.floor(Math.random() * 30) + 70))
    .replace('{clientId}', `CLI-${Math.floor(Math.random() * 999) + 100}`)
    .replace('{endpoint}', `https://api.client${Math.floor(Math.random() * 99)}.com/webhook`);

  return {
    id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    timestamp: new Date(),
    type: template.type,
    message,
    source: template.source,
  };
};

const initialServices: ServiceHealth[] = [
  { id: 'database', name: 'Database', status: 'online', uptime: 99.98, lastCheck: new Date(), latency: 12 },
  { id: 'api-whatsapp', name: 'WhatsApp API', status: 'online', uptime: 99.85, lastCheck: new Date(), latency: 89 },
  { id: 'message-queue', name: 'Message Queue', status: 'online', uptime: 99.99, lastCheck: new Date(), latency: 5 },
  { id: 'integrations', name: 'Integrations', status: 'online', uptime: 99.72, lastCheck: new Date(), latency: 156 },
  { id: 'storage', name: 'Storage', status: 'online', uptime: 100, lastCheck: new Date(), latency: 23 },
  { id: 'ai-engine', name: 'AI Engine', status: 'online', uptime: 99.91, lastCheck: new Date(), latency: 234 },
];

const initialErrors: ErrorZone[] = [
  { id: 'auth-errors', name: 'Authentication', category: 'authentication', errorCount: 23, trend: 15, severity: 'medium', lastOccurrence: new Date() },
  { id: 'api-timeouts', name: 'API Timeouts', category: 'api', errorCount: 8, trend: -5, severity: 'low', lastOccurrence: new Date() },
  { id: 'db-connections', name: 'DB Connections', category: 'database', errorCount: 2, trend: -50, severity: 'low', lastOccurrence: new Date() },
  { id: 'webhook-failures', name: 'Webhook Failures', category: 'integration', errorCount: 45, trend: 32, severity: 'high', lastOccurrence: new Date() },
];

const initialQueues: QueueMetrics[] = [
  { name: 'Messages', pending: 1247, processed: 45892, failed: 23, processingRate: 342, avgProcessingTime: 45 },
  { name: 'Emails', pending: 89, processed: 12453, failed: 5, processingRate: 128, avgProcessingTime: 120 },
  { name: 'Webhooks', pending: 234, processed: 8934, failed: 89, processingRate: 95, avgProcessingTime: 210 },
];

export function useMockData() {
  const [data, setData] = useState<DashboardData>(() => ({
    services: initialServices,
    latency: Array.from({ length: 30 }, (_, i) => {
      const value = generateLatency();
      return {
        timestamp: new Date(Date.now() - (29 - i) * 2000),
        value,
        status: getLatencyStatus(value),
      };
    }),
    errors: initialErrors,
    logs: Array.from({ length: 20 }, () => generateLogEntry()),
    activeUsers: {
      current: 2847,
      peak: 4231,
      peakTime: new Date(Date.now() - 3600000 * 4),
      trend: 12.5,
      history: Array.from({ length: 24 }, (_, i) => ({
        timestamp: new Date(Date.now() - (23 - i) * 3600000),
        count: Math.floor(Math.random() * 2000) + 1500,
      })),
    },
    queues: initialQueues,
    revenue: {
      mrr: 127849.00,
      mrrTrend: 8.4,
      conversionsToday: 47,
      conversionsWeek: 312,
      conversionRate: 3.2,
      history: Array.from({ length: 30 }, (_, i) => ({
        date: new Date(Date.now() - (29 - i) * 86400000),
        revenue: Math.floor(Math.random() * 5000) + 3500,
      })),
    },
    system: {
      cpu: 42,
      memory: 67,
      connections: 1893,
      requestsPerSecond: 2341,
      avgResponseTime: 47,
    },
  }));

  const updateData = useCallback(() => {
    setData(prev => {
      const newLatency = generateLatency();
      const newLatencyPoint: LatencyDataPoint = {
        timestamp: new Date(),
        value: newLatency,
        status: getLatencyStatus(newLatency),
      };

      // Update services occasionally
      const updatedServices = prev.services.map(service => ({
        ...service,
        status: Math.random() > 0.1 ? service.status : generateServiceStatus(),
        lastCheck: new Date(),
        latency: service.latency ? service.latency + Math.floor(Math.random() * 20 - 10) : undefined,
      }));

      // Update errors occasionally
      const updatedErrors = prev.errors.map(error => ({
        ...error,
        errorCount: Math.max(0, error.errorCount + Math.floor(Math.random() * 6 - 2)),
        trend: Math.floor(Math.random() * 40 - 15),
        lastOccurrence: Math.random() > 0.7 ? new Date() : error.lastOccurrence,
      }));

      // Add new log entry
      const newLogs = [generateLogEntry(), ...prev.logs.slice(0, 49)];

      // Update active users
      const userChange = Math.floor(Math.random() * 100 - 40);
      const newCurrentUsers = Math.max(500, prev.activeUsers.current + userChange);

      // Update queues
      const updatedQueues = prev.queues.map(queue => ({
        ...queue,
        pending: Math.max(0, queue.pending + Math.floor(Math.random() * 100 - 45)),
        processed: queue.processed + Math.floor(Math.random() * 50),
        failed: queue.failed + (Math.random() > 0.9 ? 1 : 0),
        processingRate: Math.max(10, queue.processingRate + Math.floor(Math.random() * 20 - 10)),
      }));

      // Update system metrics
      const updatedSystem = {
        cpu: Math.min(100, Math.max(10, prev.system.cpu + Math.floor(Math.random() * 10 - 5))),
        memory: Math.min(100, Math.max(20, prev.system.memory + Math.floor(Math.random() * 6 - 3))),
        connections: Math.max(100, prev.system.connections + Math.floor(Math.random() * 100 - 50)),
        requestsPerSecond: Math.max(100, prev.system.requestsPerSecond + Math.floor(Math.random() * 200 - 100)),
        avgResponseTime: Math.max(10, prev.system.avgResponseTime + Math.floor(Math.random() * 10 - 5)),
      };

      return {
        ...prev,
        services: updatedServices,
        latency: [...prev.latency.slice(1), newLatencyPoint],
        errors: updatedErrors,
        logs: newLogs,
        activeUsers: {
          ...prev.activeUsers,
          current: newCurrentUsers,
          peak: Math.max(prev.activeUsers.peak, newCurrentUsers),
          peakTime: newCurrentUsers > prev.activeUsers.peak ? new Date() : prev.activeUsers.peakTime,
        },
        queues: updatedQueues,
        system: updatedSystem,
      };
    });
  }, []);

  useEffect(() => {
    const interval = setInterval(updateData, 2000);
    return () => clearInterval(interval);
  }, [updateData]);

  return data;
}
