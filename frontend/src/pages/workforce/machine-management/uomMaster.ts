import { capacityUomApi, type CapacityUomItem } from '@/api/machine-management';

export type { CapacityUomItem };

// Clean local storage if any old dummy data was cached
try {
  localStorage.removeItem('fhcm_capacity_uom_master');
} catch {}

export const UOM_CATEGORY_OPTIONS = [
  'Healthcare & Clinical',
  'Manufacturing & Industrial',
  'Facilities & Services',
  'Custom',
  'General',
] as const;

export { capacityUomApi };
