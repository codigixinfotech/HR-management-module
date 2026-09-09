import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  Building2,
  Check,
  Copy,
  Edit3,
  Eye,
  Filter,
  Globe,
  Info,
  Lock,
  Plus,
  Search,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Trash2,
  UserCheck,
  UserPlus,
  Users,
  CheckCircle2,
  Mail,
  Key,
} from 'lucide-react';
import { rolesApi, usersApi } from '@/api/administration';
import { departmentsApi } from '@/api/organization';
import { subscriptionsApi, ERP_25_MODULE_CATALOG } from '@/api/plansApi';
import type { AppUser, LoginAccessConfig, Permission, Role, RoleDataScope, RoleType } from '@/api/types';
import { useCompany } from '@/context/CompanyContext';
import { useAuthStore } from '@/stores/auth-store';
import { isSuperAdminUser } from '@/lib/modules';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

function generateTempPassword(): string {
  const upper = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const lower = 'abcdefghijkmnopqrstuvwxyz';
  const digits = '23456789';
  const special = '#@!$%&*';

  let pwd = '';
  pwd += upper[Math.floor(Math.random() * upper.length)];
  pwd += lower[Math.floor(Math.random() * lower.length)];
  pwd += digits[Math.floor(Math.random() * digits.length)];
  pwd += special[Math.floor(Math.random() * special.length)];

  const all = upper + lower + digits + special;
  for (let i = 0; i < 6; i++) {
    pwd += all[Math.floor(Math.random() * all.length)];
  }
  return pwd;
}

const SCOPE_OPTIONS: { value: RoleDataScope; label: string; description: string }[] = [
  { value: 'OWN', label: 'Own', description: "Access limited strictly to employee's own records" },
  { value: 'TEAM', label: 'Team', description: 'Access to direct & indirect reporting team members' },
  { value: 'DEPARTMENT', label: 'Department', description: 'Access to all records within assigned department' },
  { value: 'LOCATION', label: 'Location', description: 'Access to all records within assigned branch/location' },
  { value: 'PLANT', label: 'Plant', description: 'Access to manufacturing plant / factory unit records' },
  { value: 'COMPANY', label: 'Company', description: 'Full company-wide data access across all branches' },
];

const DEFAULT_LOGIN_ACCESS: LoginAccessConfig = {
  web: true,
  mobile: true,
  ess: true,
  admin: false,
  reports: true,
};

const MATRIX_ACTIONS: { key: 'view' | 'create' | 'edit' | 'delete' | 'approve' | 'reject' | 'assign' | 'import' | 'export' | 'manage'; label: string }[] = [
  { key: 'view', label: 'VIEW' },
  { key: 'create', label: 'CREATE' },
  { key: 'edit', label: 'EDIT' },
  { key: 'delete', label: 'DELETE' },
  { key: 'approve', label: 'APPROVE' },
  { key: 'reject', label: 'REJECT' },
  { key: 'assign', label: 'ASSIGN' },
  { key: 'import', label: 'IMPORT' },
  { key: 'export', label: 'EXPORT' },
  { key: 'manage', label: 'MANAGE' },
];

const MODULE_KEY_ALIAS_MAP: Record<string, string> = {
  'employee-management': 'employee-management',
  employees: 'employee-management',
  organization: 'organization',
  onboarding: 'onboarding',
  recruitment: 'recruitment',
  workforce: 'workforce-planning',
  'workforce-planning': 'workforce-planning',
  'shift-planning': 'shift-planning',
  'machine-allocation': 'machine-allocation',
  'contractor-management': 'contractor-management',
  'attendance-leave': 'attendance-leave',
  payroll: 'payroll',
  payslips: 'payslips',
  'salary-revision': 'salary-revision',
  'loans-advances': 'loans-advances',
  reimbursements: 'reimbursements',
  'pf-esic': 'pf-esic',
  'statutory-taxes': 'statutory-taxes',
  'labour-compliance': 'labour-compliance',
  compliance: 'statutory-taxes',
  performance: 'performance',
  learning: 'learning',
  lms: 'learning',
  'compensation-benefits': 'salary-revision',
  'employee-experience': 'employee-experience',
  'asset-management': 'asset-management',
  'travel-expense': 'travel-expense',
  'safety-ehs': 'safety-ehs',
  ehs: 'safety-ehs',
  'ai-intelligence': 'ai-intelligence',
  'iot-devices': 'integrations-iot',
  'integrations-iot': 'integrations-iot',
  'reports-analytics': 'employee-management',
  'workflow-automation': 'organization',
  administration: 'organization',
  dashboard: 'employee-management',
};

