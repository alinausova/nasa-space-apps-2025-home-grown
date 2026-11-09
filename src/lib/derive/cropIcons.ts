import mapping from '../../assets/crop-icons/crop-icons.json';

// Crop name exactly as the API returns it → icon file (see assets/crop-icons/README.md).
const FILES = import.meta.glob('../../assets/crop-icons/*.svg', { eager: true, query: '?url', import: 'default' }) as Record<string, string>;
const BY_FILE: Record<string, string> = Object.fromEntries(Object.entries(FILES).map(([path, url]) => [path.split('/').pop()!, url]));
const MAP = mapping as Record<string, string>;

export const FALLBACK_ICON = 'sprout.svg';

/** File name of a crop's icon, or the sprout for a crop that has none yet. */
export function cropIconFile(cropName: string): string {
  const file = MAP[cropName];
  return file && BY_FILE[file] ? file : FALLBACK_ICON;
}

/** URL of a crop's icon. */
export function cropIcon(cropName: string): string {
  return BY_FILE[cropIconFile(cropName)];
}
