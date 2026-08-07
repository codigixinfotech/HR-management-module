import { useSearchParams } from 'react-router-dom';
import {
  GraduationCap,
  BookOpen,
  Award,
  Plus,
  Users,
  Star,
  Download,
  CalendarClock,
  ShieldCheck,
  LayoutGrid,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PageHeader } from '@/components/layout/PageHeader';
import { StatCard } from '@/components/ui/stat-card';
import { StatusBadge } from '@/components/ui/status-badge';
import { EmptyState } from '@/components/ui/empty-state';

const COURSES = [
  { id: 'CRS-01', title: 'ISO 27001 Information Security & Data Protection', category: 'Compliance', hours: '4.5 hrs', rating: '4.9', enrolled: 42, level: 'Mandatory' },
  { id: 'CRS-02', title: 'Industrial Safety & EHS Protocol 2026', category: 'Safety', hours: '6.0 hrs', rating: '4.8', enrolled: 68, level: 'Mandatory' },
  { id: 'CRS-03', title: 'Advanced React 19 & TypeScript Architecture', category: 'Engineering', hours: '12 hrs', rating: '5.0', enrolled: 15, level: 'Elective' },
  { id: 'CRS-04', title: 'Leadership & Strategic Manager Communication', category: 'Management', hours: '8 hrs', rating: '4.7', enrolled: 24, level: 'Executive' },
];

const TRAINING_SESSIONS = [
  { id: 'TRN-01', title: 'ISO 27001 Refresher Workshop', trainer: 'Rajesh Sharma', date: '18 Aug 2026', mode: 'Virtual', seats: '32 / 40', status: 'SCHEDULED' },
  { id: 'TRN-02', title: 'Fire & Industrial Safety Drill', trainer: 'External - SafetyFirst Corp', date: '22 Aug 2026', mode: 'On-site', seats: '68 / 70', status: 'SCHEDULED' },
  { id: 'TRN-03', title: 'New Manager Leadership Bootcamp', trainer: 'Priya Verma', date: '05 Aug 2026', mode: 'Hybrid', seats: '18 / 20', status: 'COMPLETED' },
  { id: 'TRN-04', title: 'React 19 Migration Deep-Dive', trainer: 'Amit Patel', date: '29 Aug 2026', mode: 'Virtual', seats: '9 / 15', status: 'SCHEDULED' },
];

const CERTIFICATIONS = [
  { employee: 'Priya Verma', credential: 'ISO 27001 Lead Implementer', issued: '10 Jan 2026', expires: '10 Jan 2028', status: 'VERIFIED' },
  { employee: 'Rajesh Sharma', credential: 'Industrial Safety & EHS', issued: '02 Feb 2026', expires: '02 Feb 2027', status: 'VERIFIED' },
  { employee: 'Amit Patel', credential: 'AWS Certified Solutions Architect', issued: '14 Nov 2024', expires: '14 Nov 2027', status: 'VERIFIED' },
  { employee: 'Sunita Rao', credential: 'POSH Awareness Certification', issued: '20 Jul 2024', expires: '20 Jul 2025', status: 'EXPIRED' },
];

