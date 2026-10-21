// src/lib/uxVersion.ts

export type UxVersion = 'stable' | 'v2';

export function getInitialUxVersion(): UxVersion {
  if (typeof window === 'undefined') return 'stable';
  try {
    const stored = localStorage.getItem('apex_ux_version');
    if (stored === 'v2' || stored === 'stable') {
      return stored;
    }
  } catch {
    // Fallback default
  }
  return 'stable';
}

export function setUxVersion(version: UxVersion): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem('apex_ux_version', version);
    window.dispatchEvent(new CustomEvent('apex_ux_version_change', { detail: { version } }));
  } catch (e) {
    console.error('Failed to update UX version:', e);
  }
}
