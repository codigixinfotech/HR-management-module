import { useState } from 'react';
import { toast } from 'sonner';
import {
  Globe,
  Trash2,
  Copy,
  Eye,
  Settings,
  Image,
  ExternalLink,
  Laptop,
  TrendingUp,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

interface PublicJobItem {
  id: string;
  title: string;
  dept: string;
  location: string;
  type: string;
  portalViews: number;
  applicants: number;
  status: 'Published' | 'Draft' | 'Expired';
}

const INITIAL_PUBLIC_JOBS: PublicJobItem[] = [
  { id: 'PUB-101', title: 'Senior React Architect', dept: 'Engineering', location: 'New York HQ (Hybrid)', type: 'Full-Time', portalViews: 1240, applicants: 84, status: 'Published' },
  { id: 'PUB-102', title: 'DevOps & Kubernetes Engineer', dept: 'Engineering', location: 'Pune Plant (On-Site)', type: 'Full-Time', portalViews: 850, applicants: 56, status: 'Published' },
  { id: 'PUB-103', title: 'Product Design Manager', dept: 'Product Design', location: 'Boston Hub (Hybrid)', type: 'Full-Time', portalViews: 920, applicants: 42, status: 'Published' },
  { id: 'PUB-104', title: 'HR Operations Lead', dept: 'Human Resources', location: 'New York HQ (Hybrid)', type: 'Full-Time', portalViews: 410, applicants: 28, status: 'Published' },
];

export function CareersPortalTab() {
  const [publicJobs, setPublicJobs] = useState<PublicJobItem[]>(INITIAL_PUBLIC_JOBS);
  const [portalUrl, setPortalUrl] = useState('https://careers.stockpulse.com/jobs');
  const [brandColor, setBrandColor] = useState('#2563EB');
  const [welcomeText, setWelcomeText] = useState('Join StockPulse — Build the Future of Enterprise HCM');

  const handleCopyLink = (url: string) => {
    navigator.clipboard.writeText(url);
    toast.success('Public careers link copied to clipboard!');
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success('Branding & configuration settings saved successfully!');
  };

  const toggleStatus = (id: string) => {
    setPublicJobs(prev =>
      prev.map(j =>
        j.id === id ? { ...j, status: j.status === 'Published' ? 'Draft' : 'Published' } : j,
      ),
    );
    toast.success('Job visibility changed');
  };

  return (
    <div className="space-y-6">
      {/* ── 1. Portal Settings & Configuration Form ── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Portal Branding Customizer */}
        <Card className="shadow-xs border-border/80 lg:col-span-1">
          <CardHeader className="pb-3 border-b border-border/60">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Settings className="h-4 w-4 text-primary" /> Portal Configuration
            </CardTitle>
            <CardDescription className="text-xs">
              Customize branding, colors, domain URLs & welcome headings for the public jobs page
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 sm:p-5">
            <form onSubmit={handleSaveSettings} className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs">Public Portal Domain</Label>
                <div className="flex gap-2">
                  <Input value={portalUrl} onChange={e => setPortalUrl(e.target.value)} className="h-9 text-xs font-mono" />
                  <Button type="button" size="icon" variant="outline" className="h-9 w-9" onClick={() => handleCopyLink(portalUrl)}>
                    <Copy className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Welcome Banner Headline</Label>
                <Input value={welcomeText} onChange={e => setWelcomeText(e.target.value)} className="h-9 text-xs" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Primary Brand Color</Label>
                  <div className="flex gap-2">
                    <Input type="color" value={brandColor} onChange={e => setBrandColor(e.target.value)} className="h-9 w-12 p-0 border-none cursor-pointer" />
                    <Input value={brandColor} readOnly className="h-9 text-xs font-mono w-full" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Company Logo</Label>
                  <Button type="button" variant="outline" size="sm" className="h-9 w-full text-xs gap-1">
                    <Image className="h-3.5 w-3.5" /> Upload Logo
                  </Button>
                </div>
              </div>

              <Button type="submit" size="sm" className="w-full text-xs">
                Save Portal Config
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Live Portal Preview Mock */}
        <Card className="shadow-xs border-border/80 lg:col-span-2">
          <CardHeader className="pb-3 border-b border-border/60 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Laptop className="h-4 w-4 text-emerald-600" /> Public Portal Preview
              </CardTitle>
              <CardDescription className="text-xs">
                Real-time visual rendering of how applicants see your careers portal
              </CardDescription>
            </div>
            <Button size="sm" variant="ghost" className="h-8 text-xs gap-1 text-primary" onClick={() => window.open(portalUrl, '_blank')}>
              <ExternalLink className="h-3.5 w-3.5" /> Live Site
            </Button>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 bg-muted/30">
            <div className="rounded-xl border border-border/60 bg-background overflow-hidden shadow-xs">
              {/* Mock Header */}
              <div className="p-4 border-b border-border/40 flex items-center justify-between">
                <span className="font-semibold text-sm text-foreground flex items-center gap-1.5">
                  <Globe className="h-4 w-4 text-primary" /> StockPulse Careers
                </span>
                <Badge variant="outline" className="text-[9.5px]">6 Live Jobs</Badge>
              </div>

              {/* Mock Welcome Banner */}
              <div className="p-6 text-center border-b border-border/40 bg-gradient-to-br from-primary/5 to-transparent">
                <h4 className=" text-base font-semibold text-foreground">{welcomeText}</h4>
                <p className="text-xs text-muted-foreground mt-1">Explore current openings and build the future of payroll telemetry with us.</p>
              </div>

              {/* Mock Listings */}
              <div className="p-4 space-y-2">
                {publicJobs.slice(0, 2).map(j => (
                  <div key={j.id} className="p-3 border border-border/40 rounded-lg flex items-center justify-between text-xs hover:border-primary transition-colors">
                    <div>
                      <span className="font-semibold text-foreground block">{j.title}</span>
                      <span className="text-[10px] text-muted-foreground">{j.dept} • {j.location}</span>
                    </div>
                    <Button size="sm" variant="outline" className="text-[10px] font-semibold h-7">Apply Now</Button>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── 2. Job Listings Management Table ── */}
      <Card className="shadow-xs border-border/80">
        <CardHeader className="pb-3 border-b border-border/60">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Globe className="h-4 w-4 text-primary" /> Public Careers Site Listings
              </CardTitle>
              <CardDescription className="text-xs">
                Synchronize, publish or unpublish open ATS requisitions directly to public search engines
              </CardDescription>
            </div>
            <Button size="sm" variant="outline" className="h-8 text-xs gap-1.5" onClick={() => toast.success('Syncing with LinkedIn & Indeed...')}>
              <TrendingUp className="h-3.5 w-3.5" /> Sync Jobs
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs">Job Code</TableHead>
                <TableHead className="text-xs">Published Title</TableHead>
                <TableHead className="text-xs">Department</TableHead>
                <TableHead className="text-xs">Location & Type</TableHead>
                <TableHead className="text-xs">Site Views</TableHead>
                <TableHead className="text-xs">Applicants</TableHead>
                <TableHead className="text-xs">Visibility Status</TableHead>
                <TableHead className="text-right text-xs">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {publicJobs.map(j => (
                <TableRow key={j.id} className="hover:bg-muted/40 transition-colors">
                  <TableCell className="font-mono text-xs font-semibold text-primary">{j.id}</TableCell>
                  <TableCell className="text-xs font-semibold text-foreground">{j.title}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{j.dept}</TableCell>
                  <TableCell className="text-xs font-medium">{j.location} ({j.type})</TableCell>
                  <TableCell className="text-xs font-mono font-semibold">{j.portalViews} views</TableCell>
                  <TableCell className="text-xs font-mono font-semibold text-emerald-600">+{j.applicants} Applicants</TableCell>
                  <TableCell className="text-xs">
                    <Badge className={j.status === 'Published' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' : 'bg-muted text-muted-foreground'}>
                      {j.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right flex items-center justify-end gap-1">
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground" onClick={() => handleCopyLink(portalUrl)} title="Copy Job URL">
                      <Copy className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground" onClick={() => toggleStatus(j.id)} title="Toggle Visibility">
                      <Eye className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive">
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
