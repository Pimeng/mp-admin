const MODE_STORAGE_KEY = 'mp-admin-last-mode';

export type AppMode = 'player' | 'admin';

export function getLastMode(): AppMode | null {
  const value = localStorage.getItem(MODE_STORAGE_KEY);
  return value === 'player' || value === 'admin' ? value : null;
}

export function setLastMode(mode: AppMode) {
  localStorage.setItem(MODE_STORAGE_KEY, mode);
}
