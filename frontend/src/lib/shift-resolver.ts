import type { ShiftMasterItem, ShiftAssignmentItem, EmployeeRosterRow } from '@/pages/attendance-leave/shift-roster/shiftRosterStore';

export interface ResolvedShift {
  id: string;
  name: string;
  code: string;
  startTime: string;
  endTime: string;
  timing: string;
  source: 'Published Roster' | 'Employee Override' | 'Department Assignment' | 'Company Default' | 'Record Shift';
}

export interface ShiftResolutionParams {
  employeeId?: string;
  employeeCode?: string;
  departmentId?: string;
  departmentName?: string;
  companyId?: string;
  dateStr: string | Date;
  shifts?: ShiftMasterItem[];
  assignments?: ShiftAssignmentItem[];
  rosterEmployees?: EmployeeRosterRow[];
  recordShiftType?: {
    id?: string;
    name?: string;
    code?: string;
    startTime?: string;
    endTime?: string;
  } | null;
}

/**
 * Standardize date key to YYYY-MM-DD
 */
export function normalizeDateKey(date: string | Date): string {
  if (!date) return '';
  if (typeof date === 'string') {
    if (date.includes('T')) return date.split('T')[0];
    if (date.includes('-')) {
      const parts = date.split('-');
      if (parts[0].length === 4) return date; // YYYY-MM-DD
      if (parts[2]?.length === 4) return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`; // DD-MM-YYYY
    }
    if (date.includes('/')) {
      const parts = date.split('/');
      if (parts[2]?.length === 4) return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`; // DD/MM/YYYY
      if (parts[0]?.length === 4) return `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`; // YYYY/MM/DD
    }
  }
  try {
    const d = new Date(date);
    if (isNaN(d.getTime())) return '';
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  } catch {
    return '';
  }
}

/**
 * Format time string to 12-hour AM/PM format (e.g. 08:00 AM)
 */
export function formatShiftTime(timeStr?: string): string {
  if (!timeStr || timeStr === '—' || timeStr === '-') return '';
  const clean = timeStr.trim();
  if (clean.toUpperCase().includes('AM') || clean.toUpperCase().includes('PM')) {
    return clean;
  }
  const parts = clean.split(':');
  if (parts.length >= 2) {
    let hours = parseInt(parts[0], 10) || 0;
    const minutes = parseInt(parts[1], 10) || 0;
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')} ${ampm}`;
  }
  return clean;
}

/**
 * Format timing interval e.g. "08:00 AM – 04:30 PM"
 */
export function formatShiftTiming(start?: string, end?: string): string {
  const s = formatShiftTime(start);
  const e = formatShiftTime(end);
  if (s && e) return `${s} – ${e}`;
  if (s) return s;
  return '';
}

/**
 * Universal Hierarchical Shift Resolver:
 * Resolution Priority:
 * 1. Published Roster for that date
 * 2. Employee Shift Override
 * 3. Department Shift Assignment
 * 4. Company Default Shift
 */
