// src/lib/uxVersion.ts

export type UxVersion = 'stable' | 'v2';

const MIGRATION_FLAG_KEY = 'apex_ux_v2_migrated_all';
const EXPLICIT_LEGACY_KEY = 'apex_user_explicit_legacy';

export function getInitialUxVersion(): UxVersion {
  if (typeof window === 'undefined') return 'v2';
  try {
    // Si el usuario eligió explícitamente ver la versión clásica v1 desde configuración
    if (localStorage.getItem(EXPLICIT_LEGACY_KEY) === 'true') {
      return 'stable';
    }

    // Migración automática de todos los usuarios a la nueva versión V2
    if (!localStorage.getItem(MIGRATION_FLAG_KEY)) {
      localStorage.setItem(MIGRATION_FLAG_KEY, 'true');
      localStorage.setItem('apex_ux_version', 'v2');
      return 'v2';
    }

    const stored = localStorage.getItem('apex_ux_version');
    if (stored === 'v2') {
      return 'v2';
    }
  } catch {
    // Fallback default
  }
  return 'v2';
}

export function setUxVersion(version: UxVersion): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem('apex_ux_version', version);
    if (version === 'stable') {
      localStorage.setItem(EXPLICIT_LEGACY_KEY, 'true');
    } else {
      localStorage.removeItem(EXPLICIT_LEGACY_KEY);
    }
    window.dispatchEvent(new CustomEvent('apex_ux_version_change', { detail: { version } }));
  } catch (e) {
    console.error('Failed to update UX version:', e);
  }
}

