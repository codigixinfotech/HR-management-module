export interface IndustrySectorPreset {
  id: string;
  name: string;
  badge: string;
  description: string;
  categories: string[];
}

export const INDUSTRY_SECTOR_PRESETS: IndustrySectorPreset[] = [
  {
    id: 'IT',
    name: 'Information Technology (IT)',
    badge: 'Information Technology',
    description: 'Computers, servers, displays, network switches and mobile devices',
    categories: ['Laptop', 'Desktop', 'Monitor', 'Mobile', 'Server', 'Network Equipment'],
  },
  {
    id: 'MANUFACTURING',
    name: 'Manufacturing & Industrial',
    badge: 'Manufacturing & Industrial',
    description: 'Machinery, tooling, calibration gauges, safety gear and vehicles',
    categories: ['Machine', 'Tool', 'Equipment', 'Measuring Instrument', 'Safety Equipment', 'Vehicle'],
  },
  {
    id: 'HOSPITAL',
    name: 'Hospital & Healthcare',
    badge: 'Hospital & Healthcare',
    description: 'Clinical apparatus, patient monitors, wheelchairs, and medical furniture',
    categories: ['Medical Equipment', 'Patient Monitor', 'Wheelchair', 'Diagnostic Device', 'Lab Instrument', 'Safety Equipment'],
  },
  {
    id: 'BANKING',
    name: 'Banking & Financial Services',
    badge: 'Banking & Financial Services',
    description: 'Branch equipment, secure devices, access hardware and fleet',
    categories: ['Laptop', 'Security Device', 'Branch Equipment', 'Access Device', 'Vehicle'],
  },
  {
    id: 'RETAIL',
    name: 'Retail & Commercial',
    badge: 'Retail & Commercial',
    description: 'POS terminals, handheld scanners, store display units and fleet',
    categories: ['POS Terminal', 'Barcode Scanner', 'Store Equipment', 'Delivery Vehicle', 'Display Unit'],
  },
  {
    id: 'CORPORATE',
    name: 'Corporate & Multi-Sector',
    badge: 'Corporate & Multi-Sector',
    description: 'Universal corporate assets, office workstations and conference facilities',
    categories: ['Office Workstation', 'Laptop', 'Office Furniture', 'Meeting Room AV', 'Facility Equipment'],
  },
];

export interface CompanyCategoryConfig {
  sector: string;
  sectorName: string;
  categories: string[];
  deactivatedCategories?: string[];
}

export function getCompanyCategoryConfig(companyId?: string, companyEntityType?: string): CompanyCategoryConfig {
  if (!companyId) {
    return {
      sector: 'MANUFACTURING',
      sectorName: 'Manufacturing & Industrial',
      categories: [...INDUSTRY_SECTOR_PRESETS[1].categories],
      deactivatedCategories: [],
    };
  }

  const storageKey = `ehcm_asset_categories_${companyId}`;
  try {
    const raw = localStorage.getItem(storageKey);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.categories && Array.isArray(parsed.categories) && parsed.categories.length > 0) {
        const matchingPreset = INDUSTRY_SECTOR_PRESETS.find((p) => p.id === parsed.sector);
        return {
          sector: parsed.sector || 'CUSTOM',
          sectorName: matchingPreset?.name || parsed.sectorName || (parsed.sector === 'CUSTOM' ? 'Custom Sector' : parsed.sector),
          categories: parsed.categories,
          deactivatedCategories: parsed.deactivatedCategories || [],
        };
      }
    }
  } catch (e) {
    console.error('Error reading company category config', e);
  }

  // Infer default from company name / entityType
  const typeStr = (companyEntityType || '').toLowerCase();
  let defaultPreset = INDUSTRY_SECTOR_PRESETS[1]; // Manufacturing & Industrial default
  if (typeStr.includes('it') || typeStr.includes('tech') || typeStr.includes('software')) {
    defaultPreset = INDUSTRY_SECTOR_PRESETS[0];
  } else if (typeStr.includes('health') || typeStr.includes('hosp') || typeStr.includes('medic')) {
    defaultPreset = INDUSTRY_SECTOR_PRESETS[2];
  } else if (typeStr.includes('bank') || typeStr.includes('financ')) {
    defaultPreset = INDUSTRY_SECTOR_PRESETS[3];
  } else if (typeStr.includes('retail')) {
    defaultPreset = INDUSTRY_SECTOR_PRESETS[4];
  }

  return {
    sector: defaultPreset.id,
    sectorName: defaultPreset.name,
    categories: [...defaultPreset.categories],
    deactivatedCategories: [],
  };
}

export function saveCompanyCategoryConfig(companyId: string, config: CompanyCategoryConfig) {
  const storageKey = `ehcm_asset_categories_${companyId}`;
  localStorage.setItem(storageKey, JSON.stringify(config));
  window.dispatchEvent(new CustomEvent('ehcm_asset_category_updated', { detail: { companyId, config } }));
}
