import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Plus, ShieldCheck } from 'lucide-react';
import { rolesApi } from '@/api/administration';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

export function RolesTab() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [selectedPermissionIds, setSelectedPermissionIds] = useState<string[]>([]);

  const { data: roles, isLoading } = useQuery({ queryKey: ['roles'], queryFn: rolesApi.list });
  const { data: permissions } = useQuery({ queryKey: ['permissions-catalog'], queryFn: rolesApi.permissionsCatalog });

  const createMutation = useMutation({
    mutationFn: () => rolesApi.create({ name, permissionIds: selectedPermissionIds }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      toast.success('Role created');
      setOpen(false);
      setName('');
      setSelectedPermissionIds([]);
    },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? 'Something went wrong'),
  });

  const permissionsByModule = (permissions ?? []).reduce<Record<string, typeof permissions>>((acc, p) => {
    acc[p.module] = acc[p.module] ?? [];
    acc[p.module]!.push(p);
    return acc;
  }, {});

  const togglePermission = (id: string) => {
    setSelectedPermissionIds((prev) => (prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]));
  };

  return (
    <Card className="shadow-2xs">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-base font-semibold">Roles & Permissions</CardTitle>
          <CardDescription>Role-based access control groups and their assigned permission sets</CardDescription>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="mr-1.5 h-4 w-4" /> Add Role
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add Role</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label>Role Name</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div className="max-h-80 space-y-3 overflow-y-auto">
                {Object.entries(permissionsByModule).map(([module, perms]) => (
                  <div key={module}>
                    <p className="mb-1 text-xs font-semibold uppercase text-muted-foreground">{module}</p>
                    <div className="flex flex-wrap gap-2">
                      {perms?.map((p) => (
                        <button
                          type="button"
                          key={p.id}
                          onClick={() => togglePermission(p.id)}
                          className="focus:outline-none"
                        >
                          <Badge variant={selectedPermissionIds.includes(p.id) ? 'default' : 'outline'} className="text-[10px]">
                            {p.action}
                          </Badge>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <DialogFooter>
              <Button disabled={!name || createMutation.isPending} onClick={() => createMutation.mutate()}>
                Create role
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {isLoading && <p className="text-xs text-muted-foreground">Loading...</p>}
          {roles?.map((role) => (
            <div key={role.id} className="rounded-lg border p-4">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-primary" />
                <p className="text-sm font-semibold text-foreground">{role.name}</p>
                {role.isSystem && (
                  <Badge variant="outline" className="text-[10px]">
                    System
                  </Badge>
                )}
              </div>
              <p className="mt-1.5 text-xs text-muted-foreground">{role.permissions.length} permission(s)</p>
            </div>
          ))}
          {roles && roles.length === 0 && (
            <p className="text-xs text-muted-foreground">No roles configured yet.</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
