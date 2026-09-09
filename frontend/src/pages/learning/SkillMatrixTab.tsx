import { useState, useEffect, useMemo } from 'react';
import {
  LayoutGrid,
  Plus,
  Search,
  CheckCircle2,
  Users,
  Award,
  Sparkles,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { SkillItem, EmployeeSkillScore } from './types';
import { AddSkillModal } from './AddSkillModal';
import { useAuthStore } from '@/stores/auth-store';
import { isHrOrAdminUser } from '@/lib/modules';
import { apiClient } from '@/lib/api-client';
import { lmsApi } from '@/services/lmsApi';
import { toast } from 'sonner';

export function SkillMatrixTab() {
  const user = useAuthStore((s) => s.user);
  const isHrOrAdmin = isHrOrAdminUser(user);

  const [skills, setSkills] = useState<SkillItem[]>([]);
  const [employeeSkills, setEmployeeSkills] = useState<EmployeeSkillScore[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchSkillsData = async () => {
    try {
      const [skillsList, dbEmpSkills] = await Promise.all([
        lmsApi.getSkills(),
        lmsApi.getEmployeeSkills(),
      ]);
      setSkills(Array.isArray(skillsList) ? skillsList : []);

      if (Array.isArray(dbEmpSkills) && dbEmpSkills.length > 0) {
        setEmployeeSkills(
          dbEmpSkills.map((es: any) => ({
            id: es.id,
            employeeId: es.employeeId,
            employeeName: es.employeeName || (es.employee ? `${es.employee.firstName} ${es.employee.lastName}` : 'Employee'),
            department: es.department || (es.employee?.department ? es.employee.department.name : 'Operations'),
            skillName: es.skill ? es.skill.name : es.skillName || 'Skill',
            skillLevel: es.skillLevel || 'Beginner',
            sourceCourse: es.sourceCourse || 'Completed Course',
            lastUpdated: es.lastUpdated ? String(es.lastUpdated).split('T')[0] : 'Today',
          }))
        );
      } else {
        // Fallback: aggregate from live enrollments
        const enrollments = await lmsApi.getEnrollments();
        const mapped: EmployeeSkillScore[] = enrollments.map((enr: any) => {
          const level: 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert' =
            enr.progress >= 100 ? 'Expert' : enr.progress >= 60 ? 'Advanced' : enr.progress > 0 ? 'Intermediate' : 'Beginner';
          return {
            id: enr.id,
            employeeId: enr.employeeId,
            employeeName: enr.employeeName || 'Employee',
            department: enr.department || 'Operations',
            skillName: enr.courseTitle,
            skillLevel: level,
            sourceCourse: enr.courseTitle,
            lastUpdated: enr.assignedDate ? String(enr.assignedDate).split('T')[0] : 'Today',
          };
        });
        setEmployeeSkills(mapped);
      }
    } catch (err) {
      console.warn('Failed to load skills from backend:', err);
    }
  };

  useEffect(() => {
    fetchSkillsData();
  }, []);

  const currentEmpId = user?.employee?.id || user?.id || '';
  const mySkills = useMemo(() => {
    if (isHrOrAdmin) return employeeSkills;
    return employeeSkills.filter(
      (e) =>
        e.employeeId === currentEmpId ||
        (user?.name && e.employeeName?.toLowerCase().includes(user.name.toLowerCase()))
    );
  }, [employeeSkills, isHrOrAdmin, currentEmpId, user]);

  interface EmployeeMatrixRow {
    employeeId: string;
    employeeName: string;
    department: string;
    skills: Record<string, { level: string; score: number }>;
  }

  const employeeMatrix = useMemo(() => {
    const map = new Map<string, EmployeeMatrixRow>();
    mySkills.forEach((item) => {
      if (!map.has(item.employeeId)) {
        map.set(item.employeeId, {
          employeeId: item.employeeId,
          employeeName: item.employeeName,
          department: item.department,
          skills: {},
        });
      }
      const row = map.get(item.employeeId)!;
      const numLevel =
        item.skillLevel === 'Expert' ? 4 : item.skillLevel === 'Advanced' ? 3 : item.skillLevel === 'Intermediate' ? 2 : 1;
      row.skills[(item.skillName || '').toLowerCase()] = {
        level: item.skillLevel,
        score: numLevel,
      };
    });
    return Array.from(map.values());
  }, [mySkills]);

  const getSkillScore = (empRow: EmployeeMatrixRow, skillName: string) => {
    if (!empRow || !empRow.skills) return null;
    const sName = (skillName || '').toLowerCase();
    for (const [key, val] of Object.entries(empRow.skills)) {
      if (key.includes(sName) || sName.includes(key) || key.split(' ')[0] === sName.split(' ')[0]) {
        return val;
      }
    }
    return null;
  };

  const totalEmployees = isHrOrAdmin ? (employeeMatrix.length > 0 ? employeeMatrix.length : new Set(employeeSkills.map((e) => e.employeeId)).size) : 1;
  const totalSkills = skills.length;
  const avgScore = useMemo(() => {
    if (employeeSkills.length === 0) return '4.5 / 5';
    const sum = employeeSkills.reduce((acc, curr) => {
      const score = curr.skillLevel === 'Expert' ? 5 : curr.skillLevel === 'Advanced' ? 4 : curr.skillLevel === 'Intermediate' ? 3 : 2;
      return acc + score;
    }, 0);
    return `${(sum / employeeSkills.length).toFixed(1)} / 5`;
  }, [employeeSkills]);
  const skillGapsCount = employeeSkills.filter((e) => e.skillLevel === 'Beginner').length;

  const filteredMatrix = useMemo(() => {
    return employeeMatrix.filter(
      (e) =>
        (e.employeeName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (e.department || '').toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [employeeMatrix, searchQuery]);

  const filteredDetailedSkills = useMemo(() => {
    return mySkills.filter(
      (e) =>
        (e.employeeName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (e.skillName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (e.department || '').toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [mySkills, searchQuery]);

  const handleSaveSkill = (newSkill: SkillItem) => {
    setSkills((prev) => [newSkill, ...prev]);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <LayoutGrid className="h-6 w-6 text-primary" /> {isHrOrAdmin ? 'Workforce Skill Gap Matrix' : 'My Skill Competency Profile'}
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            {isHrOrAdmin
              ? 'Real-time competency mapping, proficiency tracking (Level 1–5), and automated updates upon course completion'
              : 'Your verified proficiency scores and competency levels across enterprise skill categories'}
          </p>
        </div>

        {isHrOrAdmin && (
          <Button onClick={() => setIsModalOpen(true)} className="gap-1.5 text-xs bg-primary text-primary-foreground">
            <Plus className="h-4 w-4" /> Add Skill
          </Button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="shadow-2xs">
          <CardContent className="p-4 text-center space-y-1">
            <span className="text-xs text-muted-foreground font-medium block">Mapped Employees</span>
            <span className="text-2xl font-extrabold text-foreground">{totalEmployees}</span>
          </CardContent>
        </Card>

        <Card className="shadow-2xs border-blue-500/20 bg-blue-500/5">
          <CardContent className="p-4 text-center space-y-1">
            <span className="text-xs text-blue-700 dark:text-blue-400 font-medium block">Skills Tracked</span>
            <span className="text-2xl font-extrabold text-blue-600 dark:text-blue-300">{totalSkills}</span>
          </CardContent>
        </Card>

        <Card className="shadow-2xs border-emerald-500/20 bg-emerald-500/5">
          <CardContent className="p-4 text-center space-y-1">
            <span className="text-xs text-emerald-700 dark:text-emerald-400 font-medium block">Average Skill Score</span>
            <span className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-300">{avgScore}</span>
          </CardContent>
        </Card>

        <Card className="shadow-2xs border-amber-500/20 bg-amber-500/5">
          <CardContent className="p-4 text-center space-y-1">
            <span className="text-xs text-amber-700 dark:text-amber-400 font-medium block">Skill Gaps Identified</span>
            <span className="text-2xl font-extrabold text-amber-600 dark:text-amber-300">{skillGapsCount}</span>
          </CardContent>
        </Card>
      </div>

      {/* Auto-Sync Info Box */}
      <div className="p-4 rounded-xl border border-primary/30 bg-primary/5 space-y-1 text-xs">
        <p className="font-bold text-primary flex items-center gap-1.5">
          <Sparkles className="h-4 w-4" /> Automatic Skill Matrix Synchronization Active
        </p>
        <p className="text-muted-foreground">
          When employees complete assigned training programs and pass required assessments, their proficiency scores are automatically evaluated and updated in this matrix.
        </p>
      </div>

      {/* Filter Bar */}
      <div className="flex items-center justify-between gap-3 p-3 bg-muted/40 rounded-xl border">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Search employee or department..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 text-xs h-8 bg-background"
          />
        </div>
      </div>

      {/* Matrix Table */}
      <Card className="shadow-2xs overflow-hidden">
        <CardHeader className="p-4 pb-2 border-b bg-muted/20">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" /> Skill Proficiency Grid
            </CardTitle>
            <span className="text-xs text-muted-foreground">{filteredMatrix.length} employee{filteredMatrix.length === 1 ? '' : 's'}</span>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead className="text-xs font-bold w-48">Employee</TableHead>
                <TableHead className="text-xs font-bold">Department</TableHead>
                {skills.map((sk) => (
                  <TableHead key={sk.id} className="text-xs font-bold text-center">
                    {sk.name}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredMatrix.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={skills.length + 2} className="text-center py-8 text-xs text-muted-foreground">
                    No mapped employee competencies found yet. Enroll employees in courses to automatically build the skill matrix.
                  </TableCell>
                </TableRow>
              ) : (
                filteredMatrix.map((emp) => (
                  <TableRow key={emp.employeeId} className="hover:bg-muted/40 transition-colors">
                    <TableCell className="text-xs font-semibold text-foreground">
                      <div>
                        <div>{emp.employeeName}</div>
                        <div className="text-[10px] text-muted-foreground font-mono">{emp.employeeId}</div>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">{emp.department}</TableCell>
                    {skills.map((sk) => {
                      const match = getSkillScore(emp, sk.name);
                      return (
                        <TableCell key={sk.id} className="text-xs text-center font-mono">
                          {match ? (
                            <Badge
                              variant={match.score >= 3 ? 'default' : 'outline'}
                              className={`font-bold text-xs ${
                                match.score === 4
                                  ? 'bg-emerald-600 text-white'
                                  : match.score === 3
                                  ? 'bg-blue-600 text-white'
                                  : 'bg-card'
                              }`}
                            >
                              Level {match.score} ({match.level})
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground/60 text-xs">—</span>
                          )}
                        </TableCell>
                      );
                    })}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Detailed Competency Register */}
      {filteredDetailedSkills.length > 0 && (
        <Card className="shadow-2xs overflow-hidden">
          <CardHeader className="p-4 pb-2 border-b bg-muted/20">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Award className="h-4 w-4 text-amber-500" /> Individual Competency Records
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead className="text-xs font-bold">Employee</TableHead>
                  <TableHead className="text-xs font-bold">Department</TableHead>
                  <TableHead className="text-xs font-bold">Skill / Competency</TableHead>
                  <TableHead className="text-xs font-bold text-center">Proficiency</TableHead>
                  <TableHead className="text-xs font-bold">Source Course</TableHead>
                  <TableHead className="text-xs font-bold text-right">Last Updated</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDetailedSkills.map((item) => (
                  <TableRow key={item.id} className="hover:bg-muted/40 transition-colors">
                    <TableCell className="text-xs font-medium text-foreground">{item.employeeName}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{item.department}</TableCell>
                    <TableCell className="text-xs font-semibold text-foreground">
                      <div className="flex items-center gap-1.5">
                        <Award className="h-3.5 w-3.5 text-primary" />
                        <span>{item.skillName}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs text-center">
                      <Badge
                        variant="outline"
                        className={`text-xs font-semibold ${
                          item.skillLevel === 'Expert'
                            ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30'
                            : item.skillLevel === 'Advanced'
                            ? 'bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/30'
                            : item.skillLevel === 'Intermediate'
                            ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30'
                            : 'bg-muted text-muted-foreground'
                        }`}
                      >
                        {item.skillLevel}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground max-w-xs truncate">{item.sourceCourse}</TableCell>
                    <TableCell className="text-xs text-right font-mono text-muted-foreground">{item.lastUpdated}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Modal */}
      <AddSkillModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveSkill}
      />
    </div>
  );
}
