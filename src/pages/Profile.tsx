import { useState } from "react";
import { Edit3, User, Mail, Calendar, Home, Plus, Settings, ExternalLink, LogOut, CreditCard, Bug, HelpCircle, UserPlus } from "lucide-react";
import { NavLink } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const Profile = () => {
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
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
  });

  const [editForm, setEditForm] = useState(profile);

  const handleSave = () => {
    setProfile(editForm);
    setIsEditDialogOpen(false);
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

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-studio-card border-studio-border">
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
          
          <Card className="bg-studio-card border-studio-border">
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
          
          <Card className="bg-studio-card border-studio-border">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-studio-muted text-sm">Success Rate</p>
                  <p className="text-3xl font-bold text-studio-text">75%</p>
                </div>
                <Badge variant="secondary" className="bg-blue-500/20 text-blue-400">
                  Growing
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Account & Subscription Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="bg-studio-card border-studio-border">
            <CardHeader>
              <CardTitle className="text-studio-text flex items-center">
                <CreditCard className="w-5 h-5 mr-2" />
                Subscription
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-studio-muted">Plan</span>
                <Badge className="bg-studio-accent/20 text-studio-accent">{profile.subscription}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-studio-muted">Status</span>
                <span className="text-green-400">{profile.subscriptionStatus}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-studio-muted">Next Billing</span>
                <span className="text-studio-text">{profile.nextBilling}</span>
              </div>
              <Button variant="outline" size="sm" className="w-full bg-studio-bg border-studio-border text-studio-text">
                Manage Subscription
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-studio-card border-studio-border">
            <CardHeader>
              <CardTitle className="text-studio-text flex items-center">
                <Mail className="w-5 h-5 mr-2" />
                Account Email
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="p-3 bg-studio-bg rounded border border-studio-border">
                <span className="text-studio-text">{profile.email}</span>
              </div>
              <p className="text-sm text-studio-muted">
                This email is used for login and important notifications
              </p>
              <Button variant="outline" size="sm" className="w-full bg-studio-bg border-studio-border text-studio-text">
                Change Email
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Settings */}
        <Card className="bg-studio-card border-studio-border">
          <CardHeader>
            <CardTitle className="text-studio-text flex items-center">
              <Settings className="w-5 h-5 mr-2" />
              Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Support & Help */}
            <div className="space-y-3">
              <h3 className="font-medium text-studio-text">Support & Help</h3>
              
              <div className="flex items-center justify-between p-4 bg-studio-bg rounded-lg border border-studio-border">
                <div className="flex items-center">
                  <Bug className="w-5 h-5 mr-3 text-studio-muted" />
                  <div>
                    <h4 className="font-medium text-studio-text">Submit a Bug</h4>
                    <p className="text-sm text-studio-muted">Report issues or problems</p>
                  </div>
                </div>
                <Button variant="outline" size="sm" className="bg-studio-bg border-studio-border text-studio-text">
                  Report <ExternalLink className="w-4 h-4 ml-1" />
                </Button>
              </div>

              <div className="flex items-center justify-between p-4 bg-studio-bg rounded-lg border border-studio-border">
                <div className="flex items-center">
                  <HelpCircle className="w-5 h-5 mr-3 text-studio-muted" />
                  <div>
                    <h4 className="font-medium text-studio-text">Help Center</h4>
                    <p className="text-sm text-studio-muted">Get help and view documentation</p>
                  </div>
                </div>
                <Button variant="outline" size="sm" className="bg-studio-bg border-studio-border text-studio-text">
                  Visit <ExternalLink className="w-4 h-4 ml-1" />
                </Button>
              </div>

              <div className="flex items-center justify-between p-4 bg-studio-bg rounded-lg border border-studio-border">
                <div className="flex items-center">
                  <UserPlus className="w-5 h-5 mr-3 text-studio-muted" />
                  <div>
                    <h4 className="font-medium text-studio-text">Invite Friends</h4>
                    <p className="text-sm text-studio-muted">Share viddy studio with others</p>
                  </div>
                </div>
                <Button variant="outline" size="sm" className="bg-studio-bg border-studio-border text-studio-text">
                  Invite
                </Button>
              </div>
            </div>

            <div className="border-t border-studio-border pt-4 space-y-3">
              <h3 className="font-medium text-studio-text">Legal & Account</h3>
              
              <div className="flex items-center justify-between p-4 bg-studio-bg rounded-lg border border-studio-border">
                <div>
                  <h4 className="font-medium text-studio-text">Terms of Service</h4>
                  <p className="text-sm text-studio-muted">View our terms and conditions</p>
                </div>
                <Button variant="outline" size="sm" className="bg-studio-bg border-studio-border text-studio-text">
                  View <ExternalLink className="w-4 h-4 ml-1" />
                </Button>
              </div>

              <div className="flex items-center justify-between p-4 bg-studio-bg rounded-lg border border-studio-border">
                <div>
                  <h4 className="font-medium text-studio-text">Privacy Policy</h4>
                  <p className="text-sm text-studio-muted">How we handle your data</p>
                </div>
                <Button variant="outline" size="sm" className="bg-studio-bg border-studio-border text-studio-text">
                  View <ExternalLink className="w-4 h-4 ml-1" />
                </Button>
              </div>

              <div className="flex items-center justify-between p-4 bg-studio-bg rounded-lg border border-studio-border">
                <div className="flex items-center">
                  <LogOut className="w-5 h-5 mr-3 text-red-400" />
                  <div>
                    <h4 className="font-medium text-studio-text">Log Out</h4>
                    <p className="text-sm text-studio-muted">Sign out of your account</p>
                  </div>
                </div>
                <Button variant="outline" size="sm" className="bg-studio-bg border-red-500/20 text-red-400 hover:bg-red-500/10">
                  Log Out
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
        </div>
      </div>
      
      {/* Bottom Navigation */}
      <footer className="border-t border-border p-8 mt-8">
        <div className="flex items-center justify-center space-x-8">
          <Button
            variant="ghost"
            size="lg"
            asChild
            className="flex items-center space-x-3 text-studio-text hover:text-studio-accent h-auto py-4 px-6"
          >
            <NavLink to="/">
              <Home className="h-6 w-6" />
              <span className="text-sm">Studio</span>
            </NavLink>
          </Button>
          
          <Button
            variant="ghost"
            size="lg"
            asChild
            className="flex items-center space-x-3 text-studio-text hover:text-studio-accent h-auto py-4 px-6"
          >
            <NavLink to="/">
              <Plus className="h-6 w-6" />
              <span className="text-sm">New Project</span>
            </NavLink>
          </Button>
          
          <Button
            variant="ghost"
            size="lg"
            className="flex items-center space-x-3 text-studio-text hover:text-studio-accent h-auto py-4 px-6"
          >
            <User className="h-6 w-6" />
            <span className="text-sm">Profile</span>
          </Button>
        </div>
      </footer>
    </div>
  );
};

export default Profile;