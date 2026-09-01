import { useState } from 'react';
import { PfSubNav } from './PfSubNav';
import type { PfTabType } from './PfSubNav';
import { PfDashboardTab } from './PfDashboardTab';
import { PfEmployeesTab } from './PfEmployeesTab';
import { PfConfigurationTab } from './PfConfigurationTab';
import { PfCalculationTab } from './PfCalculationTab';
import { PfEcrTab } from './PfEcrTab';
import { PfChallanTab } from './PfChallanTab';
import { PfReconciliationTab } from './PfReconciliationTab';
import { PfReportsTab } from './PfReportsTab';

export interface PfModuleProps {
  companyId?: string;
  companies?: any[];
}

export function PfModule({ companyId, companies = [] }: PfModuleProps) {
  const [activeSubTab, setActiveSubTab] = useState<PfTabType>('dashboard');
  const [selectedPeriod, setSelectedPeriod] = useState<string>('2026-09');
  const [selectedCompany, setSelectedCompany] = useState<string>(companyId || 'all');

  return (
    <div className="space-y-6">
      {/* Top 8-Tab Sub Navigation Bar & Filters */}
      <PfSubNav
        activeSubTab={activeSubTab}
        onSubTabChange={setActiveSubTab}
        selectedPeriod={selectedPeriod}
        onPeriodChange={setSelectedPeriod}
        selectedCompany={selectedCompany}
        onCompanyChange={setSelectedCompany}
        companies={companies}
      />

      {/* Render Active Sub-Page Component */}
      {activeSubTab === 'dashboard' && (
        <PfDashboardTab
          selectedPeriod={selectedPeriod}
          selectedCompany={selectedCompany}
          onNavigateTab={setActiveSubTab}
        />
      )}

      {activeSubTab === 'employees' && <PfEmployeesTab selectedCompany={selectedCompany} />}

      {activeSubTab === 'configuration' && (
        <PfConfigurationTab
          selectedCompany={selectedCompany}
          onCompanyChange={setSelectedCompany}
          companies={companies}
        />
      )}

      {activeSubTab === 'calculation' && (
        <PfCalculationTab
          selectedPeriod={selectedPeriod}
          selectedCompany={selectedCompany}
          onNavigateTab={setActiveSubTab}
        />
      )}

      {activeSubTab === 'ecr' && (
        <PfEcrTab
          selectedPeriod={selectedPeriod}
          selectedCompany={selectedCompany}
          onNavigateTab={setActiveSubTab}
        />
      )}

      {activeSubTab === 'challan' && (
        <PfChallanTab selectedPeriod={selectedPeriod} onNavigateTab={setActiveSubTab} />
      )}

      {activeSubTab === 'reconciliation' && (
        <PfReconciliationTab selectedPeriod={selectedPeriod} onNavigateTab={setActiveSubTab} />
      )}

      {activeSubTab === 'reports' && <PfReportsTab selectedPeriod={selectedPeriod} />}
    </div>
  );
}

export default PfModule;
