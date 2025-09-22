import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Trash2, Edit, Plus, Users, ArrowLeft, GraduationCap, BookOpen } from 'lucide-react';
import { Club } from '@shared/types';

export default function ClubManagement() {
  const [clubs, setClubs] = useState<Club[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingClub, setEditingClub] = useState<Club | null>(null);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    description: ''
  });

  useEffect(() => {
    fetchClubs();
  }, []);

  const fetchClubs = async () => {
    try {
      const response = await fetch('/api/clubs');
      const result = await response.json();
      if (result.success) {
        setClubs(result.data);
      }
    } catch (error) {
      console.error('Error fetching clubs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const url = editingClub ? `/api/clubs/${editingClub._id}` : '/api/clubs';
    const method = editingClub ? 'PUT' : 'POST';

    try {
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (result.success) {
        fetchClubs();
        resetForm();
        setShowAddDialog(false);
        setEditingClub(null);
      } else {
        setError(result.message);
      }
    } catch (error) {
      setError('Network error occurred');
    }
  };

  const handleDelete = async (clubId: string) => {
    if (!confirm('Are you sure you want to delete this club?')) return;

    try {
      const response = await fetch(`/api/clubs/${clubId}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (result.success) {
        fetchClubs();
      } else {
        setError(result.message);
      }
    } catch (error) {
      setError('Network error occurred');
    }
  };

  const handleEdit = (club: Club) => {
    setFormData({
      name: club.name,
      description: club.description || ''
    });
    setEditingClub(club);
    setShowAddDialog(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: ''
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
              <h2 className="text-3xl font-bold text-foreground mb-2">Club Management</h2>
              <p className="text-muted-foreground">
                Manage student clubs and organizations in the AI department
              </p>
            </div>
            
            <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
              <DialogTrigger asChild>
                <Button onClick={resetForm}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Club
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>
                    {editingClub ? 'Edit Club' : 'Add New Club'}
                  </DialogTitle>
                  <DialogDescription>
                    {editingClub ? 'Update club information' : 'Create a new student club'}
                  </DialogDescription>
                </DialogHeader>
                
                <form onSubmit={handleSubmit} className="space-y-4">
                  {error && (
                    <Alert className="border-destructive/50 bg-destructive/10">
                      <AlertDescription className="text-destructive">{error}</AlertDescription>
                    </Alert>
                  )}
                  
                  <div className="space-y-2">
                    <Label htmlFor="name">Club Name</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      rows={3}
                    />
                  </div>
                  
                  <div className="flex gap-2">
                    <Button type="submit" className="flex-1">
                      {editingClub ? 'Update Club' : 'Create Club'}
                    </Button>
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => {
                        setShowAddDialog(false);
                        setEditingClub(null);
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

        {/* Clubs Table */}
        <Card className="border-0 bg-card/60 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="w-5 h-5" />
              AI Department Clubs ({clubs.length})
            </CardTitle>
            <CardDescription>
              Student clubs and organizations in the AI department
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="text-muted-foreground mt-2">Loading clubs...</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Club Name</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Members</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {clubs.map((club) => (
                    <TableRow key={club._id}>
                      <TableCell className="font-medium">{club.name}</TableCell>
                      <TableCell className="max-w-xs truncate">{club.description}</TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {club.members?.length || 0} members
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {club.createdAt ? new Date(club.createdAt).toLocaleDateString() : 'N/A'}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-2 justify-end">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(club)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(club._id!)}
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
