import { useState } from "react";
import { Edit3, User, Mail, Calendar, Home, Plus, Settings, ExternalLink, LogOut, CreditCard, Bug, HelpCircle, UserPlus, Youtube, Video, Target, Bot, ChevronDown, Trash2, Crown, Edit, Eye, Users, MessageCircleQuestion, Trophy, Star, CheckCircle2, Zap, Upload, Image } from "lucide-react";
import { NavLink } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";

const Profile = () => {
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isTeamDialogOpen, setIsTeamDialogOpen] = useState(false);
  const [isSettingsDialogOpen, setIsSettingsDialogOpen] = useState(false);
  const [isQuestionsDialogOpen, setIsQuestionsDialogOpen] = useState(false);
  const [isChallengesDialogOpen, setIsChallengesDialogOpen] = useState(false);
  const [profile, setProfile] = useState({
    name: "Alex Johnson",
    email: "alex.johnson@example.com",
    bio: "Content creator focused on skateboarding tutorials and lifestyle vlogs. Passionate about teaching others and building community through video.",
    joinDate: "January 2024",
    totalScripts: 24,
    totalRecordings: 18,
    subscription: "Pro Plan",
    subscriptionStatus: "Active",
    nextBilling: "March 15, 2024",
    interests: ["Technology", "Lifestyle", "Education"],
    platform: "YouTube",
    uploadRate: 8,
    points: 750,
    level: 8,
    customLogo: null as string | null,
  });

  // Challenge system state
  const [challenges, setChallenges] = useState([
    { id: 1, title: "First Script", description: "Create your first video script", points: 10, completed: true },
    { id: 2, title: "Record 10 Videos", description: "Complete 10 video recordings", points: 50, completed: false, progress: 7, maxProgress: 10 },
    { id: 3, title: "Weekly Creator", description: "Upload videos 4 weeks in a row", points: 25, completed: false, progress: 2, maxProgress: 4 },
    { id: 4, title: "Script Master", description: "Create 50 scripts", points: 100, completed: false, progress: 24, maxProgress: 50 },
    { id: 5, title: "Team Player", description: "Invite 3 team members", points: 30, completed: false, progress: 1, maxProgress: 3 },
    { id: 6, title: "Social Butterfly", description: "Share 20 videos on social media", points: 40, completed: true },
    { id: 7, title: "Pro User", description: "Use Viddy for 30 days straight", points: 75, completed: false, progress: 15, maxProgress: 30 },
    { id: 8, title: "Feedback Champion", description: "Provide feedback on 10 community videos", points: 20, completed: false, progress: 3, maxProgress: 10 },
    { id: 9, title: "Template Creator", description: "Create 5 custom prompt templates", points: 35, completed: false, progress: 2, maxProgress: 5 },
    { id: 10, title: "Marathon Creator", description: "Record a 60+ minute video", points: 60, completed: false }
  ]);

  // Calculate level progress
  const getPointsForLevel = (level: number) => level * 100;
  const getPointsForNextLevel = (currentLevel: number) => getPointsForLevel(currentLevel + 1);
  const getCurrentLevelPoints = (points: number, level: number) => points - getPointsForLevel(level - 1);
  const getPointsNeededForNextLevel = (points: number, level: number) => getPointsForNextLevel(level) - points;

  const [aiSettings, setAiSettings] = useState({
    defaultModel: "gpt-4",
    apiKey: "",
    promptTemplates: [
      "Create a YouTube video script about [topic]",
      "Generate engaging social media captions for [content]",
      "Write a tutorial outline for [subject]"
    ]
  });

  const [newTemplate, setNewTemplate] = useState("");

  // Team management state
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"owner" | "editor" | "viewer">("viewer");
  const [teamMembers, setTeamMembers] = useState([
    { id: "1", name: "John Doe", email: "john@example.com", role: "owner", avatar: "" },
    { id: "2", name: "Jane Smith", email: "jane@example.com", role: "editor", avatar: "" },
    { id: "3", name: "Mike Johnson", email: "mike@example.com", role: "viewer", avatar: "" }
  ]);

  const [editForm, setEditForm] = useState(profile);

  const handleSave = () => {
    setProfile(editForm);
    // Save custom logo to localStorage for persistence
    if (editForm.customLogo) {
      localStorage.setItem('customLogo', editForm.customLogo);
    } else {
      localStorage.removeItem('customLogo');
    }
    setIsEditDialogOpen(false);
  };

  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setEditForm(prev => ({ ...prev, customLogo: result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveLogo = () => {
    setEditForm(prev => ({ ...prev, customLogo: null }));
  };

  const handleSettingsSave = () => {
    // In a real app, this would save to a secure backend
    // For now, we'll save to localStorage (not recommended for API keys in production)
    localStorage.setItem('aiSettings', JSON.stringify(aiSettings));
    setIsSettingsDialogOpen(false);
  };

  const addPromptTemplate = () => {
    if (newTemplate.trim()) {
      setAiSettings(prev => ({
        ...prev,
        promptTemplates: [...prev.promptTemplates, newTemplate.trim()]
      }));
      setNewTemplate("");
    }
  };

  const removePromptTemplate = (index: number) => {
    setAiSettings(prev => ({
      ...prev,
      promptTemplates: prev.promptTemplates.filter((_, i) => i !== index)
    }));
  };

  const handleInviteMember = () => {
    if (inviteEmail && inviteRole) {
      const newMember = {
        id: Date.now().toString(),
        name: inviteEmail.split("@")[0],
        email: inviteEmail,
        role: inviteRole,
        avatar: ""
      };
      setTeamMembers([...teamMembers, newMember]);
      setInviteEmail("");
      setInviteRole("viewer");
    }
  };

  const handleRemoveMember = (id: string) => {
    setTeamMembers(teamMembers.filter(member => member.id !== id));
  };

  const handleRoleChange = (id: string, newRole: "owner" | "editor" | "viewer") => {
    setTeamMembers(teamMembers.map(member => 
      member.id === id ? { ...member, role: newRole } : member
    ));
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "owner": return <Crown className="w-4 h-4" />;
      case "editor": return <Edit className="w-4 h-4" />;
      case "viewer": return <Eye className="w-4 h-4" />;
      default: return <Eye className="w-4 h-4" />;
    }
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case "owner": return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
      case "editor": return "bg-blue-500/20 text-blue-400 border-blue-500/30";
      case "viewer": return "bg-gray-500/20 text-gray-400 border-gray-500/30";
      default: return "bg-gray-500/20 text-gray-400 border-gray-500/30";
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="flex-1 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Profile Header */}
        <Card className="bg-studio-card border-studio-border">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-6">
                <Avatar className="w-24 h-24">
                  <AvatarImage src="https://images.unsplash.com/photo-1649972904349-6e44c42644a7?w=200&h=200&fit=crop&crop=face" />
                  <AvatarFallback className="bg-studio-accent text-studio-bg text-2xl">
                    {profile.name.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                
                <div className="space-y-2">
                  <h1 className="text-3xl font-bold text-studio-text">{profile.name}</h1>
                  <div className="flex items-center space-x-2 text-studio-muted">
                    <Mail className="w-4 h-4" />
                    <span>{profile.email}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-studio-muted">
                    <Calendar className="w-4 h-4" />
                    <span>Joined {profile.joinDate}</span>
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
                      <Label htmlFor="name" className="text-studio-text">Name</Label>
                      <Input
                        id="name"
                        value={editForm.name}
                        onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
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
                      <Label htmlFor="bio" className="text-studio-text">Bio</Label>
                      <Textarea
                        id="bio"
                        rows={4}
                        value={editForm.bio}
                        onChange={(e) => setEditForm(prev => ({ ...prev, bio: e.target.value }))}
                        className="bg-studio-bg border-studio-border text-studio-text resize-none"
                      />
                    </div>
                    
                    <div>
                      <Label className="text-studio-text">Custom Logo</Label>
                      <div className="space-y-3 mt-2">
                        {editForm.customLogo ? (
                          <div className="flex items-center space-x-3">
                            <div className="relative">
                              <img 
                                src={editForm.customLogo} 
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
                      className="bg-studio-accent text-studio-bg hover:bg-studio-accent/90"
                    >
                      Save Changes
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          
          <CardContent>
            <p className="text-studio-muted leading-relaxed">{profile.bio}</p>
          </CardContent>
        </Card>


        {/* Stats - Bento Box Layout */}
        <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-6 gap-6">
          <Card className="bg-studio-card border-studio-border md:col-span-2 lg:col-span-2">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-studio-muted text-sm">Total Scripts</p>
                  <p className="text-3xl font-bold text-studio-text">{profile.totalScripts}</p>
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
                  <p className="text-studio-muted text-sm">Recordings</p>
                  <p className="text-3xl font-bold text-studio-text">{profile.totalRecordings}</p>
                </div>
                <Badge variant="secondary" className="bg-green-500/20 text-green-400">
                  Completed
                </Badge>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-studio-card border-studio-border md:col-span-1 lg:col-span-2">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-studio-muted text-sm">Upload Rate</p>
                  <p className="text-3xl font-bold text-studio-text">{profile.uploadRate}/month</p>
                </div>
                <Badge variant="secondary" className="bg-blue-500/20 text-blue-400">
                  Target
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Bento Box Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">

          {/* Team Management - Large Card */}
          <div className="md:col-span-2 lg:col-span-3">
            <Card className="bg-studio-card border-studio-border h-full">
          <CardHeader>
            <CardTitle className="text-studio-text flex items-center justify-between">
              <div className="flex items-center">
                <Users className="w-5 h-5 mr-2" />
                Team Management
              </div>
              <Dialog open={isTeamDialogOpen} onOpenChange={setIsTeamDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="bg-studio-bg border-studio-border text-studio-text hover:bg-studio-accent hover:text-studio-bg">
                    <Users className="w-4 h-4 mr-2" />
                    Team
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-studio-card border-studio-border max-w-3xl">
                  <DialogHeader>
                    <DialogTitle className="text-studio-text">Team Management</DialogTitle>
                    <DialogDescription className="text-studio-muted">
                      Invite team members and manage their roles
                    </DialogDescription>
                  </DialogHeader>
                  
                  <div className="space-y-6 max-h-96 overflow-y-auto">
                    {/* Invite Section */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-studio-text flex items-center">
                        <UserPlus className="w-5 h-5 mr-2" />
                        Invite Team Members
                      </h3>
                      
                      <div className="flex gap-3">
                        <div className="flex-1">
                          <Input
                            type="email"
                            placeholder="Enter email address"
                            value={inviteEmail}
                            onChange={(e) => setInviteEmail(e.target.value)}
                            className="bg-studio-bg border-studio-border text-studio-text"
                          />
                        </div>
                        
                        <Select value={inviteRole} onValueChange={(value: "owner" | "editor" | "viewer") => setInviteRole(value)}>
                          <SelectTrigger className="w-32 bg-studio-bg border-studio-border text-studio-text">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-studio-card border-studio-border">
                            <SelectItem value="owner" className="text-studio-text hover:bg-studio-accent/20">
                              <div className="flex items-center">
                                <Crown className="w-4 h-4 mr-2" />
                                Owner
                              </div>
                            </SelectItem>
                            <SelectItem value="editor" className="text-studio-text hover:bg-studio-accent/20">
                              <div className="flex items-center">
                                <Edit className="w-4 h-4 mr-2" />
                                Editor
                              </div>
                            </SelectItem>
                            <SelectItem value="viewer" className="text-studio-text hover:bg-studio-accent/20">
                              <div className="flex items-center">
                                <Eye className="w-4 h-4 mr-2" />
                                Viewer
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        
                        <Button 
                          onClick={handleInviteMember}
                          disabled={!inviteEmail}
                          className="bg-studio-accent hover:bg-studio-accent/90 text-studio-bg"
                        >
                          <Mail className="w-4 h-4 mr-2" />
                          Invite
                        </Button>
                      </div>
                    </div>

                    {/* Team Members List */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-studio-text">Team Members ({teamMembers.length})</h3>
                      
                      <div className="space-y-3">
                        {teamMembers.map((member) => (
                          <div key={member.id} className="flex items-center justify-between p-3 bg-studio-bg border border-studio-border rounded-lg">
                            <div className="flex items-center space-x-3">
                              <Avatar className="w-8 h-8">
                                <AvatarImage src={member.avatar} alt={member.name} />
                                <AvatarFallback className="bg-studio-accent/20 text-studio-accent text-sm">
                                  {member.name.split(" ").map(n => n[0]).join("").toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              
                              <div className="flex flex-col">
                                <span className="text-studio-text font-medium">{member.name}</span>
                                <span className="text-studio-muted text-sm">{member.email}</span>
                              </div>
                            </div>
                            
                            <div className="flex items-center space-x-3">
                              <Badge className={`${getRoleBadgeVariant(member.role)} border`}>
                                <div className="flex items-center">
                                  {getRoleIcon(member.role)}
                                  <span className="ml-1 capitalize">{member.role}</span>
                                </div>
                              </Badge>
                              
                              {member.role !== "owner" && (
                                <div className="flex items-center space-x-2">
                                  <Select value={member.role} onValueChange={(value: "owner" | "editor" | "viewer") => handleRoleChange(member.id, value)}>
                                    <SelectTrigger className="w-24 h-8 bg-studio-bg border-studio-border text-studio-text text-xs">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="bg-studio-card border-studio-border">
                                      <SelectItem value="owner" className="text-studio-text hover:bg-studio-accent/20 text-xs">Owner</SelectItem>
                                      <SelectItem value="editor" className="text-studio-text hover:bg-studio-accent/20 text-xs">Editor</SelectItem>
                                      <SelectItem value="viewer" className="text-studio-text hover:bg-studio-accent/20 text-xs">Viewer</SelectItem>
                                    </SelectContent>
                                  </Select>
                                  
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleRemoveMember(member.id)}
                                    className="h-8 w-8 p-0 text-red-400 hover:text-red-300 hover:bg-red-500/20"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Role Descriptions */}
                    <div className="mt-6 p-4 bg-studio-bg border border-studio-border rounded-lg">
                      <h4 className="text-sm font-medium text-studio-text mb-3">Role Permissions</h4>
                      <div className="space-y-2 text-xs text-studio-muted">
                        <div className="flex items-center">
                          <Crown className="w-3 h-3 mr-2 text-yellow-400" />
                          <span className="font-medium text-yellow-400">Owner:</span>
                          <span className="ml-2">Full access to all features and settings</span>
                        </div>
                        <div className="flex items-center">
                          <Edit className="w-3 h-3 mr-2 text-blue-400" />
                          <span className="font-medium text-blue-400">Editor:</span>
                          <span className="ml-2">Can edit scripts and manage content</span>
                        </div>
                        <div className="flex items-center">
                          <Eye className="w-3 h-3 mr-2 text-gray-400" />
                          <span className="font-medium text-gray-400">Viewer:</span>
                          <span className="ml-2">Can view and comment on scripts</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <DialogFooter>
                    <Button
                      onClick={() => setIsTeamDialogOpen(false)}
                      className="bg-studio-accent text-studio-bg hover:bg-studio-accent/90"
                    >
                      Done
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium text-studio-text mb-2">Team Size</h4>
                <div className="p-3 bg-studio-bg rounded border border-studio-border">
                  <span className="text-studio-accent font-medium">{teamMembers.length} members</span>
                </div>
              </div>
              
              <div>
                <h4 className="font-medium text-studio-text mb-2">Your Role</h4>
                <div className="p-3 bg-studio-bg rounded border border-studio-border">
                  <div className="flex items-center">
                    <Crown className="w-4 h-4 mr-2 text-yellow-400" />
                    <span className="text-yellow-400 font-medium">Owner</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
          </div>

          
          {/* Settings - Tall Card */}
          <div className="md:col-span-2 lg:col-span-1">
            {/* Challenges */}
            <Card className="bg-studio-card border-studio-border h-full">
          <CardHeader>
            <CardTitle className="text-studio-text flex items-center justify-between">
              <div className="flex items-center">
                <Settings className="w-5 h-5 mr-2" />
                Settings
              </div>
              <Dialog open={isSettingsDialogOpen} onOpenChange={setIsSettingsDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="bg-studio-bg border-studio-border text-studio-text hover:bg-studio-accent hover:text-studio-bg">
                    <Settings className="w-4 h-4 mr-2" />
                    Configure
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-studio-card border-studio-border max-w-4xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle className="text-studio-text">Settings</DialogTitle>
                    <DialogDescription className="text-studio-muted">
                      Manage your account settings, AI preferences, and subscription
                    </DialogDescription>
                  </DialogHeader>
                  
                  <div className="space-y-8">
                    {/* Account Information - Top Section */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-studio-text flex items-center border-b border-studio-border pb-2">
                        <User className="w-5 h-5 mr-2" />
                        Account Information
                      </h3>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <h4 className="font-medium text-studio-text mb-2">Member Since</h4>
                          <div className="p-3 bg-studio-bg rounded border border-studio-border">
                            <div className="flex items-center space-x-2">
                              <Calendar className="w-4 h-4 text-studio-accent" />
                              <span className="text-studio-text font-medium">{profile.joinDate}</span>
                            </div>
                          </div>
                        </div>
                        
                        <div>
                          <h4 className="font-medium text-studio-text mb-2">Account Email</h4>
                          <div className="p-3 bg-studio-bg rounded border border-studio-border">
                            <div className="flex items-center space-x-2">
                              <Mail className="w-4 h-4 text-studio-accent" />
                              <span className="text-studio-text">{profile.email}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Membership Section */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-studio-text flex items-center border-b border-studio-border pb-2">
                        <CreditCard className="w-5 h-5 mr-2" />
                        Membership & Billing
                      </h3>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <h4 className="font-medium text-studio-text mb-2">Current Plan</h4>
                          <div className="p-3 bg-studio-bg rounded border border-studio-border">
                            <span className="text-studio-accent font-medium">{profile.subscription}</span>
                          </div>
                        </div>
                        
                        <div>
                          <h4 className="font-medium text-studio-text mb-2">Status</h4>
                          <div className="p-3 bg-studio-bg rounded border border-studio-border">
                            <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                              {profile.subscriptionStatus}
                            </Badge>
                          </div>
                        </div>
                        
                        <div>
                          <h4 className="font-medium text-studio-text mb-2">Next Billing</h4>
                          <div className="p-3 bg-studio-bg rounded border border-studio-border">
                            <span className="text-studio-text">{profile.nextBilling}</span>
                          </div>
                        </div>
                        
                        <div>
                          <h4 className="font-medium text-studio-text mb-2">Billing Actions</h4>
                          <Button variant="outline" size="sm" className="w-full bg-studio-bg border-studio-border text-studio-text hover:bg-studio-accent hover:text-studio-bg">
                            <ExternalLink className="w-4 h-4 mr-2" />
                            Manage Billing
                          </Button>
                        </div>
                      </div>
                    </div>

                    {/* AI Settings Section */}
                    <div className="space-y-6">
                      <h3 className="text-lg font-semibold text-studio-text flex items-center border-b border-studio-border pb-2">
                        <Bot className="w-5 h-5 mr-2" />
                        AI Assistant Settings
                      </h3>
                      
                      {/* Security Warning */}
                      <Alert className="border-orange-500/20 bg-orange-500/10">
                        <AlertDescription className="text-orange-200">
                          <strong>Security Notice:</strong> API keys are currently stored locally. For production use, we recommend connecting to Supabase for secure secret management.
                        </AlertDescription>
                      </Alert>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* AI Model Selection */}
                        <div>
                          <Label htmlFor="model" className="text-studio-text">Default AI Model</Label>
                          <Select value={aiSettings.defaultModel} onValueChange={(value) => setAiSettings(prev => ({ ...prev, defaultModel: value }))}>
                            <SelectTrigger className="bg-studio-bg border-studio-border text-studio-text">
                              <SelectValue placeholder="Select AI model" />
                            </SelectTrigger>
                            <SelectContent className="bg-studio-card border-studio-border">
                              <SelectItem value="gpt-4" className="text-studio-text">GPT-4 (Recommended)</SelectItem>
                              <SelectItem value="gpt-3.5-turbo" className="text-studio-text">GPT-3.5 Turbo</SelectItem>
                              <SelectItem value="claude-3" className="text-studio-text">Claude-3</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        {/* API Key */}
                        <div>
                          <Label htmlFor="apiKey" className="text-studio-text">API Key</Label>
                          <Input
                            id="apiKey"
                            type="password"
                            value={aiSettings.apiKey}
                            onChange={(e) => setAiSettings(prev => ({ ...prev, apiKey: e.target.value }))}
                            placeholder="Enter your OpenAI API key"
                            className="bg-studio-bg border-studio-border text-studio-text"
                          />
                          <p className="text-xs text-studio-muted mt-1">
                            Your API key is stored locally in your browser
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Support Section */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-studio-text flex items-center border-b border-studio-border pb-2">
                        <HelpCircle className="w-5 h-5 mr-2" />
                        Support & Help
                      </h3>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Button variant="outline" className="bg-studio-bg border-studio-border text-studio-text hover:bg-studio-accent hover:text-studio-bg">
                          <Bug className="w-4 h-4 mr-2" />
                          Report Issue
                        </Button>
                        
                        <Button variant="outline" className="bg-studio-bg border-studio-border text-studio-text hover:bg-studio-accent hover:text-studio-bg">
                          <HelpCircle className="w-4 h-4 mr-2" />
                          Help Center
                        </Button>
                      </div>
                    </div>

                    {/* Sign Out - Bottom Section */}
                    <div className="pt-6 border-t border-studio-border">
                      <Button variant="outline" className="w-full bg-studio-bg border-red-500/30 text-red-400 hover:bg-red-500/20 hover:border-red-500/50">
                        <LogOut className="w-4 h-4 mr-2" />
                        Sign Out
                      </Button>
                    </div>
                  </div>
                  
                  <DialogFooter className="gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setIsSettingsDialogOpen(false)}
                      className="bg-studio-bg border-studio-border text-studio-text hover:bg-studio-muted"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleSettingsSave}
                      className="bg-studio-accent text-studio-bg hover:bg-studio-accent/90"
                    >
                      Save Settings
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-studio-text mb-2">Subscription</h4>
                <div className="p-3 bg-studio-bg rounded border border-studio-border">
                  <span className="text-studio-accent font-medium">{profile.subscription}</span>
                </div>
              </div>
              
              <div>
                <h4 className="font-medium text-studio-text mb-2">Account Status</h4>
                <div className="p-3 bg-studio-bg rounded border border-studio-border">
                  <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                    {profile.subscriptionStatus}
                  </Badge>
                </div>
              </div>
              
              <div>
                <h4 className="font-medium text-studio-text mb-2">Next Billing</h4>
                <div className="p-3 bg-studio-bg rounded border border-studio-border">
                  <span className="text-studio-text text-sm">{profile.nextBilling}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
          </div>
        </div>
        </div>
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