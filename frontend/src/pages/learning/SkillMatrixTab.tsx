import { useState, useMemo } from 'react';
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
import { INITIAL_SKILLS, MOCK_EMPLOYEE_SKILLS, type SkillItem, type EmployeeSkillScore } from './mockTrainingData';
import { AddSkillModal } from './AddSkillModal';
import { useAuthStore } from '@/stores/auth-store';
import { isHrOrAdminUser } from '@/lib/modules';

export function SkillMatrixTab() {
  const user = useAuthStore((s) => s.user);
  const isHrOrAdmin = isHrOrAdminUser(user);

  const [skills, setSkills] = useState<SkillItem[]>(INITIAL_SKILLS);
  const [employeeSkills, setEmployeeSkills] = useState<EmployeeSkillScore[]>(MOCK_EMPLOYEE_SKILLS);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const mySkills = useMemo(() => {
    if (isHrOrAdmin) return employeeSkills;
    return employeeSkills.filter(
      (e) => e.employeeId === user?.id || e.employeeId === 'EMP-001' || e.employeeName.toLowerCase().includes('sanika') || e.employeeName.toLowerCase().includes('priya')
    );
  }, [employeeSkills, isHrOrAdmin, user]);

  const totalEmployees = isHrOrAdmin ? 456 : 1;
  const totalSkills = skills.length;
  const avgScore = '4.6 / 5';
  const skillGapsCount = isHrOrAdmin ? 18 : 0;

  const filteredEmployees = useMemo(() => {
    return mySkills.filter((e) => e.employeeName.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [mySkills, searchQuery]);

  const handleSaveSkill = (newSkill: SkillItem) => {
    setSkills([newSkill, ...skills]);
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
            placeholder="Search employee..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 text-xs h-8 bg-background"
          />
        </div>
      </div>

      {/* Matrix Table */}
      <Card className="shadow-2xs overflow-hidden">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead className="text-xs font-bold w-48">Employee</TableHead>
                <TableHead className="text-xs font-bold text-center">Advanced Excel</TableHead>
                <TableHead className="text-xs font-bold text-center">Leadership</TableHead>
                <TableHead className="text-xs font-bold text-center">Workplace Safety</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredEmployees.map((emp) => (
                <TableRow key={emp.employeeId} className="hover:bg-muted/40 transition-colors">
                  <TableCell className="text-xs font-semibold text-foreground">{emp.employeeName}</TableCell>
                  <TableCell className="text-xs text-center font-mono">
                    <Badge variant="outline" className="font-bold text-xs bg-card">
                      Level {emp.skills['Advanced Excel & Data Analytics'] || 1}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-center font-mono">
                    <Badge variant="outline" className="font-bold text-xs bg-card">
                      Level {emp.skills['Strategic Leadership'] || 1}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-center font-mono">
                    <Badge variant="default" className="font-bold text-xs bg-emerald-600">
                      Level {emp.skills['Workplace Safety & EHS'] || 1}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Modal */}
      <AddSkillModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveSkill}
      />
    </div>
  );
}
