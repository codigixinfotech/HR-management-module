import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { jobOpeningsApi } from '@/api/recruitment';

export interface RecruitmentConfig {
  assessmentEnabled: boolean;
  assessmentMode: 'ONLINE' | 'OFFLINE' | 'BOTH';
  industry: string;
  defaultAssessmentTemplateId: string;
  defaultAssessmentName: string;
  assessmentRequired: boolean;
  // Interview Configuration
  interviewMode: 'ONLINE' | 'OFFLINE' | 'BOTH';
  defaultInterviewLocation: string;
  defaultInterviewBuilding: string;
  defaultInterviewRoom: string;
}

/**
 * Maps industry type to the default interview mode.
 * Manufacturing / Healthcare -> OFFLINE
 * IT / Banking -> ONLINE
 * Retail / Corporate -> BOTH
 */
export function getIndustryDefaultInterviewMode(industry: string): 'ONLINE' | 'OFFLINE' | 'BOTH' {
  const lower = industry.toLowerCase();
  if (lower.includes('manufacturing') || lower.includes('industrial') || lower.includes('healthcare') || lower.includes('pharma')) {
    return 'OFFLINE';
  }
  if (lower.includes('it') || lower.includes('software') || lower.includes('banking') || lower.includes('financial')) {
    return 'ONLINE';
  }
  return 'BOTH';
}

const DEFAULT_CONFIG: RecruitmentConfig = {
  assessmentEnabled: true,
  assessmentMode: 'OFFLINE',
  industry: 'Manufacturing & Industrial',
  defaultAssessmentTemplateId: 'TST-MFG-01',
  defaultAssessmentName: 'Manufacturing Technical & Machine Practical Assessment',
  assessmentRequired: true,
  // Interview Configuration - Manufacturing defaults to Offline
  interviewMode: 'OFFLINE',
  defaultInterviewLocation: 'Pune Manufacturing Plant',
  defaultInterviewBuilding: 'Administration Block',
  defaultInterviewRoom: 'HR Interview Room 1',
};

const STORAGE_KEY = 'ehcm_recruitment_config';
const EVENT_NAME = 'ehcm:recruitment-config-changed';

function getStoredConfig(): RecruitmentConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        ...DEFAULT_CONFIG,
        ...parsed,
        assessmentEnabled: parsed.assessmentEnabled !== undefined ? Boolean(parsed.assessmentEnabled) : DEFAULT_CONFIG.assessmentEnabled,
        assessmentRequired: parsed.assessmentRequired !== undefined ? Boolean(parsed.assessmentRequired) : DEFAULT_CONFIG.assessmentRequired,
      };
    }
  } catch (err) {
    console.error('Failed to parse cached recruitment config:', err);
  }
  return DEFAULT_CONFIG;
}

