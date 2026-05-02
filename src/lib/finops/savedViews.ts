const KEY = 'finops:savedViews:v1';

export interface SavedView {
  id: string;
  name: string;
  page: string;
  query: string; // serialized URLSearchParams
  created_at: string;
}

export const listSavedViews = (page?: string): SavedView[] => {
  try {
    const raw = localStorage.getItem(KEY);
    const arr: SavedView[] = raw ? JSON.parse(raw) : [];
    return page ? arr.filter((v) => v.page === page) : arr;
  } catch {
    return [];
  }
};

export const saveView = (v: Omit<SavedView, 'id' | 'created_at'>): SavedView => {
  const arr = listSavedViews();
  const item: SavedView = {
    ...v,
    id: crypto.randomUUID(),
    created_at: new Date().toISOString(),
  };
  arr.unshift(item);
  localStorage.setItem(KEY, JSON.stringify(arr.slice(0, 50)));
  return item;
};

export const removeView = (id: string) => {
  const arr = listSavedViews().filter((v) => v.id !== id);
  localStorage.setItem(KEY, JSON.stringify(arr));
};
