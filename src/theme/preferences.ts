// The inline script in index.html reads these same keys before first paint.
export const THEME_KEY = 'meridian-theme'
export const SEGMENT_KEY = 'meridian-segment'

// Storage can throw when it's blocked, such as in some private windows. The
// app still works then, but the choice isn't remembered.
export function readStored(key: string): string | null {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

export function writeStored(key: string, value: string): void {
  try {
    localStorage.setItem(key, value)
  } catch {
    // Nothing to do: the choice still applies until the page reloads.
  }
}
