import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { toast } from 'sonner';

export type WeeklyOffType =
  | 'Fixed (Single Full Day)'
  | 'Multiple Fixed Days'
  | 'Fixed Half Day'
  | 'Multiple Half Days'
  | 'Rotational'
  | 'Alternate Week'
  | 'Custom / Roster Based';

export type DayScheduleStatus = 'Working' | 'Full Off' | 'Half Day';

export interface DayPatternConfig {
  status: DayScheduleStatus;
  session?: 'Morning' | 'Afternoon';
}

export type WeeklySchedulePattern = {
  Monday: DayPatternConfig;
  Tuesday: DayPatternConfig;
  Wednesday: DayPatternConfig;
  Thursday: DayPatternConfig;
  Friday: DayPatternConfig;
  Saturday: DayPatternConfig;
  Sunday: DayPatternConfig;
};

export type ApplicableScope =
  | 'Entire Company'
  | 'Branch'
  | 'Department'
  | 'Employee Group'
  | 'Designation'
  | 'Specific Employees';

export type HolidayInteraction =
  | 'No additional off'
  | 'Compensatory Off'
  | 'Move Off to another day'
  | 'As per Company Policy';

export interface WeeklyOffPolicyItem {
  id: string;
  code: string;
  name: string;
  description: string;
  status: 'Active' | 'Inactive';
  effectiveFrom: string;
  effectiveTo?: string;

  // Section 2: Type & 7-Day Weekly Schedule Pattern
  type: WeeklyOffType;
  schedulePattern: WeeklySchedulePattern;

  // Specific helpers for types
  fixedDay?: string;
  multipleFixedDays?: string[];
  halfDay?: string;
  halfDaySession?: 'Morning' | 'Afternoon';
  multipleHalfDays?: { day: string; session: 'Morning' | 'Afternoon' }[];

  rotationPattern?: 'Weekly' | 'Bi-Weekly' | 'Monthly';
  rotationOffRule?: '1 day per week' | '2 days per week' | '1.5 days per week' | 'Rotational 6-1 cycle';
  assignmentSource?: 'Roster' | 'Pattern Cycle';

  alternatePrimaryDay?: string;
  alternatePattern?: '2nd & 4th Week' | '1st & 3rd Week' | '1st, 3rd & 5th Week' | 'Custom';
  alternateSecondaryDay?: string;
  alternateAction?: 'Full Off' | 'Half Day';

  customDeterminedBy?: string;

  // Section 3: Applicable To
  applicableTo: ApplicableScope;
  applicableTarget?: string;

  // Section 4: Roster Rules
  minWorkingDaysPerWeek: number;
  maxConsecutiveWorkingDays: number;
  minWeeklyOffDays: number;
  allowOffDaySwap: boolean;
  requireApprovalForSwap: boolean;

  // Section 5: Holiday Interaction
  holidayInteraction: HolidayInteraction;

  // Section 6: Override Rules
  allowOverride: boolean;
  reasonRequired: boolean;
  approvalRequired: boolean;
  auditTrail: boolean;
}

export function getDefaultSchedulePattern(type: WeeklyOffType): WeeklySchedulePattern {
  const base: WeeklySchedulePattern = {
    Monday: { status: 'Working' },
    Tuesday: { status: 'Working' },
    Wednesday: { status: 'Working' },
    Thursday: { status: 'Working' },
    Friday: { status: 'Working' },
    Saturday: { status: 'Working' },
    Sunday: { status: 'Full Off' },
  };

  switch (type) {
    case 'Fixed (Single Full Day)':
      return { ...base, Sunday: { status: 'Full Off' } };
    case 'Multiple Fixed Days':
      return {
        ...base,
        Saturday: { status: 'Full Off' },
        Sunday: { status: 'Full Off' },
      };
    case 'Fixed Half Day':
      return {
        ...base,
        Saturday: { status: 'Half Day', session: 'Morning' },
        Sunday: { status: 'Full Off' },
      };
    case 'Multiple Half Days':
      return {
        ...base,
        Wednesday: { status: 'Half Day', session: 'Afternoon' },
        Saturday: { status: 'Half Day', session: 'Morning' },
        Sunday: { status: 'Full Off' },
      };
    case 'Alternate Week':
      return {
        ...base,
        Saturday: { status: 'Half Day', session: 'Morning' },
        Sunday: { status: 'Full Off' },
      };
    case 'Rotational':
    case 'Custom / Roster Based':
      return {
        Monday: { status: 'Working' },
        Tuesday: { status: 'Working' },
        Wednesday: { status: 'Working' },
        Thursday: { status: 'Working' },
        Friday: { status: 'Working' },
        Saturday: { status: 'Working' },
        Sunday: { status: 'Full Off' },
      };
    default:
      return base;
  }
}