export function resolveApplicableShift(params: ShiftResolutionParams): ResolvedShift {
  const {
    employeeId,
    employeeCode,
    departmentId,
    departmentName,
    companyId,
    dateStr,
    shifts = [],
    assignments = [],
    rosterEmployees = [],
    recordShiftType,
  } = params;

  const dateKey = normalizeDateKey(dateStr);

  const findShiftMasterByCodeOrId = (codeOrId?: string): ShiftMasterItem | undefined => {
    if (!codeOrId) return undefined;
    const query = codeOrId.toUpperCase().trim();
    return (
      shifts.find((s) => s.id === codeOrId) ||
      shifts.find((s) => s.code?.toUpperCase() === query) ||
      shifts.find((s) => s.name?.toUpperCase() === query) ||
      shifts.find((s) => s.name?.toUpperCase().includes(query))
    );
  };

  // ── 1. Employee Shift Override (Tier 1 - Highest Priority) ──
  // If an employee has an explicit shift override, rotation or roster must NEVER overwrite it.
  if (assignments && assignments.length > 0) {
    const empOverride = assignments.find((a) => {
      if (a.tier !== 'EMPLOYEE' && a.priority !== 1) return false;
      const isEmpMatch =
        (employeeId && a.employeeId === employeeId) ||
        (employeeCode && a.employeeCode === employeeCode) ||
        (employeeCode && a.employeeCode?.toLowerCase() === employeeCode?.toLowerCase());
      if (!isEmpMatch) return false;
      if (a.status && a.status !== 'Active') return false;
      if (dateKey) {
        if (a.effectiveFrom && dateKey < a.effectiveFrom) return false;
        if (a.effectiveTo && dateKey > a.effectiveTo) return false;
      }
      return true;
    });

    if (empOverride) {
      const matched = findShiftMasterByCodeOrId(empOverride.shiftId || empOverride.shiftCode);
      const start = matched ? matched.startTime : empOverride.timing?.split('-')[0]?.trim();
      const end = matched ? matched.endTime : empOverride.timing?.split('-')[1]?.trim();
      return {
        id: matched?.id || empOverride.shiftId || 'emp-override',
        name: matched?.name || empOverride.shiftName || 'Morning Shift',
        code: matched?.code || empOverride.shiftCode || 'MS',
        startTime: formatShiftTime(start) || '08:00 AM',
        endTime: formatShiftTime(end) || '04:30 PM',
        timing: formatShiftTiming(start, end) || empOverride.timing || '08:00 AM – 04:30 PM',
        source: 'Employee Override',
      };
    }
  }

  // ── 2. Published Roster for that specific date (Generated via Rotation or Publishing) ──
  if (rosterEmployees && rosterEmployees.length > 0 && dateKey) {
    const rosterEmp = rosterEmployees.find((r) => {
      if (employeeId && r.employeeId === employeeId) return true;
      if (employeeCode && r.employeeCode === employeeCode) return true;
      return false;
    });

    if (rosterEmp?.slots && rosterEmp.slots[dateKey]) {
      const slot = rosterEmp.slots[dateKey];
      // Check if slot has a real shift code (e.g. MS, GS, ES, NS, MOR, GEN, NIT)
      if (slot.shiftCode && slot.shiftCode !== 'OFF' && slot.shiftCode !== 'WO' && slot.shiftCode !== 'HOL' && slot.shiftCode !== 'LV') {
        const matched = findShiftMasterByCodeOrId(slot.shiftCode);
        if (matched) {
          return {
            id: matched.id,
            name: matched.name,
            code: matched.code,
            startTime: formatShiftTime(matched.startTime),
            endTime: formatShiftTime(matched.endTime),
            timing: formatShiftTiming(matched.startTime, matched.endTime),
            source: 'Published Roster',
          };
        }
        return {
          id: `roster-${slot.shiftCode}`,
          name: slot.shiftName || slot.shiftCode,
          code: slot.shiftCode,
          startTime: '08:00 AM',
          endTime: '04:30 PM',
          timing: slot.timing || '08:00 AM – 04:30 PM',
          source: 'Published Roster',
        };
      }
    }
  }

  // ── 3. Department Shift Assignment (Tier 2) ──
  if (assignments && assignments.length > 0) {
    const deptAsg = assignments.find((a) => {
      if (a.tier !== 'DEPARTMENT' && a.priority !== 2) return false;
      const isDeptMatch =
        (departmentId && a.departmentId === departmentId) ||
        (departmentName && a.departmentName && a.departmentName.toLowerCase().trim() === departmentName.toLowerCase().trim());
      if (!isDeptMatch) return false;
      if (a.status && a.status !== 'Active') return false;
      if (dateKey) {
        if (a.effectiveFrom && dateKey < a.effectiveFrom) return false;
        if (a.effectiveTo && dateKey > a.effectiveTo) return false;
      }
      return true;
    });

    if (deptAsg) {
      const matched = findShiftMasterByCodeOrId(deptAsg.shiftId || deptAsg.shiftCode);
      const start = matched ? matched.startTime : deptAsg.timing?.split('-')[0]?.trim();
      const end = matched ? matched.endTime : deptAsg.timing?.split('-')[1]?.trim();
      return {
        id: matched?.id || deptAsg.shiftId || 'dept-asg',
        name: matched?.name || deptAsg.shiftName || 'Morning Shift',
        code: matched?.code || deptAsg.shiftCode || 'MS',
        startTime: formatShiftTime(start) || '08:00 AM',
        endTime: formatShiftTime(end) || '04:30 PM',
        timing: formatShiftTiming(start, end) || deptAsg.timing || '08:00 AM – 04:30 PM',
        source: 'Department Assignment',
      };
    }
  }

  // ── 4. Company Default Shift (Tier 3) ──
  if (assignments && assignments.length > 0) {
    const compAsg = assignments.find((a) => a.tier === 'COMPANY' || a.priority === 3);
    if (compAsg) {
      const matched = findShiftMasterByCodeOrId(compAsg.shiftId || compAsg.shiftCode);
      const start = matched ? matched.startTime : compAsg.timing?.split('-')[0]?.trim();
      const end = matched ? matched.endTime : compAsg.timing?.split('-')[1]?.trim();
      return {
        id: matched?.id || compAsg.shiftId || 'comp-default',
        name: matched?.name || compAsg.shiftName || 'General Shift',
        code: matched?.code || compAsg.shiftCode || 'GS',
        startTime: formatShiftTime(start) || '09:00 AM',
        endTime: formatShiftTime(end) || '05:30 PM',
        timing: formatShiftTiming(start, end) || compAsg.timing || '09:00 AM – 05:30 PM',
        source: 'Company Default',
      };
    }
  }

  // ── 5. Record shiftType fallback ──
  if (recordShiftType?.name) {
    const matched = findShiftMasterByCodeOrId(recordShiftType.id || recordShiftType.name);
    return {
      id: recordShiftType.id || matched?.id || 'rec-shift',
      name: recordShiftType.name,
      code: recordShiftType.code || matched?.code || 'MS',
      startTime: formatShiftTime(recordShiftType.startTime || matched?.startTime) || '08:00 AM',
      endTime: formatShiftTime(recordShiftType.endTime || matched?.endTime) || '04:30 PM',
      timing: formatShiftTiming(
        recordShiftType.startTime || matched?.startTime || '08:00 AM',
        recordShiftType.endTime || matched?.endTime || '04:30 PM'
      ),
      source: 'Record Shift',
    };
  }

  // ── 6. Department-aware fallback ──
  // If Production or Manufacturing, default to Morning Shift (MS); otherwise General Shift (GS)
  const isProd = departmentName?.toLowerCase().includes('production') || departmentName?.toLowerCase().includes('plant');
  const targetShift = isProd
    ? shifts.find((s) => s.code === 'MS' || s.name.toLowerCase().includes('morning')) || shifts[0]
    : shifts.find((s) => s.code === 'GS' || s.name.toLowerCase().includes('general')) || shifts[0];

  if (targetShift) {
    return {
      id: targetShift.id,
      name: targetShift.name,
      code: targetShift.code,
      startTime: formatShiftTime(targetShift.startTime),
      endTime: formatShiftTime(targetShift.endTime),
      timing: formatShiftTiming(targetShift.startTime, targetShift.endTime),
      source: 'Company Default',
    };
  }

  return {
    id: 'default-ms',
    name: 'Morning Shift',
    code: 'MS',
    startTime: '08:00 AM',
    endTime: '04:30 PM',
    timing: '08:00 AM – 04:30 PM',
    source: 'Company Default',
  };
}
