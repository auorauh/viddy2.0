import { useState } from "react";
import { Edit3, User, Mail, Calendar, Home, Plus, Settings, ExternalLink, LogOut, CreditCard, Bug, HelpCircle, UserPlus, MessageCircleQuestion, Upload, Image, Trash2 } from "lucide-react";
import { NavLink } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { QueryWrapper } from "@/components/common/QueryWrapper";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile, useUpdateProfile, useLogout, useUserStats, useScriptStats } from "@/hooks/api";
import { toast } from "sonner";

const Profile = () => {
  const { user, isAuthenticated } = useAuth();
  const { data: userStats, isLoading: statsLoading, error: statsError } = useUserStats();
  const { data: scriptStats, isLoading: scriptStatsLoading, error: scriptStatsError } = useScriptStats();
  
  const updateProfileMutation = useUpdateProfile();
  const logoutMutation = useLogout();
  
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  
  // Form state for editing
  const [editForm, setEditForm] = useState({
    email: user?.email || "",
    username: user?.username || "",
    profile: {
      firstName: user?.profile?.firstName || "",
      lastName: user?.profile?.lastName || "",
      bio: user?.profile?.bio || "",
      avatar: user?.profile?.avatar || "",
    },
    preferences: {
      defaultProjectView: user?.preferences?.defaultProjectView || 'grid' as 'grid' | 'list',
      theme: user?.preferences?.theme || 'light' as 'light' | 'dark',
    },
  });
  
  // Legacy state for features not yet integrated with API
  const [uploadRate, setUploadRate] = useState(8);
  const [uploadRatePeriod, setUploadRatePeriod] = useState<"day" | "week" | "month" | "year">("month");
  const [customLogo, setCustomLogo] = useState<string | null>(null);
  const [isEditingUploadRate, setIsEditingUploadRate] = useState(false);
  const [tempUploadRate, setTempUploadRate] = useState(uploadRate);
  const [tempUploadRatePeriod, setTempUploadRatePeriod] = useState(uploadRatePeriod);

  const handleSave = async () => {
    try {
      await updateProfileMutation.mutateAsync({
        email: editForm.email,
        username: editForm.username,
        profile: editForm.profile,
        preferences: editForm.preferences,
      });
      
      // Save custom logo to localStorage for persistence
      if (customLogo) {
        localStorage.setItem('customLogo', customLogo);
      } else {
        localStorage.removeItem('customLogo');
      }
      
      setIsEditDialogOpen(false);
      toast.success('Profile updated successfully');
    } catch (error) {
      toast.error('Failed to update profile');
    }
  };

  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setCustomLogo(result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveLogo = () => {
    setCustomLogo(null);
  };

  const handleLogout = async () => {
    try {
      await logoutMutation.mutateAsync();
      toast.success('Logged out successfully');
    } catch (error) {
      toast.error('Failed to logout');
    }
  };

  const handleEditUploadRate = () => {
    setTempUploadRate(uploadRate);
    setTempUploadRatePeriod(uploadRatePeriod);
    setIsEditingUploadRate(true);
  };

  const handleSaveUploadRate = () => {
    setUploadRate(tempUploadRate);
    setUploadRatePeriod(tempUploadRatePeriod);
    setIsEditingUploadRate(false);
  };

  const handleCancelUploadRate = () => {
    setTempUploadRate(uploadRate);
    setTempUploadRatePeriod(uploadRatePeriod);
    setIsEditingUploadRate(false);
  };

  // Show authentication required message if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-semibold mb-2">Authentication Required</h2>
          <p className="text-muted-foreground">Please log in to access your profile.</p>
        </div>
      </div>
    );
  }

  const displayName = editForm.profile.firstName && editForm.profile.lastName 
    ? `${editForm.profile.firstName} ${editForm.profile.lastName}`
    : editForm.username;
  
  const joinDate = user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long' 
  }) : 'Unknown';

  const totalScripts = scriptStats?.totalScripts || 0;
  const totalProjects = userStats?.totalProjects || 0;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="flex-1 p-6">
        <QueryWrapper
          isLoading={statsLoading || scriptStatsLoading}
          error={statsError || scriptStatsError}
          loadingMessage="Loading your profile..."
        >
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Profile Header */}
            <Card className="bg-studio-card border-studio-border">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-6">
                    <Avatar className="w-24 h-24">
                      <AvatarImage src="https://images.unsplash.com/photo-1649972904349-6e44c42644a7?w=200&h=200&fit=crop&crop=face" />
                      <AvatarFallback className="bg-studio-accent text-studio-bg text-2xl">
                        {displayName.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="space-y-2">
                      <h1 className="text-3xl font-bold text-studio-text">{displayName}</h1>
                      <div className="flex items-center space-x-2 text-studio-muted">
                        <Mail className="w-4 h-4" />
                        <span>{editForm.email}</span>
                      </div>
                      <div className="flex items-center space-x-2 text-studio-muted">
                        <Calendar className="w-4 h-4" />
                        <span>Joined {joinDate}</span>
                      </div>
                    </div>
                  </div>
                  
                  <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline" className="bg-studio-bg border-studio-border text-studio-text hover:bg-studio-accent hover:text-studio-bg">
                        <Edit3 className="w-4 h-4 mr-2" />
                        Edit Profile
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="bg-studio-card border-studio-border">
                      <DialogHeader>
                        <DialogTitle className="text-studio-text">Edit Profile</DialogTitle>
                        <DialogDescription className="text-studio-muted">
                          Update your profile information here.
                        </DialogDescription>
                      </DialogHeader>
                      
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="firstName" className="text-studio-text">First Name</Label>
                          <Input
                            id="firstName"
                            value={editForm.profile.firstName}
                            onChange={(e) => setEditForm(prev => ({ 
                              ...prev, 
                              profile: { ...prev.profile, firstName: e.target.value }
                            }))}
                            className="bg-studio-bg border-studio-border text-studio-text"
                          />
                        </div>
                        
                        <div>
                          <Label htmlFor="lastName" className="text-studio-text">Last Name</Label>
                          <Input
                            id="lastName"
                            value={editForm.profile.lastName}
                            onChange={(e) => setEditForm(prev => ({ 
                              ...prev, 
                              profile: { ...prev.profile, lastName: e.target.value }
                            }))}
                            className="bg-studio-bg border-studio-border text-studio-text"
                          />
                        </div>
                        
                        <div>
                          <Label htmlFor="email" className="text-studio-text">Email</Label>
                          <Input
                            id="email"
                            type="email"
                            value={editForm.email}
                            onChange={(e) => setEditForm(prev => ({ ...prev, email: e.target.value }))}
                            className="bg-studio-bg border-studio-border text-studio-text"
                          />
                        </div>
                        
                        <div>
                          <Label htmlFor="username" className="text-studio-text">Username</Label>
                          <Input
                            id="username"
                            value={editForm.username}
                            onChange={(e) => setEditForm(prev => ({ ...prev, username: e.target.value }))}
                            className="bg-studio-bg border-studio-border text-studio-text"
                          />
                        </div>
                        
                        <div>
                          <Label htmlFor="bio" className="text-studio-text">Bio</Label>
                          <Textarea
                            id="bio"
                            rows={4}
                            value={editForm.profile.bio}
                            onChange={(e) => setEditForm(prev => ({ 
                              ...prev, 
                              profile: { ...prev.profile, bio: e.target.value }
                            }))}
                            className="bg-studio-bg border-studio-border text-studio-text resize-none"
                          />
                        </div>
                        
                        <div>
                          <Label className="text-studio-text">Custom Logo</Label>
                          <div className="space-y-3 mt-2">
                            {customLogo ? (
                              <div className="flex items-center space-x-3">
                                <div className="relative">
                                  <img 
                                    src={customLogo} 
                                    alt="Custom logo preview" 
                                    className="w-20 h-12 object-contain bg-white rounded border border-studio-border"
                                  />
                                </div>
                                <div className="flex space-x-2">
                                  <Label htmlFor="logo-upload" className="cursor-pointer">
                                    <Button variant="outline" className="bg-studio-bg border-studio-border text-studio-text hover:bg-studio-muted" asChild>
                                      <span>
                                        <Upload className="w-4 h-4 mr-2" />
                                        Replace
                                      </span>
                                    </Button>
                                  </Label>
                                  <Button 
                                    variant="outline" 
                                    onClick={handleRemoveLogo}
                                    className="bg-red-500/10 border-red-500/30 text-red-400 hover:bg-red-500/20"
                                  >
                                    <Trash2 className="w-4 h-4 mr-2" />
                                    Remove
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <Label htmlFor="logo-upload" className="cursor-pointer">
                                <div className="border-2 border-dashed border-studio-border rounded-lg p-6 text-center hover:border-studio-accent/50 transition-colors">
                                  <Image className="w-8 h-8 mx-auto text-studio-muted mb-2" />
                                  <p className="text-studio-text font-medium">Upload Custom Logo</p>
                                  <p className="text-sm text-studio-muted">Replace the Viddy logo with your own</p>
                                </div>
                              </Label>
                            )}
                            <input
                              id="logo-upload"
                              type="file"
                              accept="image/*"
                              onChange={handleLogoUpload}
                              className="hidden"
                            />
                            <p className="text-xs text-studio-muted">
                              Recommended: PNG or SVG format, max 200KB. Logo will appear in the top right corner.
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      <DialogFooter>
                        <Button
                          variant="outline"
                          onClick={() => setIsEditDialogOpen(false)}
                          className="bg-studio-bg border-studio-border text-studio-text hover:bg-studio-muted"
                        >
                          Cancel
                        </Button>
                        <Button
                          onClick={handleSave}
                          disabled={updateProfileMutation.isPending}
                          className="bg-studio-accent text-studio-bg hover:bg-studio-accent/90"
                        >
                          {updateProfileMutation.isPending ? 'Saving...' : 'Save Changes'}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              
              <CardContent>
                <p className="text-studio-muted leading-relaxed">
                  {editForm.profile.bio || "No bio provided yet."}
                </p>
              </CardContent>
            </Card>

            {/* Stats - Bento Box Layout */}
            <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-6 gap-6">
              <Card className="bg-studio-card border-studio-border md:col-span-2 lg:col-span-2">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-studio-muted text-sm">Total Scripts</p>
                      <p className="text-3xl font-bold text-studio-text">{totalScripts}</p>
                    </div>
                    <Badge variant="secondary" className="bg-studio-accent/20 text-studio-accent">
                      Active
                    </Badge>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-studio-card border-studio-border md:col-span-1 lg:col-span-2">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-studio-muted text-sm">Projects</p>
                      <p className="text-3xl font-bold text-studio-text">{totalProjects}</p>
                    </div>
                    <Badge variant="secondary" className="bg-green-500/20 text-green-400">
                      Completed
                    </Badge>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-studio-card border-studio-border md:col-span-1 lg:col-span-2 cursor-pointer hover:bg-studio-accent/5 transition-colors" onClick={!isEditingUploadRate ? handleEditUploadRate : undefined}>
                <CardContent className="p-6">
                  {!isEditingUploadRate ? (
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-studio-muted text-sm">Upload Rate</p>
                        <p className="text-3xl font-bold text-studio-text">{uploadRate}/{uploadRatePeriod}</p>
                      </div>
                      <Badge variant="secondary" className="bg-blue-500/20 text-blue-400">
                        Target
                      </Badge>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <p className="text-studio-muted text-sm">Upload Rate</p>
                      <div className="flex items-center space-x-2">
                        <Input
                          type="number"
                          value={tempUploadRate}
                          onChange={(e) => setTempUploadRate(Number(e.target.value))}
                          className="bg-studio-bg border-studio-border text-studio-text w-20"
                          min="1"
                        />
                        <span className="text-studio-text">/</span>
                        <Select value={tempUploadRatePeriod} onValueChange={(value: "day" | "week" | "month" | "year") => setTempUploadRatePeriod(value)}>
                          <SelectTrigger className="w-24 bg-studio-bg border-studio-border text-studio-text">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-studio-card border-studio-border">
                            <SelectItem value="day" className="text-studio-text">Day</SelectItem>
                            <SelectItem value="week" className="text-studio-text">Week</SelectItem>
                            <SelectItem value="month" className="text-studio-text">Month</SelectItem>
                            <SelectItem value="year" className="text-studio-text">Year</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          onClick={handleSaveUploadRate}
                          className="bg-studio-accent text-studio-bg hover:bg-studio-accent/90"
                        >
                          Save
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={handleCancelUploadRate}
                          className="bg-studio-bg border-studio-border text-studio-text hover:bg-studio-muted"
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Settings */}
            <Card className="bg-studio-card border-studio-border">
              <CardHeader>
                <CardTitle className="text-studio-text flex items-center space-x-2">
                  <Settings className="w-5 h-5" />
                  <span>Settings</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Button
                    variant="outline"
                    className="bg-studio-bg border-studio-border text-studio-text hover:bg-studio-accent hover:text-studio-bg flex items-center justify-start space-x-3 p-4 h-auto"
                  >
                    <ExternalLink className="w-5 h-5" />
                    <span>Terms of Service</span>
                  </Button>
                  
                  <Button
                    variant="outline"
                    className="bg-studio-bg border-studio-border text-studio-text hover:bg-studio-accent hover:text-studio-bg flex items-center justify-start space-x-3 p-4 h-auto"
                  >
                    <CreditCard className="w-5 h-5" />
                    <span>Membership info</span>
                  </Button>
                  
                  <Button
                    variant="outline"
                    className="bg-studio-bg border-studio-border text-studio-text hover:bg-studio-accent hover:text-studio-bg flex items-center justify-start space-x-3 p-4 h-auto"
                  >
                    <ExternalLink className="w-5 h-5" />
                    <span>Privacy Policy</span>
                  </Button>
                  
                  <Button
                    variant="outline"
                    className="bg-studio-bg border-studio-border text-studio-text hover:bg-studio-accent hover:text-studio-bg flex items-center justify-start space-x-3 p-4 h-auto"
                  >
                    <HelpCircle className="w-5 h-5" />
                    <span>Help Center</span>
                  </Button>
                  
                  <Button
                    variant="outline"
                    className="bg-studio-bg border-studio-border text-studio-text hover:bg-studio-accent hover:text-studio-bg flex items-center justify-start space-x-3 p-4 h-auto"
                  >
                    <MessageCircleQuestion className="w-5 h-5" />
                    <span>Contact</span>
                  </Button>
                  
                  <Button
                    variant="outline"
                    className="bg-studio-bg border-studio-border text-studio-text hover:bg-studio-accent hover:text-studio-bg flex items-center justify-start space-x-3 p-4 h-auto"
                  >
                    <Bug className="w-5 h-5" />
                    <span>Submit a Bug</span>
                  </Button>
                  
                  <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Button
                      variant="outline"
                      className="bg-studio-bg border-studio-border text-studio-text hover:bg-studio-accent hover:text-studio-bg flex items-center justify-start space-x-3 p-4 h-auto"
                    >
                      <UserPlus className="w-5 h-5" />
                      <span>Apply to be a Beta Tester</span>
                    </Button>

                    <Button
                      variant="outline"
                      onClick={handleLogout}
                      disabled={logoutMutation.isPending}
                      className="bg-studio-bg border-studio-border text-studio-text hover:bg-studio-accent hover:text-studio-bg flex items-center justify-start space-x-3 p-4 h-auto"
                    >
                      <LogOut className="w-5 h-5" />
                      <span>{logoutMutation.isPending ? 'Signing out...' : 'Sign out'}</span>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </QueryWrapper>
      </div>
      
      {/* Bottom Navigation */}
      <footer className="border-t border-border p-4 md:p-8 mt-8">
        <div className="flex items-center justify-center space-x-4 md:space-x-8">
          <Button
            variant="ghost"
            size="lg"
            asChild
            className="flex items-center space-x-2 md:space-x-3 text-studio-text hover:text-studio-accent h-auto py-3 md:py-4 px-4 md:px-6"
          >
            <NavLink to="/">
              <Home className="h-5 w-5 md:h-6 md:w-6" />
              <span className="text-xs md:text-sm">Studio</span>
            </NavLink>
          </Button>
          
          <Button
            variant="ghost"
            size="lg"
            asChild
            className="flex items-center space-x-2 md:space-x-3 text-studio-text hover:text-studio-accent h-auto py-3 md:py-4 px-4 md:px-6"
          >
            <NavLink to="/">
              <Plus className="h-5 w-5 md:h-6 md:w-6" />
              <span className="text-xs md:text-sm">New Project</span>
            </NavLink>
          </Button>

          <Button
            variant="ghost"
            size="lg"
            className="flex items-center space-x-2 md:space-x-3 text-studio-text hover:text-studio-accent h-auto py-3 md:py-4 px-4 md:px-6"
          >
            <User className="h-5 w-5 md:h-6 md:w-6" />
            <span className="text-xs md:text-sm">Profile</span>
          </Button>
        </div>
      </footer>
    </div>
  );
};

export default Profile;