interface HistoryEntry {
  id: string;
  content: string;
  timestamp: number;
  errors: any[];
  readability: number;
}

const HISTORY_KEY = 'orthoflow_history';
const MAX_HISTORY_ENTRIES = 10;

export function saveToHistory(content: string, errors: any[], readability: number) {
  const history = getHistory();
  const newEntry: HistoryEntry = {
    id: Date.now().toString(),
    content,
    timestamp: Date.now(),
    errors,
    readability,
  };

  history.unshift(newEntry);
  if (history.length > MAX_HISTORY_ENTRIES) {
    history.pop();
  }

  localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
}

export function getHistory(): HistoryEntry[] {
  if (typeof window === 'undefined') return [];
  
  const history = localStorage.getItem(HISTORY_KEY);
  return history ? JSON.parse(history) : [];
}

export function clearHistory() {
  localStorage.removeItem(HISTORY_KEY);
}

export function getHistoryEntry(id: string): HistoryEntry | null {
  const history = getHistory();
  return history.find(entry => entry.id === id) || null;
} 