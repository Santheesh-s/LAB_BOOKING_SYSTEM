import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Trash2, Edit, Plus, Users, ArrowLeft, GraduationCap, Eye, EyeOff, Search, Filter, X, Download } from 'lucide-react';
import { User, UserRole, Lab, Club } from '@shared/types';

export default function UserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [labs, setLabs] = useState<Lab[]>([]);
  const [clubs, setClubs] = useState<Club[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [assignmentFilter, setAssignmentFilter] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: '' as UserRole,
    labId: '',
    clubId: ''
  });

  useEffect(() => {
    fetchUsers();
    fetchLabs();
    fetchClubs();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/users');
      const result = await response.json();
      if (result.success) {
        setUsers(result.data);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchLabs = async () => {
    try {
      const response = await fetch('/api/labs');
      const result = await response.json();
      if (result.success) {
        setLabs(result.data);
      }
    } catch (error) {
      console.error('Error fetching Labs:', error);
    }
  };

  const fetchClubs = async () => {
    try {
      const response = await fetch('/api/user-clubs');
      const result = await response.json();
      if (result.success) {
        setClubs(result.data);
      }
    } catch (error) {
      console.error('Error fetching Clubs:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const url = editingUser ? `/api/users/${editingUser._id}` : '/api/users';
    const method = editingUser ? 'PUT' : 'POST';

    // Prepare form data - exclude password for updates if it's empty
    const submitData = { ...formData };
    if (editingUser && !formData.password) {
      delete submitData.password;
    }

    try {
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submitData),
      });

      const result = await response.json();

      if (result.success) {
        fetchUsers();
        resetForm();
        setShowAddDialog(false);
        setEditingUser(null);
      } else {
        setError(result.message);
      }
    } catch (error) {
      setError('Network error occurred');
    }
  };

  const handleDelete = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user?')) return;

    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (result.success) {
        fetchUsers();
      } else {
        setError(result.message);
      }
    } catch (error) {
      setError('Network error occurred');
    }
  };

  const handleEdit = (user: User) => {
    setFormData({
      name: user.name,
      email: user.email,
      password: '',
      role: user.role,
      labId: user.labId || '',
      clubId: user.clubId || ''
    });
    setEditingUser(user);
    setShowAddDialog(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      password: '',
      role: '' as UserRole,
      labId: '',
      clubId: ''
    });
    setError('');
  };

  const getRoleColor = (role: UserRole) => {
    const colors = {
      admin: 'bg-destructive text-destructive-foreground',
      faculty: 'bg-primary text-primary-foreground',
      lab_incharge: 'bg-info text-info-foreground',
      club_member: 'bg-secondary text-secondary-foreground',
      club_executive: 'bg-accent text-accent-foreground',
      club_secretary: 'bg-warning text-warning-foreground',
      club_incharge: 'bg-success text-success-foreground',
    };
    return colors[role] || 'bg-muted text-muted-foreground';
  };

  const getRoleLabel = (role: UserRole) => {
    const labels = {
      admin: 'Administrator',
      faculty: 'Faculty',
      lab_incharge: 'Lab Incharge',
      club_member: 'Club Member',
      club_executive: 'Club Executive',
      club_secretary: 'Club Secretary',
      club_incharge: 'Club Incharge',
    };
    return labels[role] || role;
  };

  const isClubRole = (role: UserRole) => {
    return ['club_member', 'club_executive', 'club_secretary', 'club_incharge'].includes(role);
  };

  // Filter users based on search and filters
  const getFilteredUsers = () => {
    return users.filter(user => {
      // Search term filter (name, email)
      const searchMatch = !searchTerm ||
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase());

      // Role filter
      const roleMatch = roleFilter === 'all' || user.role === roleFilter;

      // Assignment filter
      let assignmentMatch = true;
      if (assignmentFilter === 'lab_assigned') {
        assignmentMatch = !!user.labId;
      } else if (assignmentFilter === 'club_assigned') {
        assignmentMatch = !!user.clubId;
      } else if (assignmentFilter === 'unassigned') {
        assignmentMatch = !user.labId && !user.clubId;
      }

      return searchMatch && roleMatch && assignmentMatch;
    });
  };

  const clearFilters = () => {
    setSearchTerm('');
    setRoleFilter('all');
    setAssignmentFilter('all');
  };

  const hasActiveFilters = () => {
    return searchTerm !== '' || roleFilter !== 'all' || assignmentFilter !== 'all';
  };

  const exportUsers = () => {
    const exportData = {
      exportedAt: new Date().toISOString(),
      totalUsers: users.length,
      filteredUsers: getFilteredUsers().length,
      filters: {
        searchTerm,
        roleFilter,
        assignmentFilter
      },
      users: getFilteredUsers().map(user => ({
        name: user.name,
        email: user.email,
        role: getRoleLabel(user.role),
        assignment: user.labId ? `Lab: ${labs.find(lab => lab._id === user.labId)?.name || 'Unknown'}` :
                   user.clubId ? `Club: ${clubs.find(club => club._id === user.clubId)?.name || 'Unknown'}` :
                   'Not assigned',
        createdAt: user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'
      }))
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `users-export-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
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
              <h2 className="text-3xl font-bold text-foreground mb-2">User Management</h2>
              <p className="text-muted-foreground">
                Manage system users, roles, and permissions for the AI department
              </p>
            </div>
            
            <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
              <DialogTrigger asChild>
                <Button onClick={resetForm}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add User
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>
                    {editingUser ? 'Edit User' : 'Add New User'}
                  </DialogTitle>
                  <DialogDescription>
                    {editingUser ? 'Update user information' : 'Create a new user account'}
                  </DialogDescription>
                </DialogHeader>
                
                <form onSubmit={handleSubmit} className="space-y-4">
                  {error && (
                    <Alert className="border-destructive/50 bg-destructive/10">
                      <AlertDescription className="text-destructive">{error}</AlertDescription>
                    </Alert>
                  )}
                  
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      required
                    />
                  </div>
                  
                  {!editingUser && (
                    <div className="space-y-2">
                      <Label htmlFor="password">Password</Label>
                      <div className="relative">
                        <Input
                          id="password"
                          type={showPassword ? "text" : "password"}
                          value={formData.password}
                          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                          required
                          placeholder="Enter password for new user"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </Button>
                      </div>
                    </div>
                  )}

                  {editingUser && (
                    <Alert className="border-blue-200 bg-blue-50">
                      <AlertDescription className="text-blue-700">
                        Password will remain unchanged when updating user information. To change password, please use a separate password reset function.
                      </AlertDescription>
                    </Alert>
                  )}
                  
                  <div className="space-y-2">
                    <Label htmlFor="role">Role</Label>
                    <Select value={formData.role} onValueChange={(value) => setFormData({ ...formData, role: value as UserRole, labId: '', clubId: '' })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">Administrator</SelectItem>
                        <SelectItem value="faculty">Faculty</SelectItem>
                        <SelectItem value="lab_incharge">Lab Incharge</SelectItem>
                        <SelectItem value="club_member">Club Member</SelectItem>
                        <SelectItem value="club_executive">Club Executive</SelectItem>
                        <SelectItem value="club_secretary">Club Secretary</SelectItem>
                        <SelectItem value="club_incharge">Club Incharge</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {formData.role === 'lab_incharge' && (
                    <div className="space-y-2">
                      <Label htmlFor="labId">Assigned Lab</Label>
                      <Select value={formData.labId} onValueChange={(value) => setFormData({ ...formData, labId: value })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select Lab" />
                        </SelectTrigger>
                        <SelectContent>
                          {labs.map((lab) => (
                            <SelectItem key={lab._id} value={lab._id!}>{lab.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {isClubRole(formData.role) && (
                    <div className="space-y-2">
                      <Label htmlFor="clubId">Club</Label>
                      <Select value={formData.clubId} onValueChange={(value) => setFormData({ ...formData, clubId: value })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select Club" />
                        </SelectTrigger>
                        <SelectContent>
                          {clubs.map((club) => (
                            <SelectItem key={club._id} value={club._id!}>{club.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  
                  <div className="flex gap-2">
                    <Button type="submit" className="flex-1">
                      {editingUser ? 'Update User' : 'Create User'}
                    </Button>
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => {
                        setShowAddDialog(false);
                        setEditingUser(null);
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

        {/* User Statistics Summary */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card className="border border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-700">Total Users</p>
                  <p className="text-2xl font-bold text-blue-900">{users.length}</p>
                </div>
                <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                  <Users className="w-5 h-5 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-green-200 bg-gradient-to-br from-green-50 to-green-100">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-700">Lab Assigned</p>
                  <p className="text-2xl font-bold text-green-900">{users.filter(u => u.labId).length}</p>
                </div>
                <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                  <GraduationCap className="w-5 h-5 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-purple-200 bg-gradient-to-br from-purple-50 to-purple-100">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-purple-700">Club Members</p>
                  <p className="text-2xl font-bold text-purple-900">{users.filter(u => u.clubId).length}</p>
                </div>
                <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center">
                  <Users className="w-5 h-5 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-orange-200 bg-gradient-to-br from-orange-50 to-orange-100">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-orange-700">Admins</p>
                  <p className="text-2xl font-bold text-orange-900">{users.filter(u => u.role === 'admin').length}</p>
                </div>
                <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center">
                  <GraduationCap className="w-5 h-5 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filter Controls */}
        <Card className="border-0 bg-card/60 backdrop-blur-sm mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Search className="w-5 h-5" />
                Search & Filter Users
              </CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2"
              >
                <Filter className="w-4 h-4" />
                {showFilters ? 'Hide Filters' : 'Show Filters'}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Search Bar */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Search by name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-10"
                />
                {searchTerm && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSearchTerm('')}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </div>

              {/* Advanced Filters */}
              {showFilters && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t">
                  <div className="space-y-2">
                    <Label htmlFor="roleFilter">Filter by Role</Label>
                    <Select value={roleFilter} onValueChange={setRoleFilter}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Roles</SelectItem>
                        <SelectItem value="admin">Administrator</SelectItem>
                        <SelectItem value="faculty">Faculty</SelectItem>
                        <SelectItem value="lab_incharge">Lab Incharge</SelectItem>
                        <SelectItem value="club_member">Club Member</SelectItem>
                        <SelectItem value="club_executive">Club Executive</SelectItem>
                        <SelectItem value="club_secretary">Club Secretary</SelectItem>
                        <SelectItem value="club_incharge">Club Incharge</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="assignmentFilter">Filter by Assignment</Label>
                    <Select value={assignmentFilter} onValueChange={setAssignmentFilter}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Users</SelectItem>
                        <SelectItem value="lab_assigned">Lab Assigned</SelectItem>
                        <SelectItem value="club_assigned">Club Assigned</SelectItem>
                        <SelectItem value="unassigned">Unassigned</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-end">
                    {hasActiveFilters() && (
                      <Button
                        variant="outline"
                        onClick={clearFilters}
                        className="w-full flex items-center gap-2"
                      >
                        <X className="w-4 h-4" />
                        Clear Filters
                      </Button>
                    )}
                  </div>
                </div>
              )}

              {/* Filter Results Summary */}
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>
                  Showing {getFilteredUsers().length} of {users.length} users
                  {hasActiveFilters() && ' (filtered)'}
                </span>
                {hasActiveFilters() && (
                  <div className="flex items-center gap-2">
                    <span>Active filters:</span>
                    {searchTerm && (
                      <Badge variant="secondary" className="text-xs">
                        Search: "{searchTerm}"
                      </Badge>
                    )}
                    {roleFilter !== 'all' && (
                      <Badge variant="secondary" className="text-xs">
                        Role: {getRoleLabel(roleFilter as UserRole)}
                      </Badge>
                    )}
                    {assignmentFilter !== 'all' && (
                      <Badge variant="secondary" className="text-xs">
                        Assignment: {assignmentFilter.replace('_', ' ')}
                      </Badge>
                    )}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Users Table */}
        <Card className="border-0 bg-card/60 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              System Users ({getFilteredUsers().length})
            </CardTitle>
            <CardDescription>
              {hasActiveFilters()
                ? `Filtered results from ${users.length} total users in the AI department lab booking system`
                : `All registered users in the AI department lab booking system`
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="text-muted-foreground mt-2">Loading users...</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Assignment</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {getFilteredUsers().length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8">
                        <div className="flex flex-col items-center gap-2">
                          <Search className="w-8 h-8 text-muted-foreground opacity-50" />
                          <p className="text-muted-foreground">
                            {hasActiveFilters() ? 'No users match your search criteria' : 'No users found'}
                          </p>
                          {hasActiveFilters() && (
                            <Button variant="outline" size="sm" onClick={clearFilters}>
                              Clear Filters
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    getFilteredUsers().map((user) => (
                      <TableRow key={user._id}>
                        <TableCell className="font-medium">{user.name}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                          <Badge className={`${getRoleColor(user.role)} text-xs`}>
                            {getRoleLabel(user.role)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {user.labId ? (
                            <span className="text-info">Lab: {labs.find(lab => lab._id === user.labId)?.name || 'Unknown'}</span>
                          ) : user.clubId ? (
                            <span className="text-accent">Club: {clubs.find(club => club._id === user.clubId)?.name || 'Unknown'}</span>
                          ) : (
                            <span className="text-muted-foreground">Not assigned</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex gap-2 justify-end">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(user)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(user._id!)}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
