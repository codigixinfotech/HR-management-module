import React, { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
  Scale,
  Plus,
  Trash2,
  Edit2,
  Search,
  Check,
  Loader2,
  Layers,
  X,
} from 'lucide-react';
import { capacityUomApi, type CapacityUomItem } from '@/api/machine-management';

interface CapacityUomMasterModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedUom?: string;
  onSelectUom?: (uomName: string) => void;
  companyId?: string;
}

export function CapacityUomMasterModal({
  open,
  onOpenChange,
  selectedUom,
  onSelectUom,
  companyId,
}: CapacityUomMasterModalProps) {
  const [items, setItems] = useState<CapacityUomItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Add Form State
  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [savingAdd, setSavingAdd] = useState(false);

  // Edit Form State
  const [editingItem, setEditingItem] = useState<CapacityUomItem | null>(null);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);

  // Deleting State
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadItems = useCallback(async () => {
    setLoading(true);
    try {
      const data = await capacityUomApi.list({ companyId });
      setItems(data || []);
    } catch (err: any) {
      console.error('Failed to load capacity UOMs from backend:', err);
      toast.error(err.response?.data?.message || 'Failed to load Capacity UOMs');
    } finally {
      setLoading(false);
    }
  }, [companyId]);

  useEffect(() => {
    if (open) {
      loadItems();
      setShowAddForm(false);
      setEditingItem(null);
    }
  }, [open, loadItems]);

  const notifyChange = () => {
    window.dispatchEvent(new Event('fhcm_uom_master_updated'));
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) {
      toast.error('UOM Name is required');
      return;
    }

    setSavingAdd(true);
    try {
      const created = await capacityUomApi.create({
        name: newName.trim(),
        description: newDescription.trim() || undefined,
        companyId,
      });

      toast.success(`Capacity UOM "${created.name}" created successfully`);
      setNewName('');
      setNewDescription('');
      setShowAddForm(false);
      await loadItems();
      notifyChange();

      if (onSelectUom) {
        onSelectUom(created.name);
        onOpenChange(false);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || 'Failed to create Capacity UOM');
    } finally {
      setSavingAdd(false);
    }
  };

  const startEdit = (item: CapacityUomItem) => {
    setEditingItem(item);
    setEditName(item.name);
    setEditDescription(item.description || '');
    setShowAddForm(false);
  };

  const cancelEdit = () => {
    setEditingItem(null);
    setEditName('');
    setEditDescription('');
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;
    if (!editName.trim()) {
      toast.error('UOM Name cannot be empty');
      return;
    }

    setSavingEdit(true);
    try {
      const updated = await capacityUomApi.update(editingItem.id, {
        name: editName.trim(),
        description: editDescription.trim() || undefined,
      });

      toast.success(`Capacity UOM "${updated.name}" updated successfully`);
      cancelEdit();
      await loadItems();
      notifyChange();

      if (selectedUom === editingItem.name && onSelectUom) {
        onSelectUom(updated.name);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || 'Failed to update Capacity UOM');
    } finally {
      setSavingEdit(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    setDeletingId(id);
    try {
      await capacityUomApi.delete(id);
      toast.success(`Capacity UOM "${name}" deleted successfully`);
      await loadItems();
      notifyChange();
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || 'Failed to delete Capacity UOM');
    } finally {
      setDeletingId(null);
    }
  };

  const filteredItems = items.filter((item) => {
    const q = searchTerm.toLowerCase().trim();
    return (
      !q ||
      item.name.toLowerCase().includes(q) ||
      (item.description && item.description.toLowerCase().includes(q))
    );
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[88vh] flex flex-col p-0 overflow-hidden">
        {/* Header */}
        <DialogHeader className="px-6 pt-5 pb-3 border-b bg-muted/20">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
              <Scale className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold">Capacity UOM Master</DialogTitle>
              <DialogDescription className="text-xs">
                Configure universal Units of Measure stored directly in your backend database.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* Controls: Search & Add Button */}
          <div className="flex items-center justify-between gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Search UOMs by name or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 h-9 text-xs"
              />
            </div>

            <Button
              size="sm"
              onClick={() => {
                setShowAddForm(!showAddForm);
                if (editingItem) cancelEdit();
              }}
              className="h-9 gap-1 text-xs shrink-0"
            >
              {showAddForm ? (
                <>
                  <X className="h-3.5 w-3.5" /> Cancel
                </>
              ) : (
                <>
                  <Plus className="h-3.5 w-3.5" /> Add UOM
                </>
              )}
            </Button>
          </div>

          {/* Add New UOM Form Panel */}
          {showAddForm && (
            <form
              onSubmit={handleCreate}
              className="p-4 rounded-xl border-2 border-primary/20 bg-primary/5 space-y-3 animate-in fade-in-50 duration-200"
            >
              <div className="flex items-center justify-between border-b pb-2">
                <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <Plus className="h-3.5 w-3.5 text-primary" />
                  Define New Capacity Unit of Measure
                </h4>
                <Badge variant="outline" className="text-[10px] bg-background">
                  Master Entry
                </Badge>
              </div>

              <div className="space-y-3 pt-1">
                <div className="space-y-1">
                  <Label htmlFor="new-uom-name" className="text-xs font-medium">
                    UOM Name / Symbol *
                  </Label>
                  <Input
                    id="new-uom-name"
                    placeholder="e.g. Beds, Patients / Day, Units / Hour, Rooms, Kg / Day, Cycles / Min"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="h-8 text-xs bg-background"
                    required
                    autoFocus
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="new-uom-desc" className="text-xs font-medium">
                    Description & Operating Notes (Optional)
                  </Label>
                  <Input
                    id="new-uom-desc"
                    placeholder="e.g. Inpatient ward capacity, outpatient consultation throughput, machine batch units..."
                    value={newDescription}
                    onChange={(e) => setNewDescription(e.target.value)}
                    className="h-8 text-xs bg-background"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-8 text-xs"
                  onClick={() => setShowAddForm(false)}
                  disabled={savingAdd}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  className="h-8 text-xs font-semibold gap-1.5"
                  disabled={savingAdd}
                >
                  {savingAdd ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" /> Saving...
                    </>
                  ) : (
                    'Save to UOM Master'
                  )}
                </Button>
              </div>
            </form>
          )}

          {/* Edit UOM Form Panel */}
          {editingItem && (
            <form
              onSubmit={handleUpdate}
              className="p-4 rounded-xl border-2 border-amber-500/30 bg-amber-500/5 space-y-3 animate-in fade-in-50 duration-200"
            >
              <div className="flex items-center justify-between border-b pb-2">
                <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5 text-amber-700 dark:text-amber-400">
                  <Edit2 className="h-3.5 w-3.5 text-amber-600" />
                  Edit Capacity Unit of Measure: {editingItem.name}
                </h4>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-muted-foreground"
                  onClick={cancelEdit}
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>

              <div className="space-y-3 pt-1">
                <div className="space-y-1">
                  <Label htmlFor="edit-uom-name" className="text-xs font-medium">
                    UOM Name / Symbol *
                  </Label>
                  <Input
                    id="edit-uom-name"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="h-8 text-xs bg-background"
                    required
                    autoFocus
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="edit-uom-desc" className="text-xs font-medium">
                    Description & Operating Notes (Optional)
                  </Label>
                  <Input
                    id="edit-uom-desc"
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    className="h-8 text-xs bg-background"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-8 text-xs"
                  onClick={cancelEdit}
                  disabled={savingEdit}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  className="h-8 text-xs font-semibold gap-1.5"
                  disabled={savingEdit}
                >
                  {savingEdit ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" /> Updating...
                    </>
                  ) : (
                    'Update UOM'
                  )}
                </Button>
              </div>
            </form>
          )}

          {/* UOM List / Empty State */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
              <span>Database Entries ({filteredItems.length})</span>
              <span>Click any UOM to select</span>
            </div>

            {loading ? (
              <div className="border rounded-xl p-10 flex flex-col items-center justify-center gap-2 text-muted-foreground bg-card">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                <p className="text-xs">Loading Capacity UOMs from database...</p>
              </div>
            ) : items.length === 0 ? (
              /* Completely Empty State */
              <div className="border-2 border-dashed rounded-xl p-10 flex flex-col items-center justify-center text-center space-y-3 bg-muted/10">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  <Layers className="h-6 w-6" />
                </div>
                <div className="space-y-1 max-w-sm">
                  <h4 className="text-sm font-semibold text-foreground">
                    No Capacity UOMs in Master
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    Your Capacity UOM Master is currently empty. Click{' '}
                    <strong className="text-foreground">"+ Add UOM"</strong> above to define your
                    organization's units (e.g. Beds, Patients / Day, Units / Hour, Rooms, Kg / Day).
                  </p>
                </div>
                <Button
                  size="sm"
                  className="gap-1.5 text-xs font-medium"
                  onClick={() => setShowAddForm(true)}
                >
                  <Plus className="h-3.5 w-3.5" /> Add First UOM
                </Button>
              </div>
            ) : filteredItems.length === 0 ? (
              <div className="border rounded-xl p-8 text-center text-xs text-muted-foreground bg-card">
                No capacity units match your search.
              </div>
            ) : (
              <div className="border rounded-xl divide-y overflow-hidden shadow-2xs bg-card">
                {filteredItems.map((uom) => {
                  const isSelected = selectedUom === uom.name;
                  const isBeingDeleted = deletingId === uom.id;
                  return (
                    <div
                      key={uom.id}
                      className={`flex items-center justify-between p-3 transition-colors ${
                        isSelected ? 'bg-primary/5' : 'hover:bg-muted/40'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="h-8 w-8 rounded-md bg-muted/60 flex items-center justify-center shrink-0 text-muted-foreground">
                          <Scale className="h-4 w-4 text-primary" />
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-foreground">
                              {uom.name}
                            </span>
                          </div>
                          {uom.description && (
                            <p className="text-[11px] text-muted-foreground truncate pt-0.5">
                              {uom.description}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0 ml-3">
                        {onSelectUom && (
                          <Button
                            size="sm"
                            variant={isSelected ? 'default' : 'outline'}
                            className="h-7 text-xs px-2.5 font-medium mr-1"
                            onClick={() => {
                              onSelectUom(uom.name);
                              onOpenChange(false);
                            }}
                          >
                            {isSelected ? (
                              <>
                                <Check className="h-3 w-3 mr-1" /> Selected
                              </>
                            ) : (
                              'Select'
                            )}
                          </Button>
                        )}

                        {/* Edit Button */}
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7 text-muted-foreground hover:text-foreground hover:bg-muted"
                          onClick={() => startEdit(uom)}
                          title="Edit UOM"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </Button>

                        {/* Delete Button */}
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7 text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                          onClick={() => handleDelete(uom.id, uom.name)}
                          disabled={isBeingDeleted}
                          title="Delete UOM"
                        >
                          {isBeingDeleted ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Trash2 className="h-3.5 w-3.5" />
                          )}
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="px-6 py-3 border-t bg-muted/20 flex items-center justify-between">
          <span className="text-[11px] text-muted-foreground">
            {items.length} {items.length === 1 ? 'unit' : 'units'} in database
          </span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="text-xs"
          >
            Close Master
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
