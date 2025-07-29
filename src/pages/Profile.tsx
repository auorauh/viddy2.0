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
        <div className="grid grid-cols-1 gap-6">

          {/* Team Management */}
          <Card className="bg-studio-card border-studio-border">
            <CardHeader>
              <CardTitle className="text-studio-text flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Users className="w-5 h-5" />
                  Team Management
                </div>
                <Dialog open={isTeamDialogOpen} onOpenChange={setIsTeamDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" className="bg-studio-bg border-studio-border text-studio-text hover:bg-studio-muted">
                      <Settings className="w-4 h-4 mr-2" />
                      Manage
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-studio-card border-studio-border max-w-2xl">
                    <DialogHeader>
                      <DialogTitle className="text-studio-text">Team Management</DialogTitle>
                      <DialogDescription className="text-studio-muted">
                        Manage your team members and their permissions.
                      </DialogDescription>
                    </DialogHeader>
                    
                    <div className="space-y-6">
                      {/* Invite new member */}
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-studio-text">Invite Team Member</h3>
                        <div className="flex space-x-2">
                          <Input
                            placeholder="Enter email address"
                            value={inviteEmail}
                            onChange={(e) => setInviteEmail(e.target.value)}
                            className="bg-studio-bg border-studio-border text-studio-text flex-1"
                          />
                          <Select value={inviteRole} onValueChange={(value: "owner" | "editor" | "viewer") => setInviteRole(value)}>
                            <SelectTrigger className="w-32 bg-studio-bg border-studio-border text-studio-text">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-studio-card border-studio-border">
                              <SelectItem value="viewer" className="text-studio-text">Viewer</SelectItem>
                              <SelectItem value="editor" className="text-studio-text">Editor</SelectItem>
                              <SelectItem value="owner" className="text-studio-text">Owner</SelectItem>
                            </SelectContent>
                          </Select>
                          <Button 
                            onClick={handleInviteMember}
                            className="bg-studio-accent text-studio-bg hover:bg-studio-accent/90"
                          >
                            <UserPlus className="w-4 h-4 mr-2" />
                            Invite
                          </Button>
                        </div>
                      </div>
                      
                      {/* Current team members */}
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-studio-text">Team Members</h3>
                        <div className="space-y-3">
                          {teamMembers.map((member) => (
                            <div key={member.id} className="flex items-center justify-between p-3 bg-studio-bg rounded-lg border border-studio-border">
                              <div className="flex items-center space-x-3">
                                <Avatar className="w-8 h-8">
                                  <AvatarFallback className="bg-studio-accent text-studio-bg text-sm">
                                    {member.name.split(' ').map(n => n[0]).join('')}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <p className="font-medium text-studio-text">{member.name}</p>
                                  <p className="text-sm text-studio-muted">{member.email}</p>
                                </div>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Badge className={`${getRoleBadgeVariant(member.role)} border`}>
                                  <span className="flex items-center space-x-1">
                                    {getRoleIcon(member.role)}
                                    <span className="capitalize">{member.role}</span>
                                  </span>
                                </Badge>
                                <Select 
                                  value={member.role} 
                                  onValueChange={(value: "owner" | "editor" | "viewer") => handleRoleChange(member.id, value)}
                                >
                                  <SelectTrigger className="w-20 h-8 bg-studio-card border-studio-border text-studio-text">
                                    <ChevronDown className="w-3 h-3" />
                                  </SelectTrigger>
                                  <SelectContent className="bg-studio-card border-studio-border">
                                    <SelectItem value="viewer" className="text-studio-text">Viewer</SelectItem>
                                    <SelectItem value="editor" className="text-studio-text">Editor</SelectItem>
                                    <SelectItem value="owner" className="text-studio-text">Owner</SelectItem>
                                  </SelectContent>
                                </Select>
                                {member.role !== "owner" && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleRemoveMember(member.id)}
                                    className="h-8 w-8 p-0 bg-red-500/10 border-red-500/30 text-red-400 hover:bg-red-500/20"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </Button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                    
                    <DialogFooter>
                      <Button
                        variant="outline"
                        onClick={() => setIsTeamDialogOpen(false)}
                        className="bg-studio-bg border-studio-border text-studio-text hover:bg-studio-muted"
                      >
                        Close
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-studio-muted">Team Members</span>
                  <Badge variant="secondary" className="bg-studio-accent/20 text-studio-accent">
                    {teamMembers.length} members
                  </Badge>
                </div>
                
                <div className="space-y-2">
                  {teamMembers.slice(0, 3).map((member) => (
                    <div key={member.id} className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Avatar className="w-6 h-6">
                          <AvatarFallback className="bg-studio-accent text-studio-bg text-xs">
                            {member.name.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-studio-text text-sm">{member.name}</span>
                      </div>
                      <Badge className={`${getRoleBadgeVariant(member.role)} border text-xs`}>
                        <span className="flex items-center space-x-1">
                          {getRoleIcon(member.role)}
                          <span className="capitalize">{member.role}</span>
                        </span>
                      </Badge>
                    </div>
                  ))}
                  {teamMembers.length > 3 && (
                    <p className="text-xs text-studio-muted">
                      +{teamMembers.length - 3} more members
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Settings */}
          <Card className="bg-studio-card border-studio-border">
            <CardHeader>
              <CardTitle className="text-studio-text flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Settings className="w-5 h-5" />
                  Settings
                </div>
                <Dialog open={isSettingsDialogOpen} onOpenChange={setIsSettingsDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" className="bg-studio-bg border-studio-border text-studio-text hover:bg-studio-muted">
                      <Settings className="w-4 h-4 mr-2" />
                      Configure
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-studio-card border-studio-border max-w-2xl">
                    <DialogHeader>
                      <DialogTitle className="text-studio-text">AI & Prompt Settings</DialogTitle>
                      <DialogDescription className="text-studio-muted">
                        Configure your AI preferences and custom prompt templates.
                      </DialogDescription>
                    </DialogHeader>
                    
                    <div className="space-y-6">
                      {/* AI Model Selection */}
                      <div className="space-y-2">
                        <Label htmlFor="ai-model" className="text-studio-text">Default AI Model</Label>
                        <Select value={aiSettings.defaultModel} onValueChange={(value) => setAiSettings(prev => ({ ...prev, defaultModel: value }))}>
                          <SelectTrigger className="bg-studio-bg border-studio-border text-studio-text">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-studio-card border-studio-border">
                            <SelectItem value="gpt-4" className="text-studio-text">GPT-4 (Recommended)</SelectItem>
                            <SelectItem value="gpt-3.5-turbo" className="text-studio-text">GPT-3.5 Turbo</SelectItem>
                            <SelectItem value="claude-3" className="text-studio-text">Claude 3</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      {/* Custom API Key */}
                      <div className="space-y-2">
                        <Label htmlFor="api-key" className="text-studio-text">Custom API Key (Optional)</Label>
                        <Input
                          id="api-key"
                          type="password"
                          placeholder="Enter your custom API key"
                          value={aiSettings.apiKey}
                          onChange={(e) => setAiSettings(prev => ({ ...prev, apiKey: e.target.value }))}
                          className="bg-studio-bg border-studio-border text-studio-text"
                        />
                        <p className="text-xs text-studio-muted">
                          Use your own API key to avoid usage limits and get faster responses.
                        </p>
                      </div>
                      
                      {/* Prompt Templates */}
                      <div className="space-y-4">
                        <Label className="text-studio-text">Custom Prompt Templates</Label>
                        
                        {/* Add new template */}
                        <div className="flex space-x-2">
                          <Input
                            placeholder="Create a new prompt template..."
                            value={newTemplate}
                            onChange={(e) => setNewTemplate(e.target.value)}
                            className="bg-studio-bg border-studio-border text-studio-text flex-1"
                          />
                          <Button 
                            onClick={addPromptTemplate}
                            className="bg-studio-accent text-studio-bg hover:bg-studio-accent/90"
                          >
                            <Plus className="w-4 h-4 mr-2" />
                            Add
                          </Button>
                        </div>
                        
                        {/* Existing templates */}
                        <div className="space-y-2 max-h-40 overflow-y-auto">
                          {aiSettings.promptTemplates.map((template, index) => (
                            <div key={index} className="flex items-center justify-between p-2 bg-studio-bg rounded border border-studio-border">
                              <span className="text-studio-text text-sm">{template}</span>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => removePromptTemplate(index)}
                                className="h-6 w-6 p-0 bg-red-500/10 border-red-500/30 text-red-400 hover:bg-red-500/20"
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                    
                    <DialogFooter>
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
                <div className="flex items-center justify-between">
                  <span className="text-studio-muted">AI Model</span>
                  <Badge variant="secondary" className="bg-studio-accent/20 text-studio-accent">
                    {aiSettings.defaultModel}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-studio-muted">Prompt Templates</span>
                  <Badge variant="secondary" className="bg-studio-accent/20 text-studio-accent">
                    {aiSettings.promptTemplates.length} templates
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
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