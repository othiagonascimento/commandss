const KEY = 'finops:ackAnomalies:v1';

export const getAcknowledged = (): Record<string, string> => {
  try {
    return JSON.parse(localStorage.getItem(KEY) || '{}');
  } catch {
    return {};
  }
};

export const acknowledge = (id: string) => {
  const m = getAcknowledged();
  m[id] = new Date().toISOString();
  localStorage.setItem(KEY, JSON.stringify(m));
};

export const unacknowledge = (id: string) => {
  const m = getAcknowledged();
  delete m[id];
  localStorage.setItem(KEY, JSON.stringify(m));
};

export const isAcknowledged = (id: string) => !!getAcknowledged()[id];