export function useRecruitmentConfig() {
  const queryClient = useQueryClient();
  const [localConfig, setLocalConfig] = useState<RecruitmentConfig>(getStoredConfig);

  // Fetch live config from backend store
  const { data: dbConfig, isLoading } = useQuery({
    queryKey: ['portal-config'],
    queryFn: () => jobOpeningsApi.getPortalConfig(),
    staleTime: 1000 * 60 * 5, // 5 minutes cache
  });

  // Sync state when dbConfig returns or changes
  useEffect(() => {
    if (dbConfig) {
      const industry = dbConfig.industry || localConfig.industry || 'Manufacturing & Industrial';
      const merged: RecruitmentConfig = {
        assessmentEnabled:
          dbConfig.assessmentEnabled !== undefined
            ? Boolean(dbConfig.assessmentEnabled)
            : localConfig.assessmentEnabled,
        assessmentMode: (dbConfig.assessmentMode as any) || localConfig.assessmentMode || 'OFFLINE',
        industry,
        defaultAssessmentTemplateId:
          dbConfig.defaultAssessmentTemplateId || localConfig.defaultAssessmentTemplateId || 'TST-MFG-01',
        defaultAssessmentName:
          dbConfig.defaultAssessmentName ||
          localConfig.defaultAssessmentName ||
          'Manufacturing Technical & Machine Practical Assessment',
        assessmentRequired:
          dbConfig.assessmentRequired !== undefined
            ? Boolean(dbConfig.assessmentRequired)
            : localConfig.assessmentRequired,
        // Interview Configuration
        interviewMode: (dbConfig.interviewMode as any) || localConfig.interviewMode || getIndustryDefaultInterviewMode(industry),
        defaultInterviewLocation: dbConfig.defaultInterviewLocation || localConfig.defaultInterviewLocation || 'Company Premises',
        defaultInterviewBuilding: dbConfig.defaultInterviewBuilding || localConfig.defaultInterviewBuilding || '',
        defaultInterviewRoom: dbConfig.defaultInterviewRoom || localConfig.defaultInterviewRoom || 'HR Interview Room',
      };

      setLocalConfig(merged);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
      } catch (e) {
        console.error('Failed to persist recruitment config:', e);
      }
    }
  }, [dbConfig]);

  // Listen to cross-component / cross-tab broadcast events
  useEffect(() => {
    const handleBroadcast = (event: CustomEvent<RecruitmentConfig>) => {
      if (event.detail) {
        setLocalConfig(event.detail);
      }
    };

    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === STORAGE_KEY && event.newValue) {
        try {
          setLocalConfig(JSON.parse(event.newValue));
        } catch {
          // ignore
        }
      }
    };

    window.addEventListener(EVENT_NAME as any, handleBroadcast);
    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener(EVENT_NAME as any, handleBroadcast);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  // Mutation to update configuration
  const updateMutation = useMutation({
    mutationFn: async (patch: Partial<RecruitmentConfig>) => {
      const updated = { ...localConfig, ...patch };
      const res = await jobOpeningsApi.updatePortalConfig(updated);
      return res;
    },
    onSuccess: (updated) => {
      const merged = { ...localConfig, ...updated };
      setLocalConfig(merged);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
      } catch (e) {
        console.error('Failed to persist config:', e);
      }
      queryClient.setQueryData(['portal-config'], merged);
      queryClient.invalidateQueries({ queryKey: ['portal-config'] });
      window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: merged }));
    },
  });

  /**
   * Two-level Assessment Logic:
   * 1. Global Recruitment Configuration: Enable Assessment Stage = ON/OFF
   * 2. Job Requisition: Assessment Required = YES/NO
   *
   * IF global Assessment = OFF
   *    -> Assessment completely disabled
   *    -> Hide Assessment navigation
   *    -> Hide Send Assessment
   *    -> Block assessment route
   *    -> Candidate skips assessment
   *
   * IF global Assessment = ON
   *    AND requisition Assessment Required = YES
   *    -> Assessment functionality available
   *    -> Show Send Assessment
   *    -> Show assessment status
   *    -> Allow assessment workflow
   *
   * IF global Assessment = ON
   *    AND requisition Assessment Required = NO
   *    -> Do not show Send Assessment
   *    -> Candidate goes directly from Screening to Interview
   */
  const isCandidateAssessmentApplicable = useCallback(
    (candidate?: any, requisition?: any): boolean => {
      // 1. If Global Assessment is OFF -> strictly false (hide Send Assessment, block route)
      if (!localConfig.assessmentEnabled) {
        return false;
      }

      // 2. Check Candidate's linked Job Requisition
      const job = requisition || candidate?.jobOpening;

      if (job) {
        // Only if requisition explicitly opted out with Assessment Required = NO
        if (job.assessmentRequired === false || job.assessmentRequired === 'NO') {
          return false;
        }
      }

      if (candidate?.assessmentRequired === false || candidate?.assessmentRequired === 'NO') {
        return false;
      }

      // By default when global assessment is ON, assessment is enabled for all active candidates!
      return true;
    },
    [localConfig.assessmentEnabled]
  );

  return {
    config: localConfig,
    isAssessmentEnabled: localConfig.assessmentEnabled,
    assessmentMode: localConfig.assessmentMode,
    industry: localConfig.industry,
    defaultAssessmentTemplateId: localConfig.defaultAssessmentTemplateId,
    defaultAssessmentName: localConfig.defaultAssessmentName,
    assessmentRequired: localConfig.assessmentRequired,
    interviewMode: localConfig.interviewMode,
    defaultInterviewLocation: localConfig.defaultInterviewLocation,
    defaultInterviewBuilding: localConfig.defaultInterviewBuilding,
    defaultInterviewRoom: localConfig.defaultInterviewRoom,
    isCandidateAssessmentApplicable,
    updateConfig: updateMutation.mutate,
    updateConfigAsync: updateMutation.mutateAsync,
    isUpdating: updateMutation.isPending,
    isLoading,
  };
}
