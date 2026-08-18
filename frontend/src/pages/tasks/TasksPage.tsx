import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  CheckSquare,
  LayoutDashboard,
  Building2,
  UserCheck,
  FileText,
  BarChart3,
} from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { TaskDashboardTab } from './TaskDashboardTab';
import { AllTasksTab } from './AllTasksTab';
import { MyTasksTab } from './MyTasksTab';
import { TaskRequestsTab } from './TaskRequestsTab';
import { TaskReportsTab } from './TaskReportsTab';

export default function TasksPage() {
  const { tab } = useParams<{ tab?: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<string>(tab || 'dashboard');

  useEffect(() => {
    if (tab) {
      setActiveTab(tab);
    }
  }, [tab]);

  const handleTabChange = (val: string) => {
    setActiveTab(val);
    navigate(`/tasks/${val}`);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
              <CheckSquare className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-foreground">
                Task Allocation & Employee Task Management
              </h1>
              <p className="text-xs text-muted-foreground">
                Assign tasks to employees, track progress %, submit completions, and conduct manager reviews.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
        <TabsList className="bg-muted/50 p-1 rounded-xl border border-border/50 h-auto flex flex-wrap gap-1">
          <TabsTrigger value="dashboard" className="text-xs gap-1.5 py-2 px-3 data-[state=active]:bg-background shadow-none">
            <LayoutDashboard className="h-3.5 w-3.5" /> Task Dashboard
          </TabsTrigger>
          <TabsTrigger value="my-tasks" className="text-xs gap-1.5 py-2 px-3 data-[state=active]:bg-background shadow-none">
            <UserCheck className="h-3.5 w-3.5 text-primary" /> My Tasks
          </TabsTrigger>
          <TabsTrigger value="all-tasks" className="text-xs gap-1.5 py-2 px-3 data-[state=active]:bg-background shadow-none">
            <Building2 className="h-3.5 w-3.5" /> All Tasks & Allocation
          </TabsTrigger>
          <TabsTrigger value="requests" className="text-xs gap-1.5 py-2 px-3 data-[state=active]:bg-background shadow-none">
            <FileText className="h-3.5 w-3.5" /> Task Requests
          </TabsTrigger>
          <TabsTrigger value="reports" className="text-xs gap-1.5 py-2 px-3 data-[state=active]:bg-background shadow-none">
            <BarChart3 className="h-3.5 w-3.5" /> Task Reports
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="m-0">
          <TaskDashboardTab onSelectTab={handleTabChange} />
        </TabsContent>

        <TabsContent value="my-tasks" className="m-0">
          <MyTasksTab />
        </TabsContent>

        <TabsContent value="all-tasks" className="m-0">
          <AllTasksTab />
        </TabsContent>

        <TabsContent value="requests" className="m-0">
          <TaskRequestsTab />
        </TabsContent>

        <TabsContent value="reports" className="m-0">
          <TaskReportsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
