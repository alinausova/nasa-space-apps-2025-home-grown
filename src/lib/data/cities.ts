import type { LngLat } from '../derive/geo';

export interface SampleCity {
  id: string;
  name: string;
  climate: string;
  center: LngLat;
}

export const SAMPLE_CITIES: readonly SampleCity[] = [
  { id: 'munich', name: 'Munich', climate: 'Temperate', center: [11.5623, 48.146] },
  { id: 'cairo', name: 'Cairo', climate: 'Hot and arid', center: [31.2357, 30.0444] },
  { id: 'belem', name: 'Belém', climate: 'Tropical', center: [-48.4566, -1.4218] },
  { id: 'reykjavik', name: 'Reykjavík', climate: 'Cold', center: [-21.8952, 64.1466] },
];