export function RolesTab() {
  const queryClient = useQueryClient();
  const { activeCompany, activeCompanyId } = useCompany();
  const currentUser = useAuthStore((s) => s.user);
  const isSuperAdmin = isSuperAdminUser(currentUser);

  // Filters & Tabs
  const [activeCategory, setActiveCategory] = useState<'ALL' | 'SYSTEM' | 'TEMPLATE' | 'CUSTOM'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Role Add/Edit/View Modal
  const [openModal, setOpenModal] = useState(false);
  const [modalMode, setModalMode] = useState<'view' | 'edit'>('view');
  const [editingRole, setEditingRole] = useState<Role | null>(null);

  // Form State
  const [roleName, setRoleName] = useState('');
  const [roleType, setRoleType] = useState<RoleType>('CUSTOM_ROLE');
  const [description, setDescription] = useState('');
  const [dataScope, setDataScope] = useState<RoleDataScope>('DEPARTMENT');
  const [loginAccess, setLoginAccess] = useState<LoginAccessConfig>(DEFAULT_LOGIN_ACCESS);
  const [selectedPermissionIds, setSelectedPermissionIds] = useState<string[]>([]);

  // Assign Users Modal
  const [openUsersModal, setOpenUsersModal] = useState(false);
  const [assigningRole, setAssigningRole] = useState<Role | null>(null);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [userSearchQuery, setUserSearchQuery] = useState('');

  // Create User for Role Modal State
  const [openAddUserModal, setOpenAddUserModal] = useState(false);
  const [addUserRole, setAddUserRole] = useState<Role | null>(null);
  const [newEmployeeName, setNewEmployeeName] = useState('');
  const [newUsername, setNewUsername] = useState('');
  const [newMobile, setNewMobile] = useState('');
  const [newDepartmentId, setNewDepartmentId] = useState('');
  const [newTempPassword, setNewTempPassword] = useState('');
  const [sendEmailChecked, setSendEmailChecked] = useState(true);
  const [requireResetChecked, setRequireResetChecked] = useState(true);

  // Created Credentials Result Modal State
  const [openCredentialsModal, setOpenCredentialsModal] = useState(false);
  const [createdCredentials, setCreatedCredentials] = useState<{
    email: string;
    tempPassword: string;
    roleName: string;
    status: string;
  } | null>(null);

  // Queries
  const { data: roles = [], isLoading: isLoadingRoles } = useQuery({
    queryKey: ['roles', activeCompanyId],
    queryFn: () => rolesApi.list({ companyId: activeCompanyId }),
  });

  const { data: departmentsList = [] } = useQuery({
    queryKey: ['departments', activeCompanyId],
    queryFn: () => departmentsApi.list(activeCompanyId),
    enabled: !!activeCompanyId,
  });

  const { data: permissionsCatalog = [] } = useQuery({
    queryKey: ['permissions-catalog'],
    queryFn: rolesApi.permissionsCatalog,
  });

  const { data: subscriptionDetails } = useQuery({
    queryKey: ['company-subscription-modules', activeCompanyId],
    queryFn: () => subscriptionsApi.getCompanySubscription(activeCompanyId!),
    enabled: !!activeCompanyId,
  });

  const { data: usersData } = useQuery({
    queryKey: ['company-users', activeCompanyId],
    queryFn: () => usersApi.list({ companyId: activeCompanyId, pageSize: 100 }),
  });
  const allUsersList: AppUser[] = usersData?.items || [];

  // Full module entitlement map for the 25 ERP modules
  const moduleEntitlementMap = useMemo(() => {
    const map: Record<string, { key: string; name: string; category: string; isEnabled: boolean }> = {};

    const matrix = subscriptionDetails?.moduleEntitlementMatrix || [];
    const isCompanyActiveSubscriber = true; // Full entitlement for active company

    // Populate all 25 canonical modules
    const catalogList = ERP_25_MODULE_CATALOG.length > 0 ? ERP_25_MODULE_CATALOG : [];
    for (const item of catalogList) {
      const entitlementItem = matrix.find((m) => m.key === item.key);
      const isEnabled = entitlementItem ? entitlementItem.isEnabled : isCompanyActiveSubscriber;

      map[item.key] = {
        key: item.key,
        name: item.name,
        category: item.category,
        isEnabled: isEnabled || isCompanyActiveSubscriber, // Full 25/25 access for active company
      };
    }

    return map;
  }, [subscriptionDetails]);

  const subscribedModulesCount = useMemo(() => {
    return Object.values(moduleEntitlementMap).filter((m) => m.isEnabled).length;
  }, [moduleEntitlementMap]);

  // Lookup permission ID for a module key and action
  const getPermissionId = (moduleKey: string, actionKey: string): string | undefined => {
    const directMatch = permissionsCatalog.find(
      (p) => p.module === moduleKey && p.action.toLowerCase() === actionKey,
    );
    if (directMatch) return directMatch.id;

    // Try canonical mapped module key
    const mappedKey = MODULE_KEY_ALIAS_MAP[moduleKey];
    if (mappedKey) {
      const aliasMatch = permissionsCatalog.find(
        (p) => p.module === mappedKey && p.action.toLowerCase() === actionKey,
      );
      if (aliasMatch) return aliasMatch.id;
    }

    // Fallback: match by code pattern (e.g. employee_management.view or employees.view)
    const codeKey = moduleKey.replace(/-/g, '_');
    const codeMatch = permissionsCatalog.find(
      (p) => p.code.startsWith(codeKey) && p.action.toLowerCase() === actionKey,
    );
    return codeMatch?.id;
  };

  // Mutations
  const createMutation = useMutation({
    mutationFn: () =>
      rolesApi.create({
        name: roleName,
        type: roleType,
        description,
        companyId: activeCompanyId,
        dataScope,
        loginAccess,
        permissionIds: selectedPermissionIds,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      setActiveCategory('CUSTOM');
      toast.success('Role created successfully');
      handleCloseModal();
    },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? 'Failed to create role'),
  });

  const updateMutation = useMutation({
    mutationFn: () =>
      rolesApi.update(editingRole!.id, {
        name: roleName,
        type: roleType,
        description,
        dataScope,
        loginAccess,
        permissionIds: selectedPermissionIds,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      toast.success('Role updated successfully');
      handleCloseModal();
    },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? 'Failed to update role'),
  });

  const duplicateMutation = useMutation({
    mutationFn: (id: string) => rolesApi.duplicate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      toast.success('Role duplicated as a Custom Role');
    },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? 'Failed to duplicate role'),
  });

  const assignUsersMutation = useMutation({
    mutationFn: () => rolesApi.assignUsers(assigningRole!.id, selectedUserIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      toast.success('Assigned users updated successfully');
      setOpenUsersModal(false);
      setAssigningRole(null);
    },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? 'Failed to assign users'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => rolesApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      toast.success('Role deleted successfully');
    },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? 'Failed to delete role'),
  });

  const createUserForRoleMutation = useMutation({
    mutationFn: () =>
      usersApi.create({
        email: newUsername,
        password: newTempPassword,
        companyId: activeCompanyId,
        roleIds: addUserRole ? [addUserRole.id] : [],
        mustResetPassword: requireResetChecked,
        employeeName: newEmployeeName,
        phone: newMobile,
        departmentId: newDepartmentId,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      queryClient.invalidateQueries({ queryKey: ['company-users'] });
      setOpenAddUserModal(false);
      setCreatedCredentials({
        email: newUsername,
        tempPassword: newTempPassword,
        roleName: addUserRole?.name || 'HR_EXECUTIVE',
        status: 'Invitation Pending',
      });
      setOpenCredentialsModal(true);
      toast.success(`User created successfully! ${sendEmailChecked ? 'Login credentials sent to HR email.' : ''}`);
    },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? 'Failed to create user'),
  });

  // Modal Handlers
  const handleOpenAddUserForRole = (role: Role) => {
    setAddUserRole(role);
    setNewEmployeeName('');
    setNewUsername('');
    setNewMobile('');
    setNewDepartmentId(departmentsList[0]?.id || '');
    setNewTempPassword(generateTempPassword());
    setSendEmailChecked(true);
    setRequireResetChecked(true);
    setOpenAddUserModal(true);
  };

  const handleOpenAddModal = () => {
    setModalMode('edit');
    setEditingRole(null);
    setRoleName('');
    setRoleType('CUSTOM_ROLE');
    setDescription('');
    setDataScope('DEPARTMENT');
    setLoginAccess(DEFAULT_LOGIN_ACCESS);
    setSelectedPermissionIds([]);
    setOpenModal(true);
  };

  const handleOpenViewModal = (role: Role) => {
    setModalMode('view');
    setEditingRole(role);
    setRoleName(role.name);
    setRoleType(role.type || (role.isSystem ? 'SYSTEM_ROLE' : 'CUSTOM_ROLE'));
    setDescription(role.description || '');
    setDataScope(role.dataScope || 'DEPARTMENT');
    setLoginAccess(
      role.loginAccess || {
        web: true,
        mobile: true,
        ess: true,
        admin: role.name.includes('ADMIN'),
        reports: true,
      },
    );
    setSelectedPermissionIds(role.permissions.map((p) => p.permission.id));
    setOpenModal(true);
  };

  const handleOpenEditModal = (role: Role) => {
    setModalMode('edit');
    setEditingRole(role);
    setRoleName(role.name);
    setRoleType(role.type || (role.isSystem ? 'SYSTEM_ROLE' : 'CUSTOM_ROLE'));
    setDescription(role.description || '');
    setDataScope(role.dataScope || 'DEPARTMENT');
    setLoginAccess(
      role.loginAccess || {
        web: true,
        mobile: true,
        ess: true,
        admin: role.name.includes('ADMIN'),
        reports: true,
      },
    );
    setSelectedPermissionIds(role.permissions.map((p) => p.permission.id));
    setOpenModal(true);
  };

  const handleUseTemplate = (templateRole: Role) => {
    setModalMode('edit');
    setEditingRole(null);
    setRoleName(`${templateRole.name} (Custom)`);
    setRoleType('CUSTOM_ROLE');
    setDescription(`Customized from Industry Template: ${templateRole.description || templateRole.name}`);
    setDataScope(templateRole.dataScope || 'DEPARTMENT');
    setLoginAccess(templateRole.loginAccess || DEFAULT_LOGIN_ACCESS);
    setSelectedPermissionIds(templateRole.permissions.map((p) => p.permission.id));
    setOpenModal(true);
  };

  const handleOpenAssignUsersModal = (role: Role) => {
    setAssigningRole(role);
    const currentAssignedUserIds = (role.users || []).map((u) => u.user.id);
    setSelectedUserIds(currentAssignedUserIds);
    setUserSearchQuery('');
    setOpenUsersModal(true);
  };

  const handleCloseModal = () => {
    setOpenModal(false);
    setEditingRole(null);
  };

  const togglePermissionId = (id?: string) => {
    if (!id || modalMode === 'view') return;
    setSelectedPermissionIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  // Select all permissions for subscribed modules
  const handleSelectAllSubscribed = () => {
    const allPermIds: string[] = [];
    Object.values(moduleEntitlementMap).forEach((mod) => {
      if (mod.isEnabled) {
        MATRIX_ACTIONS.forEach((act) => {
          const permId = getPermissionId(mod.key, act.key);
          if (permId) allPermIds.push(permId);
        });
      }
    });
    setSelectedPermissionIds(Array.from(new Set(allPermIds)));
  };

  // Category Counts
  const counts = useMemo(() => {
    let system = 0;
    let template = 0;
    let custom = 0;
    for (const r of roles) {
      if (r.isSystem || r.type === 'SYSTEM_ROLE') system++;
      else if (r.type === 'INDUSTRY_TEMPLATE') template++;
      else custom++;
    }
    return { all: roles.length, system, template, custom };
  }, [roles]);

  // Filtered Roles List
  const filteredRoles = useMemo(() => {
    return roles.filter((role) => {
      if (activeCategory === 'SYSTEM' && !role.isSystem && role.type !== 'SYSTEM_ROLE') return false;
      if (activeCategory === 'TEMPLATE' && role.type !== 'INDUSTRY_TEMPLATE') return false;
      if (activeCategory === 'CUSTOM' && (role.isSystem || role.type === 'SYSTEM_ROLE' || role.type === 'INDUSTRY_TEMPLATE'))
        return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = role.name.toLowerCase().includes(q);
        const matchDesc = role.description?.toLowerCase().includes(q);
        return matchName || matchDesc;
      }
      return true;
    });
  }, [roles, activeCategory, searchQuery]);

  const filteredAssignUsersList = useMemo(() => {
    if (!userSearchQuery.trim()) return allUsersList;
    const q = userSearchQuery.toLowerCase();
    return allUsersList.filter((u) => {
      const emailMatch = u.email.toLowerCase().includes(q);
      const nameMatch = `${u.company?.name || ''}`.toLowerCase().includes(q);
      return emailMatch || nameMatch;
    });
  }, [allUsersList, userSearchQuery]);

  return (
    <div className="space-y-4">
      {/* Company Context Header Banner */}
      <div className="rounded-xl border bg-gradient-to-r from-background via-muted/20 to-primary/5 p-4 shadow-2xs">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Company Context</span>
                <Badge variant="outline" className="text-[10px] bg-emerald-50 text-emerald-700 border-emerald-300 font-semibold dark:bg-emerald-950 dark:text-emerald-300">
                  Active Subscriber
                </Badge>
              </div>
              <h2 className="text-base font-bold text-foreground">
                {activeCompany?.name || 'Codigix Infotech Pvt. Ltd.'}
              </h2>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="text-muted-foreground">Industry:</span>
              <span className="font-semibold text-foreground bg-muted px-2 py-0.5 rounded-md">
                {activeCompany?.entityType || 'Private Limited'}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-muted-foreground">Subscription:</span>
              <span className="font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-md">
                {subscriptionDetails?.plan?.name || 'Professional'} (25 / 25 Modules)
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Roles Card */}
      <Card className="border shadow-2xs">
        <CardHeader className="pb-3">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-lg font-bold tracking-tight text-foreground">
                Roles & Permissions
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground mt-0.5">
                Configure company-scoped custom roles, portal privileges, module entitlement matrix, and data boundaries.
              </CardDescription>
            </div>
            <Button size="sm" onClick={handleOpenAddModal} className="shrink-0 bg-primary font-medium text-primary-foreground shadow-xs">
              <Plus className="mr-1.5 h-4 w-4" /> Add Role
            </Button>
          </div>

          {/* Tabs & Search */}
          <div className="mt-4 flex flex-col gap-3 pt-2 sm:flex-row sm:items-center sm:justify-between border-t">
            <div className="flex flex-wrap items-center gap-1 rounded-lg bg-muted/60 p-1">
              <button
                type="button"
                onClick={() => setActiveCategory('ALL')}
                className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-all ${
                  activeCategory === 'ALL'
                    ? 'bg-background text-foreground shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                All Roles
                <Badge variant="secondary" className="px-1.5 py-0 text-[10px] font-bold">
                  {counts.all}
                </Badge>
              </button>

              <button
                type="button"
                onClick={() => setActiveCategory('SYSTEM')}
                className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-all ${
                  activeCategory === 'SYSTEM'
                    ? 'bg-background text-foreground shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                System Roles
                <Badge variant="secondary" className="px-1.5 py-0 text-[10px] font-bold">
                  {counts.system}
                </Badge>
              </button>

              <button
                type="button"
                onClick={() => setActiveCategory('TEMPLATE')}
                className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-all ${
                  activeCategory === 'TEMPLATE'
                    ? 'bg-background text-foreground shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Industry Templates
                <Badge variant="secondary" className="px-1.5 py-0 text-[10px] font-bold">
                  {counts.template}
                </Badge>
              </button>

              <button
                type="button"
                onClick={() => setActiveCategory('CUSTOM')}
                className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-all ${
                  activeCategory === 'CUSTOM'
                    ? 'bg-background text-foreground shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Custom Roles
                <Badge variant="secondary" className="px-1.5 py-0 text-[10px] font-bold">
                  {counts.custom}
                </Badge>
              </button>
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Search roles by name or description..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 text-xs h-8 bg-background"
              />
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {isLoadingRoles ? (
            <div className="py-12 text-center text-xs text-muted-foreground">Loading role configurations...</div>
          ) : filteredRoles.length === 0 ? (
            <div className="py-12 text-center space-y-2 border border-dashed rounded-lg">
              <ShieldAlert className="mx-auto h-8 w-8 text-muted-foreground/60" />
              <p className="text-sm font-medium text-foreground">No roles match your search or tab filter</p>
              <p className="text-xs text-muted-foreground">Adjust filter keywords or click Add Role to create a custom role.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredRoles.map((role) => {
                const isSystemRole = role.isSystem || role.type === 'SYSTEM_ROLE';
                const isIndustryTemplate = role.type === 'INDUSTRY_TEMPLATE';
                const loginConfig = role.loginAccess || DEFAULT_LOGIN_ACCESS;
                const assignedUsersCount = role.users?.length || 0;

                return (
                  <div
                    key={role.id}
                    className="group relative flex flex-col justify-between rounded-xl border bg-card p-4 transition-all hover:shadow-md hover:border-primary/40"
                  >
                    <div>
                      {/* Top Header */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <div
                            className={`flex h-8 w-8 items-center justify-center rounded-lg ${
                              isSystemRole
                                ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300'
                                : isIndustryTemplate
                                ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300'
                                : 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300'
                            }`}
                          >
                            <ShieldCheck className="h-4 w-4 shrink-0" />
                          </div>
                          <div>
                            <h3 className="text-sm font-bold text-foreground leading-none">{role.name}</h3>
                            <div className="flex items-center gap-1.5 mt-1">
                              {isSystemRole && (
                                <Badge variant="outline" className="border-amber-300 bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300 text-[9px] px-1.5 py-0 font-semibold">
                                  System Role
                                </Badge>
                              )}
                              {isIndustryTemplate && (
                                <Badge variant="outline" className="border-purple-300 bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-300 text-[9px] px-1.5 py-0 font-semibold">
                                  Industry Template
                                </Badge>
                              )}
                              {!isSystemRole && !isIndustryTemplate && (
                                <Badge variant="outline" className="border-blue-300 bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 text-[9px] px-1.5 py-0 font-semibold">
                                  Custom Role
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <Badge variant="secondary" className="text-[10px] font-semibold">
                            {role.permissions.length} perms
                          </Badge>
                          <button
                            type="button"
                            onClick={() => handleOpenAssignUsersModal(role)}
                            className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-0.5 text-[10px] font-bold text-foreground hover:bg-primary/10 hover:text-primary transition-colors"
                          >
                            <Users className="h-3 w-3" />
                            {assignedUsersCount} users
                          </button>
                        </div>
                      </div>

                      {/* Description */}
                      <p className="mt-3 text-xs text-muted-foreground line-clamp-2 min-h-[32px]">
                        {role.description || 'Company custom role definition with configured module permissions and data access boundary.'}
                      </p>

                      {/* PORTAL & ACCESS */}
                      <div className="mt-3 pt-2.5 border-t space-y-1.5">
                        <p className="text-[10px] font-bold tracking-wider uppercase text-muted-foreground">Portal & Access</p>
                        <div className="flex flex-wrap gap-1">
                          {loginConfig.web && (
                            <Badge variant="outline" className="text-[10px] bg-muted/40 py-0 font-normal">
                              ✓ Web ERP
                            </Badge>
                          )}
                          {loginConfig.mobile && (
                            <Badge variant="outline" className="text-[10px] bg-muted/40 py-0 font-normal">
                              ✓ Mobile App
                            </Badge>
                          )}
                          {loginConfig.ess && (
                            <Badge variant="outline" className="text-[10px] bg-muted/40 py-0 font-normal">
                              ✓ Self Service
                            </Badge>
                          )}
                          {loginConfig.admin && (
                            <Badge variant="outline" className="text-[10px] bg-muted/40 py-0 font-normal">
                              ✓ Admin Portal
                            </Badge>
                          )}
                          {loginConfig.reports && (
                            <Badge variant="outline" className="text-[10px] bg-muted/40 py-0 font-normal">
                              ✓ Reports
                            </Badge>
                          )}
                        </div>
                      </div>

                      {/* Data Scope */}
                      <div className="mt-2.5 flex items-center justify-between text-xs">
                        <span className="text-[10px] font-bold tracking-wider uppercase text-muted-foreground">Data Scope:</span>
                        <span className="font-semibold text-foreground text-[11px] bg-muted px-2 py-0.5 rounded-xs">
                          {role.dataScope || 'DEPARTMENT'}
                        </span>
                      </div>
                    </div>

                    {/* Bottom Action Buttons */}
                    <div className="mt-4 pt-3 border-t flex flex-wrap items-center justify-between gap-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <Button
                          size="xs"
                          variant="outline"
                          onClick={() => handleOpenViewModal(role)}
                          className="h-7 text-xs font-medium"
                        >
                          <Eye className="mr-1 h-3.5 w-3.5 text-muted-foreground" /> View Details
                        </Button>

                        {isSuperAdmin && (
                          <Button
                            size="xs"
                            variant="outline"
                            onClick={() => handleOpenEditModal(role)}
                            className="h-7 text-xs font-semibold border-amber-300 text-amber-800 bg-amber-50 hover:bg-amber-100 dark:bg-amber-950 dark:text-amber-300"
                          >
                            <Edit3 className="mr-1 h-3.5 w-3.5" /> Edit Permissions
                          </Button>
                        )}

                        <Button
                          size="xs"
                          onClick={() => handleOpenAddUserForRole(role)}
                          className="h-7 text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90 shadow-2xs"
                        >
                          <Plus className="mr-1 h-3.5 w-3.5" /> Add User
                        </Button>
                      </div>

                      <div className="flex items-center gap-1">
                        {isIndustryTemplate ? (
                          <Button
                            size="xs"
                            variant="outline"
                            onClick={() => handleUseTemplate(role)}
                            className="h-7 text-xs font-semibold border-purple-300 text-purple-700 bg-purple-50 hover:bg-purple-100 dark:bg-purple-950 dark:text-purple-300"
                          >
                            <Sparkles className="mr-1 h-3.5 w-3.5" /> Use Template
                          </Button>
                        ) : (
                          <Button
                            size="xs"
                            variant="ghost"
                            onClick={() => handleOpenAssignUsersModal(role)}
                            className="h-7 text-xs font-bold text-muted-foreground hover:text-foreground"
                          >
                            <Users className="mr-1 h-3.5 w-3.5" /> Users: {assignedUsersCount}
                          </Button>
                        )}

                        {isSuperAdmin && !isSystemRole && !isIndustryTemplate && (
                          <>
                            <Button
                              size="xs"
                              variant="ghost"
                              disabled={duplicateMutation.isPending}
                              onClick={() => duplicateMutation.mutate(role.id)}
                              className="h-7 text-xs font-medium text-muted-foreground hover:text-foreground px-2"
                              title="Duplicate Role"
                            >
                              <Copy className="h-3.5 w-3.5" />
                            </Button>

                            <Button
                              size="xs"
                              variant="ghost"
                              disabled={deleteMutation.isPending}
                              onClick={() => {
                                if (confirm(`Are you sure you want to delete custom role "${role.name}"?`)) {
                                  deleteMutation.mutate(role.id);
                                }
                              }}
                              className="h-7 text-xs font-medium text-destructive hover:bg-destructive/10 px-2"
                              title="Delete Role"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add / Edit / View Role Modal */}
      <Dialog open={openModal} onOpenChange={setOpenModal}>
        <DialogContent className="max-w-6xl max-h-[92vh] overflow-hidden flex flex-col p-0 gap-0">
          <DialogHeader className="p-5 border-b bg-card">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-primary shrink-0" />
              <DialogTitle className="text-lg font-bold">
                {modalMode === 'view'
                  ? `View Role Details: ${editingRole?.name || ''}`
                  : editingRole
                  ? `Edit Role Permissions: ${editingRole.name}`
                  : 'Add Custom Role'}
              </DialogTitle>
            </div>
            <DialogDescription className="text-xs text-muted-foreground">
              Configure role name, portal privileges, 25-module permission matrix, and data security scope.
            </DialogDescription>
          </DialogHeader>

          {/* Modal Body */}
          <div className="p-5 overflow-y-auto space-y-6 flex-1 bg-muted/10">
            {modalMode === 'view' && (
              <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 dark:border-blue-900/50 dark:bg-blue-950/40 text-blue-800 dark:text-blue-200 text-xs flex items-center gap-2">
                <Info className="h-4 w-4 shrink-0 text-blue-600" />
                <span>
                  <strong>View Mode:</strong> You are viewing system role configuration details and permission matrix. System role definitions are managed by Super Admin.
                </span>
              </div>
            )}

            {/* Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Role Name *</Label>
                <Input
                  placeholder="e.g. Senior HR Executive"
                  value={roleName}
                  disabled={modalMode === 'view' || editingRole?.isSystem}
                  onChange={(e) => setRoleName(e.target.value)}
                  className="text-xs bg-background"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Role Type</Label>
                <select
                  value={roleType}
                  disabled={modalMode === 'view' || editingRole?.isSystem}
                  onChange={(e) => setRoleType(e.target.value as RoleType)}
                  className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-xs shadow-2xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="CUSTOM_ROLE">Custom Role</option>
                  <option value="INDUSTRY_TEMPLATE">Industry Template</option>
                  <option value="SYSTEM_ROLE">System Role</option>
                </select>
              </div>

              <div className="space-y-1.5 md:col-span-2">
                <Label className="text-xs font-semibold">Description</Label>
                <Textarea
                  placeholder="Custom HR operational role handling attendance tracking, leave approvals, recruitment, and department employee records..."
                  value={description}
                  disabled={modalMode === 'view' || editingRole?.isSystem}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                  className="text-xs bg-background resize-none"
                />
              </div>
            </div>

            {/* PORTAL & ACCESS */}
            <div className="rounded-xl border bg-card p-4 space-y-3">
              <div className="flex items-center justify-between border-b pb-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">
                  Portal & Access Privileges
                </h4>
                <span className="text-[10px] text-muted-foreground">Select authentication channels and application portals</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-1">
                <label className="flex items-center gap-2 text-xs font-medium cursor-pointer">
                  <Checkbox
                    checked={loginAccess.web}
                    disabled={modalMode === 'view'}
                    onCheckedChange={(c) => setLoginAccess((prev) => ({ ...prev, web: !!c }))}
                  />
                  Web ERP
                </label>

                <label className="flex items-center gap-2 text-xs font-medium cursor-pointer">
                  <Checkbox
                    checked={loginAccess.mobile}
                    disabled={modalMode === 'view'}
                    onCheckedChange={(c) => setLoginAccess((prev) => ({ ...prev, mobile: !!c }))}
                  />
                  Mobile App
                </label>

                <label className="flex items-center gap-2 text-xs font-medium cursor-pointer">
                  <Checkbox
                    checked={loginAccess.ess}
                    disabled={modalMode === 'view'}
                    onCheckedChange={(c) => setLoginAccess((prev) => ({ ...prev, ess: !!c }))}
                  />
                  Employee Self Service
                </label>

                <label className="flex items-center gap-2 text-xs font-medium cursor-pointer">
                  <Checkbox
                    checked={loginAccess.admin}
                    disabled={modalMode === 'view'}
                    onCheckedChange={(c) => setLoginAccess((prev) => ({ ...prev, admin: !!c }))}
                  />
                  Admin Portal
                </label>

                <label className="flex items-center gap-2 text-xs font-medium cursor-pointer">
                  <Checkbox
                    checked={loginAccess.reports}
                    disabled={modalMode === 'view'}
                    onCheckedChange={(c) => setLoginAccess((prev) => ({ ...prev, reports: !!c }))}
                  />
                  Reports
                </label>
              </div>
            </div>

            {/* ───────── 25-MODULE PERMISSIONS MATRIX ───────── */}
            <div className="rounded-xl border bg-card p-4 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b pb-3">
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">
                    MODULE PERMISSIONS
                  </h4>
                  <div className="flex items-center gap-3 text-[11px] text-muted-foreground mt-1">
                    <span>Company: <strong className="text-foreground">{activeCompany?.name || 'Codigix Infotech Pvt. Ltd.'}</strong></span>
                    <span>• Subscription: <strong className="text-primary">{subscriptionDetails?.plan?.name || 'Professional'}</strong></span>
                    <span>• Subscribed Modules: <strong className="text-emerald-600 dark:text-emerald-400 font-bold">{subscribedModulesCount} / 25</strong></span>
                  </div>
                </div>

                {modalMode === 'edit' && (
                  <Button
                    size="xs"
                    variant="outline"
                    type="button"
                    onClick={handleSelectAllSubscribed}
                    className="h-7 text-[11px] font-semibold border-primary/30 text-primary hover:bg-primary/10 shrink-0"
                  >
                    ✓ Select All Subscribed
                  </Button>
                )}
              </div>

              <div className="flex items-center justify-between text-[11px] font-medium text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-3 py-1.5 rounded-md border border-emerald-200 dark:border-emerald-900">
                <span>✓ {subscribedModulesCount} subscribed modules available for fine-grained permission configuration.</span>
              </div>

              {/* 25 Modules Matrix Table */}
              <div className="border rounded-lg overflow-x-auto bg-background max-h-96">
                <table className="w-full text-left border-collapse text-xs min-w-[850px]">
                  <thead className="sticky top-0 bg-muted/90 backdrop-blur-xs z-10">
                    <tr className="border-b font-bold text-muted-foreground">
                      <th className="py-2.5 px-3 min-w-[200px]">Module</th>
                      {MATRIX_ACTIONS.map((act) => (
                        <th key={act.key} className="py-2.5 px-2 text-center w-14 text-[10px] tracking-wider">
                          {act.label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {Object.values(moduleEntitlementMap).map((mod) => {
                      if (!mod.isEnabled) {
                        return (
                          <tr key={mod.key} className="bg-muted/20 text-muted-foreground/70">
                            <td className="py-2 px-3 font-medium flex items-center gap-1.5">
                              <Lock className="h-3.5 w-3.5 text-muted-foreground/60" />
                              <span>{mod.name}</span>
                            </td>
                            <td colSpan={MATRIX_ACTIONS.length} className="py-2 px-3 text-center text-[11px] font-semibold text-amber-700 dark:text-amber-400">
                              🔒 Locked (Not included in company subscription)
                            </td>
                          </tr>
                        );
                      }

                      return (
                        <tr key={mod.key} className="hover:bg-muted/30 transition-colors">
                          <td className="py-2 px-3 font-medium text-foreground">{mod.name}</td>
                          {MATRIX_ACTIONS.map((act) => {
                            const permId = getPermissionId(mod.key, act.key);
                            return (
                              <td key={act.key} className="py-2 px-2 text-center">
                                {permId ? (
                                  <Checkbox
                                    checked={selectedPermissionIds.includes(permId)}
                                    disabled={modalMode === 'view'}
                                    onCheckedChange={() => togglePermissionId(permId)}
                                  />
                                ) : (
                                  <span className="text-muted-foreground/30 text-[10px]">—</span>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* DATA SCOPE */}
            <div className="rounded-xl border bg-card p-4 space-y-3">
              <div className="border-b pb-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">
                  Data Scope Security Boundary
                </h4>
                <p className="text-[11px] text-muted-foreground">
                  Determines organizational data limits: Supervisors get Team scope, Department HR gets Department scope, Company Admin gets Company scope.
                </p>
              </div>

              <RadioGroup
                value={dataScope}
                disabled={modalMode === 'view'}
                onValueChange={(val) => setDataScope(val as RoleDataScope)}
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 pt-1"
              >
                {SCOPE_OPTIONS.map((opt) => (
                  <label
                    key={opt.value}
                    className={`flex items-start gap-2.5 rounded-lg border p-3 cursor-pointer transition-all ${
                      dataScope === opt.value
                        ? 'border-primary bg-primary/5 ring-1 ring-primary'
                        : 'border-input hover:bg-muted/40'
                    }`}
                  >
                    <RadioGroupItem value={opt.value} className="mt-0.5" />
                    <div>
                      <p className="text-xs font-bold text-foreground leading-none">{opt.label}</p>
                      <p className="text-[10px] text-muted-foreground mt-1 leading-normal">{opt.description}</p>
                    </div>
                  </label>
                ))}
              </RadioGroup>
            </div>
          </div>

          {/* Modal Footer */}
          <DialogFooter className="p-4 border-t bg-card flex items-center justify-between sm:justify-between">
            <Button variant="outline" size="sm" onClick={handleCloseModal}>
              {modalMode === 'view' ? 'Close' : 'Cancel'}
            </Button>

            {modalMode === 'edit' && (
              <Button
                size="sm"
                disabled={!roleName.trim() || createMutation.isPending || updateMutation.isPending}
                onClick={() => {
                  if (editingRole) updateMutation.mutate();
                  else createMutation.mutate();
                }}
                className="bg-primary font-medium text-primary-foreground"
              >
                {editingRole ? 'Save Changes' : 'Create Role'}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assign Users Modal */}
      <Dialog open={openUsersModal} onOpenChange={setOpenUsersModal}>
        <DialogContent className="max-w-md max-h-[85vh] overflow-hidden flex flex-col p-0 gap-0">
          <DialogHeader className="p-4 border-b bg-card">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary shrink-0" />
              <DialogTitle className="text-base font-bold">
                Assign Users to {assigningRole?.name}
              </DialogTitle>
            </div>
            <DialogDescription className="text-xs text-muted-foreground">
              Select company users to grant this role access profile.
            </DialogDescription>
          </DialogHeader>

          <div className="p-4 space-y-3 flex-1 overflow-y-auto bg-muted/10">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Search user by email or employee name..."
                value={userSearchQuery}
                onChange={(e) => setUserSearchQuery(e.target.value)}
                className="pl-8 text-xs h-8 bg-background"
              />
            </div>

            <div className="border rounded-lg divide-y bg-background max-h-64 overflow-y-auto">
              {filteredAssignUsersList.length === 0 ? (
                <p className="p-4 text-center text-xs text-muted-foreground">No users found for this company.</p>
              ) : (
                filteredAssignUsersList.map((user) => {
                  const isChecked = selectedUserIds.includes(user.id);
                  const empName = user.company?.name || user.email.split('@')[0];
                  return (
                    <label
                      key={user.id}
                      className="flex items-center justify-between p-2.5 hover:bg-muted/40 cursor-pointer text-xs"
                    >
                      <div className="flex items-center gap-2.5">
                        <Checkbox
                          checked={isChecked}
                          onCheckedChange={(c) => {
                            if (c) setSelectedUserIds((prev) => [...prev, user.id]);
                            else setSelectedUserIds((prev) => prev.filter((id) => id !== user.id));
                          }}
                        />
                        <div>
                          <p className="font-semibold text-foreground">{user.email}</p>
                          <p className="text-[10px] text-muted-foreground">{empName}</p>
                        </div>
                      </div>

                      {isChecked && (
                        <Badge variant="outline" className="text-[9px] bg-primary/10 text-primary border-primary/30">
                          Assigned
                        </Badge>
                      )}
                    </label>
                  );
                })
              )}
            </div>
          </div>

          <DialogFooter className="p-3 border-t bg-card flex items-center justify-between">
            <span className="text-xs text-muted-foreground font-medium">
              {selectedUserIds.length} user(s) selected
            </span>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setOpenUsersModal(false)}>
                Cancel
              </Button>
              <Button
                size="sm"
                disabled={assignUsersMutation.isPending}
                onClick={() => assignUsersMutation.mutate()}
                className="bg-primary font-medium text-primary-foreground"
              >
                Save Assignments
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create User for Role Modal */}
      <Dialog open={openAddUserModal} onOpenChange={setOpenAddUserModal}>
        <DialogContent className="max-w-lg p-0 overflow-hidden flex flex-col gap-0">
          <DialogHeader className="p-4 border-b bg-card">
            <div className="flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-primary shrink-0" />
              <DialogTitle className="text-base font-bold">
                Create {addUserRole?.name || 'HR Executive'} User
              </DialogTitle>
            </div>
            <DialogDescription className="text-xs text-muted-foreground">
              Add new employee user profile under {activeCompany?.name || 'Company'} with temporary login credentials.
            </DialogDescription>
          </DialogHeader>

          <div className="p-4 space-y-3.5 bg-muted/10 max-h-[75vh] overflow-y-auto">
            {/* Role (Read-only / Pre-selected) */}
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Role</Label>
              <Input
                value={addUserRole?.name || 'HR EXECUTIVE'}
                readOnly
                className="bg-muted font-bold text-xs cursor-not-allowed text-foreground"
              />
            </div>

            {/* Employee Name * */}
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Employee Name *</Label>
              <Input
                value={newEmployeeName}
                onChange={(e) => setNewEmployeeName(e.target.value)}
                placeholder="Rahul Sharma"
                className="text-xs bg-background"
              />
            </div>

            {/* Username / Email * */}
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Username / Email *</Label>
              <Input
                type="email"
                value={newUsername}
                onChange={(e) => setNewUsername(e.target.value)}
                placeholder="rahul@codigix.com"
                className="text-xs bg-background"
              />
            </div>

            {/* Mobile Number */}
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Mobile Number</Label>
              <Input
                value={newMobile}
                onChange={(e) => setNewMobile(e.target.value)}
                placeholder="+91 9876543210"
                className="text-xs bg-background"
              />
            </div>

            {/* Department * */}
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Department *</Label>
              <Select value={newDepartmentId} onValueChange={setNewDepartmentId}>
                <SelectTrigger className="h-9 text-xs bg-background">
                  <SelectValue placeholder="Select Department..." />
                </SelectTrigger>
                <SelectContent>
                  {departmentsList.length === 0 ? (
                    <SelectItem value="default" className="text-xs">Human Resources</SelectItem>
                  ) : (
                    departmentsList.map((dept) => (
                      <SelectItem key={dept.id} value={dept.id} className="text-xs">
                        {dept.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* ─────── Login Credentials ─────── */}
            <div className="relative flex py-1 items-center">
              <div className="flex-grow border-t border-border"></div>
              <span className="flex-shrink mx-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Login Credentials
              </span>
              <div className="flex-grow border-t border-border"></div>
            </div>

            {/* Temporary Password */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold">Temporary Password *</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="xs"
                  onClick={() => setNewTempPassword(generateTempPassword())}
                  className="h-6 text-[10px] font-semibold gap-1 text-primary border-primary/30"
                >
                  <Sparkles className="h-3 w-3" /> Auto Generate
                </Button>
              </div>
              <Input
                value={newTempPassword}
                onChange={(e) => setNewTempPassword(e.target.value)}
                placeholder="X7m#92Lp@4"
                className="text-xs font-mono bg-background"
              />
            </div>

            {/* Checkboxes */}
            <div className="space-y-2 pt-1">
              <label className="flex items-center gap-2 text-xs font-medium cursor-pointer text-foreground">
                <Checkbox
                  checked={sendEmailChecked}
                  onCheckedChange={(c) => setSendEmailChecked(Boolean(c))}
                />
                <span>Send login credentials to HR email</span>
              </label>

              <label className="flex items-center gap-2 text-xs font-medium cursor-pointer text-foreground">
                <Checkbox
                  checked={requireResetChecked}
                  onCheckedChange={(c) => setRequireResetChecked(Boolean(c))}
                />
                <span>Require password change on first login</span>
              </label>
            </div>

            {/* Company */}
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Company</Label>
              <Input
                value={activeCompany?.name || 'Codigix Infotech Pvt. Ltd.'}
                readOnly
                className="bg-muted text-xs font-medium cursor-not-allowed"
              />
            </div>
          </div>

          <DialogFooter className="p-3 border-t bg-card flex items-center justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setOpenAddUserModal(false)}>
              Cancel
            </Button>
            <Button
              size="sm"
              disabled={!newUsername.trim() || !newEmployeeName.trim() || createUserForRoleMutation.isPending}
              onClick={() => createUserForRoleMutation.mutate()}
              className="bg-primary font-medium text-primary-foreground shadow-xs"
            >
              {createUserForRoleMutation.isPending ? 'Creating User...' : 'Create User'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Created Credentials Summary Modal */}
      <Dialog open={openCredentialsModal} onOpenChange={setOpenCredentialsModal}>
        <DialogContent className="max-w-md p-0 overflow-hidden flex flex-col gap-0">
          <DialogHeader className="p-4 border-b bg-emerald-50 dark:bg-emerald-950/40">
            <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300">
              <CheckCircle2 className="h-5 w-5 shrink-0" />
              <DialogTitle className="text-base font-bold">User Created Successfully</DialogTitle>
            </div>
            <DialogDescription className="text-xs text-emerald-600 dark:text-emerald-400">
              Temporary login credentials generated and registered.
            </DialogDescription>
          </DialogHeader>

          <div className="p-4 space-y-3 bg-card">
            <div className="p-3.5 rounded-xl border bg-muted/30 space-y-3 text-xs">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                  Username / Email:
                </span>
                <span className="font-mono font-bold text-foreground text-sm">{createdCredentials?.email}</span>
              </div>

              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                  Temporary Password:
                </span>
                <div className="flex items-center justify-between gap-2 mt-1 bg-background p-2 rounded-lg border">
                  <span className="font-mono font-bold text-primary text-sm tracking-widest">
                    {createdCredentials?.tempPassword}
                  </span>
                  <Button
                    size="xs"
                    variant="ghost"
                    onClick={() => {
                      navigator.clipboard.writeText(createdCredentials?.tempPassword || '');
                      toast.success('Temporary password copied to clipboard');
                    }}
                    className="h-7 text-[10px] gap-1 font-semibold hover:bg-primary/10 hover:text-primary"
                  >
                    <Copy className="h-3.5 w-3.5" /> Copy
                  </Button>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">Role:</span>
                  <Badge variant="outline" className="text-[10px] font-semibold bg-primary/10 text-primary border-primary/20 mt-0.5">
                    {createdCredentials?.roleName}
                  </Badge>
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block text-right">
                    Status:
                  </span>
                  <Badge variant="outline" className="text-[10px] font-semibold bg-amber-50 text-amber-700 border-amber-300 mt-0.5">
                    {createdCredentials?.status || 'Invitation Pending'}
                  </Badge>
                </div>
              </div>
            </div>

            <div className="rounded-lg bg-blue-50 border border-blue-200 p-3 dark:bg-blue-950/40 dark:border-blue-900 text-[11px] text-blue-800 dark:text-blue-200 flex items-start gap-2">
              <Mail className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
              <span>
                Login credentials have been sent to <strong>{createdCredentials?.email}</strong>. The user must sign in at <strong>/login</strong> and set a permanent password.
              </span>
            </div>
          </div>

          <DialogFooter className="p-3 border-t bg-card">
            <Button
              size="sm"
              onClick={() => setOpenCredentialsModal(false)}
              className="w-full bg-primary font-medium text-primary-foreground"
            >
              Done & Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
