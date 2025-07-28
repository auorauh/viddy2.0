import { useState } from "react";
import { ArrowLeft, Mail, UserPlus, Trash2, Crown, Edit, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { ScriptBoard } from "../../pages/Studio";

interface ScriptEditorProps {
  script: ScriptBoard;
  onRecord: () => void;
  onBack: () => void;
}

export const ScriptEditor = ({ script, onRecord, onBack }: ScriptEditorProps) => {
  const [title, setTitle] = useState(script.title);
  const [content, setContent] = useState(script.content);
  const [lists, setLists] = useState("");
  const [details, setDetails] = useState("");
  const [editing, setEditing] = useState("");
  const [team, setTeam] = useState("");
  
  // Team management state
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"owner" | "editor" | "viewer">("viewer");
  const [teamMembers, setTeamMembers] = useState([
    { id: "1", name: "John Doe", email: "john@example.com", role: "owner", avatar: "" },
    { id: "2", name: "Jane Smith", email: "jane@example.com", role: "editor", avatar: "" },
    { id: "3", name: "Mike Johnson", email: "mike@example.com", role: "viewer", avatar: "" }
  ]);

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
    <div className="flex-1 flex flex-col">
      {/* Header */}
      <header className="p-6 border-b border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={onBack}
              className="text-studio-muted hover:text-studio-text"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="text-xl font-bold bg-transparent border border-border rounded px-3 py-1 w-auto min-w-[200px]"
            />
          </div>
          
          <Button
            onClick={onRecord}
            className="bg-studio-record hover:bg-studio-record/90 text-white"
          >
            Record
          </Button>
        </div>
      </header>

      {/* Editor Tabs */}
      <div className="flex-1 p-6">
        <Tabs defaultValue="script" className="h-full">
          <TabsList className="bg-studio-card border border-border">
            <TabsTrigger 
              value="script" 
              className="data-[state=active]:bg-studio-accent data-[state=active]:text-studio-bg"
            >
              Script
            </TabsTrigger>
            <TabsTrigger 
              value="lists"
              className="data-[state=active]:bg-studio-accent data-[state=active]:text-studio-bg"
            >
              Lists
            </TabsTrigger>
            <TabsTrigger 
              value="details"
              className="data-[state=active]:bg-studio-accent data-[state=active]:text-studio-bg"
            >
              Details
            </TabsTrigger>
            <TabsTrigger 
              value="editing"
              className="data-[state=active]:bg-studio-accent data-[state=active]:text-studio-bg"
            >
              Editing
            </TabsTrigger>
            <TabsTrigger 
              value="team"
              className="data-[state=active]:bg-studio-accent data-[state=active]:text-studio-bg"
            >
              Team
            </TabsTrigger>
          </TabsList>

          <TabsContent value="script" className="mt-6 h-full">
            <div className="bg-studio-card border border-border rounded-lg p-6 h-96">
              <Textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Start writing your script..."
                className="w-full h-full resize-none bg-transparent border-none text-studio-text text-base leading-relaxed focus:ring-0 focus:outline-none"
              />
            </div>
          </TabsContent>

          <TabsContent value="lists" className="mt-6">
            <div className="bg-studio-card border border-border rounded-lg p-6 h-96">
              <Textarea
                value={lists}
                onChange={(e) => setLists(e.target.value)}
                placeholder="Add bullet points and lists for your script..."
                className="w-full h-full resize-none bg-transparent border-none text-studio-text text-base leading-relaxed focus:ring-0 focus:outline-none"
              />
            </div>
          </TabsContent>

          <TabsContent value="details" className="mt-6">
            <div className="bg-studio-card border border-border rounded-lg p-6 h-96">
              <Textarea
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                placeholder="Add production details and notes..."
                className="w-full h-full resize-none bg-transparent border-none text-studio-text text-base leading-relaxed focus:ring-0 focus:outline-none"
              />
            </div>
          </TabsContent>

          <TabsContent value="editing" className="mt-6">
            <div className="bg-studio-card border border-border rounded-lg p-6 h-96">
              <Textarea
                value={editing}
                onChange={(e) => setEditing(e.target.value)}
                placeholder="Add post-production editing notes..."
                className="w-full h-full resize-none bg-transparent border-none text-studio-text text-base leading-relaxed focus:ring-0 focus:outline-none"
              />
            </div>
          </TabsContent>

          <TabsContent value="team" className="mt-6">
            <div className="bg-studio-card border border-border rounded-lg p-6 space-y-6 max-h-96 overflow-y-auto">
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
                    <span className="ml-1">Full access - can edit, delete, and manage team</span>
                  </div>
                  <div className="flex items-center">
                    <Edit className="w-3 h-3 mr-2 text-blue-400" />
                    <span className="font-medium text-blue-400">Editor:</span>
                    <span className="ml-1">Can edit script content and collaborate</span>
                  </div>
                  <div className="flex items-center">
                    <Eye className="w-3 h-3 mr-2 text-gray-400" />
                    <span className="font-medium text-gray-400">Viewer:</span>
                    <span className="ml-1">Can view and comment only</span>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};