export default function LearningPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'dashboard';

  return (
    <div className="space-y-6">
      <PageHeader
        icon={GraduationCap}
        title="Learning Management System (LMS)"
        description="Employee upskilling courses, mandatory safety certifications, training assessments & skill gap matrices"
        badge="Q3 Skill Matrix Active"
        badgeVariant="success"
        actions={
          <Button size="sm" className="gap-1.5 text-xs">
            <Plus className="h-3.5 w-3.5" /> Publish New Course
          </Button>
        }
      />

      {/* Metrics */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard icon={BookOpen} label="Published Courses" value="18 Courses" hint="4 Mandatory Modules" accent="info" />
        <StatCard icon={Users} label="Active Enrollments" value="149 Employees" hint="89% Completion Rate" accent="success" />
        <StatCard icon={Award} label="Certifications Awarded" value="312 Issued" hint="Verifiable Credentials" accent="warning" />
        <StatCard icon={GraduationCap} label="Skill Index Score" value="4.6 / 5.0" hint="Above Benchmark" accent="primary" />
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(val) => setSearchParams({ tab: val })} className="w-full">
        <TabsList className="flex h-auto flex-wrap gap-1 bg-muted/60 p-1">
          <TabsTrigger value="dashboard" className="text-xs px-3 py-1.5">Overview</TabsTrigger>
          <TabsTrigger value="courses" className="text-xs px-3 py-1.5">Course Catalog</TabsTrigger>
          <TabsTrigger value="training" className="text-xs px-3 py-1.5">Training Sessions</TabsTrigger>
          <TabsTrigger value="skill-matrix" className="text-xs px-3 py-1.5">Skill Matrix</TabsTrigger>
          <TabsTrigger value="certifications" className="text-xs px-3 py-1.5">Certifications</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="mt-4 space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {COURSES.map((course) => (
              <Card key={course.id} className="shadow-2xs">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <Badge variant="outline" className="text-[10px] mb-1.5">
                        {course.category}
                      </Badge>
                      <CardTitle className="text-base font-semibold">{course.title}</CardTitle>
                    </div>
                    <Badge variant={course.level === 'Mandatory' ? 'destructive' : 'secondary'} className="text-[10px]">
                      {course.level}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="text-xs space-y-3">
                  <div className="flex items-center justify-between text-muted-foreground">
                    <span>Duration: {course.hours}</span>
                    <span className="flex items-center gap-1 text-warning font-semibold">
                      <Star className="h-3.5 w-3.5 fill-warning" /> {course.rating}
                    </span>
                    <span>{course.enrolled} Enrolled</span>
                  </div>
                  <Button size="sm" variant="outline" className="w-full text-xs gap-1.5">
                    <BookOpen className="h-3.5 w-3.5" /> View Modules & Content
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="courses" className="mt-4">
          <Card className="shadow-2xs">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base font-semibold">Full Course Catalog</CardTitle>
                <CardDescription>All published mandatory, elective and executive learning modules</CardDescription>
              </div>
              <Button variant="outline" size="sm" className="gap-1.5 text-xs">
                <Download className="h-3.5 w-3.5" /> Export Catalog
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Course ID</TableHead>
                    <TableHead className="text-xs">Title</TableHead>
                    <TableHead className="text-xs">Category</TableHead>
                    <TableHead className="text-xs">Duration</TableHead>
                    <TableHead className="text-xs">Rating</TableHead>
                    <TableHead className="text-xs">Enrolled</TableHead>
                    <TableHead className="text-xs">Level</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {COURSES.map((course) => (
                    <TableRow key={course.id}>
                      <TableCell className="font-mono text-xs font-semibold">{course.id}</TableCell>
                      <TableCell className="text-xs font-medium">{course.title}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{course.category}</TableCell>
                      <TableCell className="text-xs">{course.hours}</TableCell>
                      <TableCell className="text-xs">
                        <span className="flex items-center gap-1 text-warning font-semibold">
                          <Star className="h-3 w-3 fill-warning" /> {course.rating}
                        </span>
                      </TableCell>
                      <TableCell className="text-xs font-mono">{course.enrolled}</TableCell>
                      <TableCell className="text-xs">
                        <Badge variant={course.level === 'Mandatory' ? 'destructive' : 'secondary'} className="text-[10px]">
                          {course.level}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="training" className="mt-4">
          <Card className="shadow-2xs">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base font-semibold">Upcoming & Recent Training Sessions</CardTitle>
                <CardDescription>Instructor-led, virtual and hybrid sessions scheduled across teams</CardDescription>
              </div>
              <Button size="sm" className="gap-1.5 text-xs">
                <Plus className="h-3.5 w-3.5" /> Schedule Session
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Session ID</TableHead>
                    <TableHead className="text-xs">Title</TableHead>
                    <TableHead className="text-xs">Trainer</TableHead>
                    <TableHead className="text-xs">Date</TableHead>
                    <TableHead className="text-xs">Mode</TableHead>
                    <TableHead className="text-xs">Seats</TableHead>
                    <TableHead className="text-xs">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {TRAINING_SESSIONS.map((t) => (
                    <TableRow key={t.id}>
                      <TableCell className="font-mono text-xs font-semibold">{t.id}</TableCell>
                      <TableCell className="text-xs font-medium">{t.title}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{t.trainer}</TableCell>
                      <TableCell className="text-xs flex items-center gap-1.5">
                        <CalendarClock className="h-3 w-3 text-muted-foreground" /> {t.date}
                      </TableCell>
                      <TableCell className="text-xs">{t.mode}</TableCell>
                      <TableCell className="text-xs font-mono">{t.seats}</TableCell>
                      <TableCell className="text-xs">
                        <StatusBadge status={t.status} className="text-[10px]" />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="skill-matrix" className="mt-4">
          <EmptyState
            icon={LayoutGrid}
            title="Skill Gap Matrix"
            description="Cross-functional skill matrix mapping employee proficiency levels against role benchmarks is being configured."
            badge="Coming soon"
          />
        </TabsContent>

        <TabsContent value="certifications" className="mt-4">
          <Card className="shadow-2xs">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base font-semibold">Issued Certifications & Credentials</CardTitle>
                <CardDescription>Verifiable mandatory and professional certifications across the workforce</CardDescription>
              </div>
              <Button variant="outline" size="sm" className="gap-1.5 text-xs">
                <Download className="h-3.5 w-3.5" /> Export Register
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Employee</TableHead>
                    <TableHead className="text-xs">Credential</TableHead>
                    <TableHead className="text-xs">Issued</TableHead>
                    <TableHead className="text-xs">Expires</TableHead>
                    <TableHead className="text-xs">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {CERTIFICATIONS.map((c, i) => (
                    <TableRow key={i}>
                      <TableCell className="text-xs font-medium">{c.employee}</TableCell>
                      <TableCell className="text-xs flex items-center gap-1.5">
                        <ShieldCheck className="h-3 w-3 text-muted-foreground" /> {c.credential}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">{c.issued}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{c.expires}</TableCell>
                      <TableCell className="text-xs">
                        <StatusBadge status={c.status} className="text-[10px]" />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
