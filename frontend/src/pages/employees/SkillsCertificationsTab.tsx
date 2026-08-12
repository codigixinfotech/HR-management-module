import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  Award,
  Plus,
  Search,
  Brain,
  Code,
  Users,
  Compass,
  Trash2,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { employeesApi } from '@/api/employees';

interface SkillItem {
  id: string;
  name: string;
  category: 'Frontend' | 'Backend' | 'DevOps' | 'Design' | 'Management';
  employeesCount: number;
  certRequired: boolean;
  benchmarkScore: string;
}

export function SkillsCertificationsTab() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Modal State
  const [isOpen, setIsOpen] = useState(false);
  const [formName, setFormName] = useState('');
  const [formCategory, setFormCategory] = useState<'Frontend' | 'Backend' | 'DevOps' | 'Design' | 'Management'>('Frontend');
  const [formBenchmark, setFormBenchmark] = useState('Level 3 (Advanced)');
  const [formCert, setFormCert] = useState('no');

  // Fetch skill competencies from backend
  const { data: rawSkills = [], isLoading } = useQuery<any[]>({
    queryKey: ['skills'],
    queryFn: employeesApi.listSkills,
  });

  // Map backend competencies to frontend interface
  const skills = useMemo<SkillItem[]>(() => {
    return rawSkills.map(s => ({
      id: s.id,
      name: s.name,
      category: s.category as any,
      employeesCount: 0, // In future phases, this can count matching employee profile matches
      certRequired: Boolean(s.certRequired),
      benchmarkScore: s.benchmarkScore,
    }));
  }, [rawSkills]);

  // Mutations
  const createMutation = useMutation({
    mutationFn: employeesApi.createSkill,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['skills'] });
      toast.success('Skill competency profile added successfully');
      setIsOpen(false);
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message ?? 'Failed to add skill competency');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: employeesApi.removeSkill,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['skills'] });
      toast.success('Skill competency deleted successfully');
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message ?? 'Failed to delete skill competency');
    },
  });

  const openAddModal = () => {
    setFormName('');
    setFormCategory('Frontend');
    setFormBenchmark('Level 3 (Advanced)');
    setFormCert('no');
    setIsOpen(true);
  };

  const handleAddSkill = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName) {
      toast.error('Skill Competency Name is required');
      return;
    }

    createMutation.mutate({
      name: formName,
      category: formCategory,
      certRequired: formCert === 'yes',
      benchmarkScore: formBenchmark,
    });
  };

  const handleDeleteSkill = (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete the skill competency "${name}"?`)) {
      deleteMutation.mutate(id);
    }
  };

  const filteredSkills = useMemo(() => {
    return skills.filter(s => {
      const matchesSearch =
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.id.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory =
        selectedCategory === 'all' ? true : s.category.toLowerCase() === selectedCategory.toLowerCase();
      return matchesSearch && matchesCategory;
    });
  }, [skills, searchQuery, selectedCategory]);

  return (
    <div className="space-y-6">
      {/* ── 1. Top Skills Stats Cards ── */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Card className="shadow-2xs border-border/80">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Mapped Competencies</p>
              <p className=" text-2xl font-semibold text-foreground mt-0.5">{skills.length} Skills</p>
              <p className="text-[10px] text-primary font-semibold mt-1">Ready for evaluation</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary shrink-0">
              <Brain className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-2xs border-border/80">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Active Certs</p>
              <p className=" text-2xl font-semibold text-foreground mt-0.5">
                {skills.filter(s => s.certRequired).length} Types
              </p>
              <p className="text-[10px] text-emerald-600 font-semibold mt-1">Required certifications</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 shrink-0">
              <Award className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-2xs border-border/80">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Skills Matrix Coverage</p>
              <p className=" text-2xl font-semibold text-foreground mt-0.5">88.2%</p>
              <p className="text-[10px] text-violet-600 font-semibold mt-1">Engineering roles evaluated</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/10 text-violet-600 shrink-0">
              <Compass className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-2xs border-border/80">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Skilled Personnel</p>
              <p className=" text-2xl font-semibold text-foreground mt-0.5">42 Staff</p>
              <p className="text-[10px] text-amber-600 font-semibold mt-1">Competency mapped</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 shrink-0">
              <Users className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── 2. Skills Mappings Directory Table ── */}
      <Card className="shadow-xs border-border/80">
        <CardHeader className="pb-3 border-b border-border/60">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Brain className="h-4 w-4 text-primary" /> Corporate Skills & Certification Registry
              </CardTitle>
              <CardDescription className="text-xs">
                Review department-wide technical skill parameters, passing benchmarks, and certifications required
              </CardDescription>
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0">
              {/* Category Filter Pills */}
              <div className="flex items-center bg-muted/40 p-1 rounded-xl border border-border">
                {[
                  { id: 'all', label: 'All Categories' },
                  { id: 'frontend', label: 'Frontend' },
                  { id: 'backend', label: 'Backend' },
                  { id: 'devops', label: 'DevOps' },
                  { id: 'management', label: 'Management' },
                ].map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`px-2.5 py-1 text-xs font-semibold rounded-lg capitalize transition-all ${selectedCategory === cat.id
                      ? 'bg-background text-foreground shadow-xs'
                      : 'text-muted-foreground hover:text-foreground'
                      }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>

              {/* Search Bar */}
              <div className="relative w-40 sm:w-52">
                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Filter competency..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="h-8 pl-8 text-xs bg-background"
                />
              </div>

              {/* Add Competency Dialog */}
              <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" className="h-8 text-xs gap-1.5" onClick={openAddModal}>
                    <Plus className="h-3.5 w-3.5" /> Map Competency
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Map Skill Competency</DialogTitle>
                  </DialogHeader>
                  <form className="space-y-4" onSubmit={handleAddSkill}>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Competency Name</Label>
                      <Input
                        placeholder="e.g. AWS Cloudformation & Terraform"
                        value={formName}
                        onChange={e => setFormName(e.target.value)}
                        className="h-9 text-xs"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label className="text-xs">Skill Category</Label>
                        <Select value={formCategory} onValueChange={v => setFormCategory(v as any)}>
                          <SelectTrigger className="h-9 text-xs">
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Frontend" className="text-xs">Frontend</SelectItem>
                            <SelectItem value="Backend" className="text-xs">Backend</SelectItem>
                            <SelectItem value="DevOps" className="text-xs">DevOps</SelectItem>
                            <SelectItem value="Design" className="text-xs">Design</SelectItem>
                            <SelectItem value="Management" className="text-xs">Management</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">Skill Passing Benchmark</Label>
                        <Input
                          placeholder="e.g. Level 4 (Expert)"
                          value={formBenchmark}
                          onChange={e => setFormBenchmark(e.target.value)}
                          className="h-9 text-xs"
                        />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Official Certification Required?</Label>
                      <Select value={formCert} onValueChange={setFormCert}>
                        <SelectTrigger className="h-9 text-xs">
                          <SelectValue placeholder="Select certification requirement" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="no" className="text-xs">No - Skill Mapping Only</SelectItem>
                          <SelectItem value="yes" className="text-xs">Yes - Verified Cert Required</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <DialogFooter>
                      <Button type="submit" size="sm" className="text-xs" disabled={createMutation.isPending}>
                        Publish Competency
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs">Skill ID</TableHead>
                <TableHead className="text-xs">Competency Name</TableHead>
                <TableHead className="text-xs">Category</TableHead>
                <TableHead className="text-xs">Staff Mapped</TableHead>
                <TableHead className="text-xs">Industry Certification</TableHead>
                <TableHead className="text-xs">Benchmark Target</TableHead>
                <TableHead className="text-right text-xs">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-6 text-xs text-muted-foreground">
                    Loading skill competency records...
                  </TableCell>
                </TableRow>
              ) : filteredSkills.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-6 text-xs text-muted-foreground">
                    No skill competencies found.
                  </TableCell>
                </TableRow>
              ) : (
                filteredSkills.map(s => (
                  <TableRow key={s.id} className="hover:bg-muted/40 transition-colors">
                    <TableCell className="font-mono text-xs font-semibold text-primary">{s.id}</TableCell>
                    <TableCell className="font-semibold text-xs text-foreground">
                      <div className="flex items-center gap-2">
                        <Code className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                        {s.name}
                      </div>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground font-semibold">{s.category}</TableCell>
                    <TableCell className="text-xs font-mono font-semibold text-primary">
                      {s.employeesCount} Staff
                    </TableCell>
                    <TableCell className="text-xs">
                      <Badge variant="outline" className={`text-[10px] font-semibold ${s.certRequired ? 'bg-indigo-500/10 text-indigo-600 border-indigo-500/20' : 'bg-muted text-muted-foreground'}`}>
                        {s.certRequired ? 'Required' : 'Optional'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs font-semibold">{s.benchmarkScore}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive hover:bg-destructive/10"
                        onClick={() => handleDeleteSkill(s.id, s.name)}
                        disabled={deleteMutation.isPending}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
