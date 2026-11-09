import { i18n } from './locale.svelte';

/** A crop's name in the active language; falls back to the name the API sent. */
export function cropName(crop: { crop_id: string; crop_name: string }): string {
  return i18n.m.crops[crop.crop_id] ?? crop.crop_name;
}