export function getOffPatternSummary(p: WeeklyOffPolicyItem): string {
  if (p.type === 'Rotational') {
    return p.rotationOffRule || 'Rotational (1 day/wk)';
  }
  if (p.type === 'Custom / Roster Based') {
    return 'Roster Determined';
  }
  if (p.type === 'Alternate Week') {
    const act = p.alternateAction === 'Half Day' ? 'Half Day' : 'OFF';
    return `${p.alternatePattern || '2nd & 4th'} ${p.alternatePrimaryDay || 'Sat'} (${act})${p.alternateSecondaryDay ? ` + ${p.alternateSecondaryDay}` : ''}`;
  }

  // Generate summary from schedulePattern if present
  if (p.schedulePattern) {
    const fullOffDays: string[] = [];
    const halfDays: string[] = [];
    const days: (keyof WeeklySchedulePattern)[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

    days.forEach((d) => {
      const entry = p.schedulePattern[d];
      if (entry?.status === 'Full Off') {
        fullOffDays.push(d.slice(0, 3));
      } else if (entry?.status === 'Half Day') {
        halfDays.push(`${d.slice(0, 3)} (Half)`);
      }
    });

    const parts: string[] = [];
    if (halfDays.length > 0) parts.push(halfDays.join(' + '));
    if (fullOffDays.length > 0) parts.push(fullOffDays.join(' + '));
    if (parts.length > 0) return parts.join(' + ');
  }

  switch (p.type) {
    case 'Fixed (Single Full Day)':
      return `${p.fixedDay || 'Sunday'} (Full Off)`;
    case 'Multiple Fixed Days':
      return (p.multipleFixedDays && p.multipleFixedDays.length > 0)
        ? `${p.multipleFixedDays.join(' + ')} (Full Off)`
        : 'Sat + Sun (Full Off)';
    case 'Fixed Half Day':
      return `${p.halfDay || 'Saturday'} (Half Day) + Sun (Full Off)`;
    case 'Multiple Half Days':
      return 'Wed + Sat (Half Day) + Sun (Full Off)';
    default:
      return 'Sunday (Full Off)';
  }
}

// 12 All-industry standard default policies with Half Day & Full Off coverage
const INITIAL_POLICIES: WeeklyOffPolicyItem[] = [
  {
    id: 'wo-1',
    code: 'WO-001',
    name: 'Standard Office',
    description: 'Standard single-day weekly off on Sunday for corporate office staff.',
    status: 'Active',
    effectiveFrom: '2026-01-01',
    type: 'Fixed (Single Full Day)',
    fixedDay: 'Sunday',
    schedulePattern: {
      Monday: { status: 'Working' },
      Tuesday: { status: 'Working' },
      Wednesday: { status: 'Working' },
      Thursday: { status: 'Working' },
      Friday: { status: 'Working' },
      Saturday: { status: 'Working' },
      Sunday: { status: 'Full Off' },
    },
    applicableTo: 'Entire Company',
    applicableTarget: 'Corporate',
    minWorkingDaysPerWeek: 6,
    maxConsecutiveWorkingDays: 6,
    minWeeklyOffDays: 1,
    allowOffDaySwap: true,
    requireApprovalForSwap: true,
    holidayInteraction: 'No additional off',
    allowOverride: true,
    reasonRequired: true,
    approvalRequired: true,
    auditTrail: true,
  },
  {
    id: 'wo-2',
    code: 'WO-002',
    name: 'Corporate 5-Day',
    description: '5-day working week with dual fixed weekly offs on Saturday and Sunday.',
    status: 'Active',
    effectiveFrom: '2026-01-01',
    type: 'Multiple Fixed Days',
    multipleFixedDays: ['Saturday', 'Sunday'],
    schedulePattern: {
      Monday: { status: 'Working' },
      Tuesday: { status: 'Working' },
      Wednesday: { status: 'Working' },
      Thursday: { status: 'Working' },
      Friday: { status: 'Working' },
      Saturday: { status: 'Full Off' },
      Sunday: { status: 'Full Off' },
    },
    applicableTo: 'Department',
    applicableTarget: 'Corporate / IT',
    minWorkingDaysPerWeek: 5,
    maxConsecutiveWorkingDays: 5,
    minWeeklyOffDays: 2,
    allowOffDaySwap: true,
    requireApprovalForSwap: true,
    holidayInteraction: 'Compensatory Off',
    allowOverride: true,
    reasonRequired: true,
    approvalRequired: true,
    auditTrail: true,
  },
  {
    id: 'wo-3',
    code: 'WO-003',
    name: 'Saturday Half Day (5.5 Days)',
    description: 'Monday to Friday full working, Saturday morning half-day, and Sunday full weekly off.',
    status: 'Active',
    effectiveFrom: '2026-01-01',
    type: 'Fixed Half Day',
    halfDay: 'Saturday',
    halfDaySession: 'Morning',
    schedulePattern: {
      Monday: { status: 'Working' },
      Tuesday: { status: 'Working' },
      Wednesday: { status: 'Working' },
      Thursday: { status: 'Working' },
      Friday: { status: 'Working' },
      Saturday: { status: 'Half Day', session: 'Morning' },
      Sunday: { status: 'Full Off' },
    },
    applicableTo: 'Department',
    applicableTarget: 'Manufacturing & Operations',
    minWorkingDaysPerWeek: 6,
    maxConsecutiveWorkingDays: 6,
    minWeeklyOffDays: 1,
    allowOffDaySwap: true,
    requireApprovalForSwap: true,
    holidayInteraction: 'Compensatory Off',
    allowOverride: true,
    reasonRequired: true,
    approvalRequired: true,
    auditTrail: true,
  },
  {
    id: 'wo-4',
    code: 'WO-004',
    name: 'Retail Monday Off',
    description: 'Store retail staff weekly off on Monday after busy weekend operations.',
    status: 'Active',
    effectiveFrom: '2026-01-01',
    type: 'Fixed (Single Full Day)',
    fixedDay: 'Monday',
    schedulePattern: {
      Monday: { status: 'Full Off' },
      Tuesday: { status: 'Working' },
      Wednesday: { status: 'Working' },
      Thursday: { status: 'Working' },
      Friday: { status: 'Working' },
      Saturday: { status: 'Working' },
      Sunday: { status: 'Working' },
    },
    applicableTo: 'Department',
    applicableTarget: 'Retail Stores',
    minWorkingDaysPerWeek: 6,
    maxConsecutiveWorkingDays: 6,
    minWeeklyOffDays: 1,
    allowOffDaySwap: true,
    requireApprovalForSwap: true,
    holidayInteraction: 'Move Off to another day',
    allowOverride: true,
    reasonRequired: true,
    approvalRequired: true,
    auditTrail: true,
  },
  {
    id: 'wo-5',
    code: 'WO-005',
    name: 'Manufacturing Rotation',
    description: '24x7 production plant continuous operations with weekly rotational rest days.',
    status: 'Active',
    effectiveFrom: '2026-01-01',
    type: 'Rotational',
    rotationPattern: 'Weekly',
    rotationOffRule: '1 day per week',
    assignmentSource: 'Roster',
    schedulePattern: getDefaultSchedulePattern('Rotational'),
    applicableTo: 'Department',
    applicableTarget: 'Production & Plant',
    minWorkingDaysPerWeek: 6,
    maxConsecutiveWorkingDays: 6,
    minWeeklyOffDays: 1,
    allowOffDaySwap: true,
    requireApprovalForSwap: true,
    holidayInteraction: 'Compensatory Off',
    allowOverride: true,
    reasonRequired: true,
    approvalRequired: true,
    auditTrail: true,
  },
  {
    id: 'wo-6',
    code: 'WO-006',
    name: 'Hospital Rotation',
    description: 'Clinical nursing and physician duty roster with staggered rotational weekly offs.',
    status: 'Active',
    effectiveFrom: '2026-01-01',
    type: 'Rotational',
    rotationPattern: 'Weekly',
    rotationOffRule: '1 day per week',
    assignmentSource: 'Roster',
    schedulePattern: getDefaultSchedulePattern('Rotational'),
    applicableTo: 'Department',
    applicableTarget: 'Hospital & Healthcare',
    minWorkingDaysPerWeek: 6,
    maxConsecutiveWorkingDays: 6,
    minWeeklyOffDays: 1,
    allowOffDaySwap: true,
    requireApprovalForSwap: true,
    holidayInteraction: 'Compensatory Off',
    allowOverride: true,
    reasonRequired: true,
    approvalRequired: true,
    auditTrail: true,
  },
  {
    id: 'wo-7',
    code: 'WO-007',
    name: 'BPO Rotation',
    description: '24/7 customer support contact center with 2 rotational off days per week.',
    status: 'Active',
    effectiveFrom: '2026-01-01',
    type: 'Rotational',
    rotationPattern: 'Weekly',
    rotationOffRule: '2 days per week',
    assignmentSource: 'Roster',
    schedulePattern: getDefaultSchedulePattern('Rotational'),
    applicableTo: 'Department',
    applicableTarget: 'BPO Operations',
    minWorkingDaysPerWeek: 5,
    maxConsecutiveWorkingDays: 5,
    minWeeklyOffDays: 2,
    allowOffDaySwap: true,
    requireApprovalForSwap: true,
    holidayInteraction: 'As per Company Policy',
    allowOverride: true,
    reasonRequired: true,
    approvalRequired: true,
    auditTrail: true,
  },
  {
    id: 'wo-8',
    code: 'WO-008',
    name: 'Security Custom',
    description: 'Site security guards and surveillance personnel with dynamic roster assigned offs.',
    status: 'Active',
    effectiveFrom: '2026-01-01',
    type: 'Custom / Roster Based',
    customDeterminedBy: 'Employee Roster',
    schedulePattern: getDefaultSchedulePattern('Custom / Roster Based'),
    applicableTo: 'Department',
    applicableTarget: 'Security & Facilities',
    minWorkingDaysPerWeek: 6,
    maxConsecutiveWorkingDays: 6,
    minWeeklyOffDays: 1,
    allowOffDaySwap: true,
    requireApprovalForSwap: true,
    holidayInteraction: 'As per Company Policy',
    allowOverride: true,
    reasonRequired: true,
    approvalRequired: true,
    auditTrail: true,
  },
  {
    id: 'wo-9',
    code: 'WO-009',
    name: 'Logistics Rotation',
    description: 'Warehouse dispatch and freight fleet drivers with staggered weekly off rosters.',
    status: 'Active',
    effectiveFrom: '2026-01-01',
    type: 'Rotational',
    rotationPattern: 'Weekly',
    rotationOffRule: '1 day per week',
    assignmentSource: 'Roster',
    schedulePattern: getDefaultSchedulePattern('Rotational'),
    applicableTo: 'Department',
    applicableTarget: 'Logistics & Supply Chain',
    minWorkingDaysPerWeek: 6,
    maxConsecutiveWorkingDays: 6,
    minWeeklyOffDays: 1,
    allowOffDaySwap: true,
    requireApprovalForSwap: true,
    holidayInteraction: 'No additional off',
    allowOverride: true,
    reasonRequired: true,
    approvalRequired: true,
    auditTrail: true,
  },
  {
    id: 'wo-10',
    code: 'WO-010',
    name: 'Education Half Day Saturday',
    description: 'Academic faculty with Saturday afternoon off and Sunday full weekly off.',
    status: 'Active',
    effectiveFrom: '2026-01-01',
    type: 'Fixed Half Day',
    halfDay: 'Saturday',
    halfDaySession: 'Afternoon',
    schedulePattern: {
      Monday: { status: 'Working' },
      Tuesday: { status: 'Working' },
      Wednesday: { status: 'Working' },
      Thursday: { status: 'Working' },
      Friday: { status: 'Working' },
      Saturday: { status: 'Half Day', session: 'Afternoon' },
      Sunday: { status: 'Full Off' },
    },
    applicableTo: 'Department',
    applicableTarget: 'Academic Faculty',
    minWorkingDaysPerWeek: 6,
    maxConsecutiveWorkingDays: 6,
    minWeeklyOffDays: 1,
    allowOffDaySwap: false,
    requireApprovalForSwap: true,
    holidayInteraction: 'No additional off',
    allowOverride: false,
    reasonRequired: true,
    approvalRequired: true,
    auditTrail: true,
  },
  {
    id: 'wo-11',
    code: 'WO-011',
    name: 'Mid-Week Dual Half Day',
    description: 'Wednesday afternoon half-day and Saturday morning half-day plus Sunday full off.',
    status: 'Active',
    effectiveFrom: '2026-01-01',
    type: 'Multiple Half Days',
    schedulePattern: {
      Monday: { status: 'Working' },
      Tuesday: { status: 'Working' },
      Wednesday: { status: 'Half Day', session: 'Afternoon' },
      Thursday: { status: 'Working' },
      Friday: { status: 'Working' },
      Saturday: { status: 'Half Day', session: 'Morning' },
      Sunday: { status: 'Full Off' },
    },
    applicableTo: 'Department',
    applicableTarget: 'Design & Creative Teams',
    minWorkingDaysPerWeek: 6,
    maxConsecutiveWorkingDays: 6,
    minWeeklyOffDays: 1,
    allowOffDaySwap: true,
    requireApprovalForSwap: true,
    holidayInteraction: 'No additional off',
    allowOverride: true,
    reasonRequired: true,
    approvalRequired: true,
    auditTrail: true,
  },
  {
    id: 'wo-12',
    code: 'WO-012',
    name: 'Alternate Saturday',
    description: 'Corporate admin staff with 2nd & 4th Saturday OFF plus every Sunday OFF.',
    status: 'Active',
    effectiveFrom: '2026-01-01',
    type: 'Alternate Week',
    alternatePrimaryDay: 'Saturday',
    alternatePattern: '2nd & 4th Week',
    alternateSecondaryDay: 'Sunday',
    alternateAction: 'Full Off',
    schedulePattern: {
      Monday: { status: 'Working' },
      Tuesday: { status: 'Working' },
      Wednesday: { status: 'Working' },
      Thursday: { status: 'Working' },
      Friday: { status: 'Working' },
      Saturday: { status: 'Half Day', session: 'Morning' },
      Sunday: { status: 'Full Off' },
    },
    applicableTo: 'Department',
    applicableTarget: 'Corporate & Finance',
    minWorkingDaysPerWeek: 5,
    maxConsecutiveWorkingDays: 6,
    minWeeklyOffDays: 1,
    allowOffDaySwap: true,
    requireApprovalForSwap: true,
    holidayInteraction: 'Compensatory Off',
    allowOverride: true,
    reasonRequired: true,
    approvalRequired: true,
    auditTrail: true,
  },
];

interface WeeklyOffPolicyState {
  policies: WeeklyOffPolicyItem[];
  addPolicy: (policy: Omit<WeeklyOffPolicyItem, 'id'>) => void;
  updatePolicy: (id: string, updates: Partial<WeeklyOffPolicyItem>) => void;
  deletePolicy: (id: string) => void;
  getNextCode: () => string;
}

export const useWeeklyOffPolicyStore = create<WeeklyOffPolicyState>()(
  persist(
    (set, get) => ({
      policies: INITIAL_POLICIES,

      getNextCode: () => {
        const { policies } = get();
        let maxNum = 0;
        policies.forEach((p) => {
          const match = p.code.match(/WO-(\d+)/i);
          if (match) {
            const num = parseInt(match[1], 10);
            if (num > maxNum) maxNum = num;
          }
        });
        const nextNum = maxNum + 1;
        return `WO-${nextNum.toString().padStart(3, '0')}`;
      },

      addPolicy: (policyData) => {
        const newPolicy: WeeklyOffPolicyItem = {
          ...policyData,
          id: `wo-${Date.now()}`,
        };
        set((state) => ({ policies: [newPolicy, ...state.policies] }));
        toast.success(`Weekly Off Policy "${newPolicy.name} (${newPolicy.code})" created successfully`);
      },

      updatePolicy: (id, updates) => {
        set((state) => ({
          policies: state.policies.map((p) => (p.id === id ? { ...p, ...updates } : p)),
        }));
        toast.success('Weekly Off Policy updated successfully');
      },

      deletePolicy: (id) => {
        const target = get().policies.find((p) => p.id === id);
        set((state) => ({
          policies: state.policies.filter((p) => p.id !== id),
        }));
        toast.success(`Policy "${target?.name || id}" removed`);
      },
    }),
    {
      name: 'ehcm-weekly-off-policies-v2',
    }
  )
);
