import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Switch } from '@/components/ui/switch';
import { Trash2, Edit, Plus, Building2, ArrowLeft, GraduationCap, Monitor } from 'lucide-react';
import { Lab } from '@shared/types';

export default function LabManagement() {
  const [labs, setLabs] = useState<Lab[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingLab, setEditingLab] = useState<Lab | null>(null);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    capacity: '',
    equipment: '',
    isActive: true
  });

  useEffect(() => {
    fetchLabs();
  }, []);

  const fetchLabs = async () => {
    try {
      const response = await fetch('/api/admin/labs');
      const result = await response.json();
      if (result.success) {
        setLabs(result.data);
      }
    } catch (error) {
      console.error('Error fetching labs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const equipmentArray = formData.equipment.split(',').map(item => item.trim()).filter(item => item);

    const payload = {
      ...formData,
      capacity: parseInt(formData.capacity),
      equipment: equipmentArray
    };

    const url = editingLab ? `/api/admin/labs/${editingLab._id}` : '/api/admin/labs';
    const method = editingLab ? 'PUT' : 'POST';

    try {
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (result.success) {
        fetchLabs();
        resetForm();
        setShowAddDialog(false);
        setEditingLab(null);
      } else {
        setError(result.message);
      }
    } catch (error) {
      setError('Network error occurred');
    }
  };

  const handleDelete = async (labId: string) => {
    if (!confirm('Are you sure you want to delete this lab?')) return;

    try {
      const response = await fetch(`/api/admin/labs/${labId}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (result.success) {
        fetchLabs();
      } else {
        setError(result.message);
      }
    } catch (error) {
      setError('Network error occurred');
    }
  };

  const handleEdit = (lab: Lab) => {
    setFormData({
      name: lab.name,
      capacity: lab.capacity.toString(),
      equipment: lab.equipment?.join(', ') || '',
      isActive: lab.isActive
    });
    setEditingLab(lab);
    setShowAddDialog(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      capacity: '',
      equipment: '',
      isActive: true
    });
    setError('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5">
      {/* Header */}
      <header className="bg-card/80 backdrop-blur-sm border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <GraduationCap className="w-5 h-5 text-primary-foreground" />
              </div>
              <h1 className="text-xl font-bold text-foreground">AI Department Lab System</h1>
            </div>
            <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold text-foreground mb-2">Laboratory Management</h2>
              <p className="text-muted-foreground">
                Manage AI department laboratory resources and configurations
              </p>
            </div>
            
            <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
              <DialogTrigger asChild>
                <Button onClick={resetForm}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Lab
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>
                    {editingLab ? 'Edit Laboratory' : 'Add New Laboratory'}
                  </DialogTitle>
                  <DialogDescription>
                    {editingLab ? 'Update laboratory information' : 'Create a new laboratory facility'}
                  </DialogDescription>
                </DialogHeader>
                
                <form onSubmit={handleSubmit} className="space-y-4">
                  {error && (
                    <Alert className="border-destructive/50 bg-destructive/10">
                      <AlertDescription className="text-destructive">{error}</AlertDescription>
                    </Alert>
                  )}
                  
                  <div className="space-y-2">
                    <Label htmlFor="name">Lab Name</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="capacity">Capacity</Label>
                    <Input
                      id="capacity"
                      type="number"
                      min="1"
                      value={formData.capacity}
                      onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="equipment">Equipment (comma-separated)</Label>
                    <Input
                      id="equipment"
                      value={formData.equipment}
                      onChange={(e) => setFormData({ ...formData, equipment: e.target.value })}
                      placeholder="e.g., GPUs, Workstations, Servers"
                    />
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="isActive"
                      checked={formData.isActive}
                      onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                    />
                    <Label htmlFor="isActive">Active</Label>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button type="submit" className="flex-1">
                      {editingLab ? 'Update Lab' : 'Create Lab'}
                    </Button>
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => {
                        setShowAddDialog(false);
                        setEditingLab(null);
                        resetForm();
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Labs Table */}
        <Card className="border-0 bg-card/60 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5" />
              AI Department Labs ({labs.length})
            </CardTitle>
            <CardDescription>
              Laboratory facilities serving as computer centers for the AI department
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="text-muted-foreground mt-2">Loading labs...</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Lab Name</TableHead>
                    <TableHead>Capacity</TableHead>
                    <TableHead>Equipment</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {labs.map((lab) => (
                    <TableRow key={lab._id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <Monitor className="w-4 h-4 text-muted-foreground" />
                          {lab.name}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {lab.capacity} students
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-xs">
                        <div className="flex flex-wrap gap-1">
                          {lab.equipment?.slice(0, 2).map((item, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {item}
                            </Badge>
                          ))}
                          {lab.equipment && lab.equipment.length > 2 && (
                            <Badge variant="secondary" className="text-xs">
                              +{lab.equipment.length - 2} more
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={lab.isActive ? 'bg-success text-success-foreground' : 'bg-destructive text-destructive-foreground'}>
                          {lab.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {lab.createdAt ? new Date(lab.createdAt).toLocaleDateString() : 'N/A'}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-2 justify-end">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(lab)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(lab._id!)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
