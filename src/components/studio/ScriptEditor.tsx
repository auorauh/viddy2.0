import { useState } from "react";
import { ArrowLeft, CalendarIcon, Plus, Clock, Video, Trash2, Share, Copy, Mail, FileText, Download, X, Upload, Users, Settings, UserPlus, ChevronDown, Crown, Edit, Eye, GripVertical } from "lucide-react";
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import type { ScriptBoard } from "../../pages/Studio";

interface ScriptEditorProps {
  script: ScriptBoard;
  onRecord: () => void;
  onBack: () => void;
}

export const ScriptEditor = ({ script, onRecord, onBack }: ScriptEditorProps) => {
  const { toast } = useToast();
  const [title, setTitle] = useState(script.title);
  const [content, setContent] = useState(script.content);
  const [newPoint, setNewPoint] = useState("");
  const [lists, setLists] = useState("");
  const [details, setDetails] = useState("");
  const [editing, setEditing] = useState("");
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [editingPointIndex, setEditingPointIndex] = useState<number | null>(null);
  const [editingPointText, setEditingPointText] = useState("");
  const [emailRecipient, setEmailRecipient] = useState("");
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [importText, setImportText] = useState("");
  const [splitMethod, setSplitMethod] = useState("line");
  
  // Shot List and Gear List state
  const [shotList, setShotList] = useState([
    { id: "1", text: "Wide establishing shot", checked: false },
    { id: "2", text: "Close-up of main subject", checked: false },
    { id: "3", text: "Medium shot for dialogue", checked: false }
  ]);
  const [gearList, setGearList] = useState([
    { id: "1", text: "Camera", checked: false },
    { id: "2", text: "Tripod", checked: false },
    { id: "3", text: "Microphone", checked: false },
    { id: "4", text: "Extra batteries", checked: false }
  ]);
  const [newShotItem, setNewShotItem] = useState("");
  const [newGearItem, setNewGearItem] = useState("");
  
  // Editor Guides state
  const [editorGuides, setEditorGuides] = useState<{
    id: string;
    partName: string;
    versions: { fileName: string; uploadDate: Date }[];
  }[]>([]);
  const [editorNotes, setEditorNotes] = useState("");
  
  // Schedule management state
  const [scheduleItems, setScheduleItems] = useState([
    { id: "1", scene: "Scene 1: Opening", startTime: "09:00", duration: "30", description: "Main character introduction" },
    { id: "2", scene: "Scene 2: Dialogue", startTime: "09:30", duration: "45", description: "Key conversation between characters" }
  ]);

  // Team management state
  const [isTeamDialogOpen, setIsTeamDialogOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"owner" | "editor" | "viewer">("viewer");
  const [teamMembers, setTeamMembers] = useState([
    { id: "1", name: "John Doe", email: "john@example.com", role: "owner", avatar: "" },
    { id: "2", name: "Jane Smith", email: "jane@example.com", role: "editor", avatar: "" },
    { id: "3", name: "Mike Johnson", email: "mike@example.com", role: "viewer", avatar: "" }
  ]);

  const handleAddScheduleItem = () => {
    const newItem = {
      id: Date.now().toString(),
      scene: "",
      startTime: "",
      duration: "",
      description: ""
    };
    setScheduleItems([...scheduleItems, newItem]);
  };

  const handleRemoveScheduleItem = (id: string) => {
    setScheduleItems(scheduleItems.filter(item => item.id !== id));
  };

  const handleScheduleItemChange = (id: string, field: string, value: string) => {
    setScheduleItems(scheduleItems.map(item => 
      item.id === id ? { ...item, [field]: value } : item
    ));
  };

  const calculateEndTime = (startTime: string, duration: string) => {
    if (!startTime || !duration) return "";
    const [hours, minutes] = startTime.split(":").map(Number);
    const totalMinutes = hours * 60 + minutes + parseInt(duration);
    const endHours = Math.floor(totalMinutes / 60);
    const endMins = totalMinutes % 60;
    return `${endHours.toString().padStart(2, "0")}:${endMins.toString().padStart(2, "0")}`;
  };

  // Team management functions
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
      toast({
        title: "Team member invited",
        description: `${newMember.name} has been added to the team.`,
      });
    }
  };

  const handleRemoveMember = (id: string) => {
    const memberToRemove = teamMembers.find(member => member.id === id);
    setTeamMembers(teamMembers.filter(member => member.id !== id));
    if (memberToRemove) {
      toast({
        title: "Team member removed",
        description: `${memberToRemove.name} has been removed from the team.`,
      });
    }
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

  const shareUrl = `${window.location.origin}/shared/board/${script.id}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    toast({
      title: "Link copied!",
      description: "Share link has been copied to your clipboard.",
    });
  };

  const handleEmailShare = () => {
    if (!emailRecipient) {
      toast({
        title: "Email required",
        description: "Please enter an email address to share with.",
        variant: "destructive",
      });
      return;
    }
    
    const subject = `Check out my Viddy board: ${title}`;
    const body = `I wanted to share my Viddy board with you!\n\nBoard: ${title}\nView it here: ${shareUrl}`;
    const mailtoUrl = `mailto:${emailRecipient}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    
    window.open(mailtoUrl, '_blank');
    setEmailRecipient("");
    setShareDialogOpen(false);
    toast({
      title: "Email opened",
      description: "Your email client should now open with the share message.",
    });
  };

  // Script point management
  const handleAddPoint = () => {
    if (newPoint.trim()) {
      const updatedContent = content ? `${content}\n${newPoint.trim()}` : newPoint.trim();
      setContent(updatedContent);
      setNewPoint("");
    }
  };

  const handlePointKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleAddPoint();
    }
  };

  // Point editing functions
  const handleEditPoint = (index: number) => {
    const lines = content.split('\n').filter(line => line.trim());
    setEditingPointIndex(index);
    setEditingPointText(lines[index] || "");
  };

  const handleSavePoint = () => {
    if (editingPointIndex !== null && editingPointText.trim()) {
      const lines = content.split('\n').filter(line => line.trim());
      lines[editingPointIndex] = editingPointText.trim();
      setContent(lines.join('\n'));
      setEditingPointIndex(null);
      setEditingPointText("");
    }
  };

  const handleCancelEdit = () => {
    setEditingPointIndex(null);
    setEditingPointText("");
  };

  const handleDeletePoint = (index: number) => {
    const lines = content.split('\n').filter(line => line.trim());
    lines.splice(index, 1);
    setContent(lines.join('\n'));
  };

  // Script import functionality
  const handleImportScript = () => {
    if (importText.trim()) {
      let lines: string[] = [];
      
      if (splitMethod === "sentence") {
        // Split by sentences - look for periods, exclamation marks, and question marks
        lines = importText
          .split(/[.!?]+/)
          .map(sentence => sentence.trim())
          .filter(sentence => sentence.length > 0);
      } else {
        // Split by line breaks (default)
        lines = importText.split('\n').filter(line => line.trim());
      }
      
      // Format each line as a bullet point and join them
      const formattedContent = lines.map(line => line.trim()).join('\n');
      
      // Add to existing content or replace it
      const updatedContent = content ? `${content}\n${formattedContent}` : formattedContent;
      setContent(updatedContent);
      
      // Clear import text and close dialog
      setImportText("");
      setImportDialogOpen(false);
      
      toast({
        title: "Script imported!",
        description: `Successfully imported ${lines.length} talking points.`,
      });
    }
  };

  // List management functions
  const handleShotListCheck = (id: string) => {
    setShotList(prev => prev.map(item => 
      item.id === id ? { ...item, checked: !item.checked } : item
    ));
  };

  const handleGearListCheck = (id: string) => {
    setGearList(prev => prev.map(item => 
      item.id === id ? { ...item, checked: !item.checked } : item
    ));
  };

  const handleAddShotItem = () => {
    if (newShotItem.trim()) {
      setShotList(prev => [...prev, {
        id: Date.now().toString(),
        text: newShotItem.trim(),
        checked: false
      }]);
      setNewShotItem("");
    }
  };

  const handleAddGearItem = () => {
    if (newGearItem.trim()) {
      setGearList(prev => [...prev, {
        id: Date.now().toString(),
        text: newGearItem.trim(),
        checked: false
      }]);
      setNewGearItem("");
    }
  };

  const handleRemoveShotItem = (id: string) => {
    setShotList(prev => prev.filter(item => item.id !== id));
  };

  const handleRemoveGearItem = (id: string) => {
    setGearList(prev => prev.filter(item => item.id !== id));
  };

  // Editor Guides management functions
  const handlePartNameChange = (partId: string, newName: string) => {
    setEditorGuides(prev => prev.map(part => 
      part.id === partId ? { ...part, partName: newName } : part
    ));
  };

  const handleRemovePart = (partId: string) => {
    setEditorGuides(prev => prev.filter(part => part.id !== partId));
  };

  const handleAddVersion = (partId: string) => {
    setEditorGuides(prev => prev.map(part => 
      part.id === partId 
        ? { 
            ...part, 
            versions: [...part.versions, { 
              fileName: `Editor_Guide_${part.partName}_v${part.versions.length + 1}.pdf`, 
              uploadDate: new Date() 
            }] 
          }
        : part
    ));
  };

  const handleRemoveVersion = (partId: string, versionIndex: number) => {
    setEditorGuides(prev => prev.map(part => 
      part.id === partId 
        ? { 
            ...part, 
            versions: part.versions.filter((_, index) => index !== versionIndex) 
          }
        : part
    ));
  };

  const handleDownloadGuide = (partId: string, versionIndex: number) => {
    const part = editorGuides.find(p => p.id === partId);
    if (part && part.versions[versionIndex]) {
      toast({
        title: "Download started",
        description: `Downloading ${part.versions[versionIndex].fileName}`,
      });
      // In a real app, this would trigger an actual file download
    }
  };

  // Drag and drop functionality for script points
  const handleDragEnd = (result: DropResult) => {
    const { destination, source } = result;

    // If dropped outside the list or in the same position, do nothing
    if (!destination || (destination.index === source.index)) {
      return;
    }

    // Reorder the script points
    const lines = content.split('\n').filter(line => line.trim());
    const [reorderedItem] = lines.splice(source.index, 1);
    lines.splice(destination.index, 0, reorderedItem);
    
    // Update content with reordered points
    setContent(lines.join('\n'));
    
    // Reset editing state if we were editing a point
    if (editingPointIndex !== null) {
      setEditingPointIndex(null);
      setEditingPointText("");
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
          
          <div className="flex items-center space-x-3">
            <Button
              onClick={onRecord}
              className="bg-studio-record hover:bg-studio-record/90 text-white"
            >
              Record
            </Button>
          </div>
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
          </TabsList>

          <TabsContent value="script" className="mt-6 h-full flex flex-col">
            <div className="bg-studio-card border border-border rounded-lg flex-1 flex flex-col">
              {/* Script Points */}
              <div className="p-6 flex-1 overflow-y-auto">
                <DragDropContext onDragEnd={handleDragEnd}>
                  <Droppable droppableId="script-points">
                    {(provided) => (
                      <div 
                        {...provided.droppableProps} 
                        ref={provided.innerRef}
                        className="space-y-3"
                      >
                        {content.split('\n').filter(line => line.trim()).map((line, index) => (
                          <Draggable key={`point-${index}`} draggableId={`point-${index}`} index={index}>
                            {(provided, snapshot) => (
                              <div 
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                className={`bg-black/40 rounded-lg p-4 flex items-start space-x-4 group ${
                                  snapshot.isDragging ? 'shadow-lg ring-2 ring-white/20' : ''
                                }`}
                              >
                                <div {...provided.dragHandleProps} className="flex items-center space-x-2">
                                  <GripVertical className="w-4 h-4 text-white/40 hover:text-white/80 cursor-grab active:cursor-grabbing" />
                                  <span className="text-white font-bold text-lg min-w-[24px]">
                                    {index + 1}
                                  </span>
                                </div>
                                {editingPointIndex === index ? (
                                  <div className="flex-1 space-y-3">
                                    <Textarea
                                      value={editingPointText}
                                      onChange={(e) => setEditingPointText(e.target.value)}
                                      className="w-full text-white text-base leading-relaxed bg-white/10 border-white/20 resize-none min-h-[80px]"
                                      onKeyDown={(e) => {
                                        if (e.key === 'Enter' && e.ctrlKey) {
                                          handleSavePoint();
                                        }
                                        if (e.key === 'Escape') {
                                          handleCancelEdit();
                                        }
                                      }}
                                    />
                                    <div className="flex space-x-2">
                                      <Button
                                        onClick={handleSavePoint}
                                        size="sm"
                                        className="bg-studio-accent text-studio-bg hover:bg-studio-accent/90"
                                      >
                                        Save
                                      </Button>
                                      <Button
                                        onClick={handleCancelEdit}
                                        variant="outline"
                                        size="sm"
                                        className="bg-transparent border-white/20 text-white hover:bg-white/10"
                                      >
                                        Cancel
                                      </Button>
                                    </div>
                                  </div>
                                ) : (
                                  <>
                                    <p className="text-white text-base leading-relaxed flex-1">
                                      {line.trim()}
                                    </p>
                                    <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                      <Button
                                        onClick={() => handleEditPoint(index)}
                                        variant="ghost"
                                        size="sm"
                                        className="h-6 w-6 p-0 text-white/60 hover:text-white hover:bg-white/10"
                                      >
                                        <Edit className="w-3 h-3" />
                                      </Button>
                                      <Button
                                        onClick={() => handleDeletePoint(index)}
                                        variant="ghost"
                                        size="sm"
                                        className="h-6 w-6 p-0 text-red-400 hover:text-red-300 hover:bg-red-500/20"
                                      >
                                        <Trash2 className="w-3 h-3" />
                                      </Button>
                                    </div>
                                  </>
                                )}
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                        {(!content || content.trim() === '') && (
                          <div className="text-studio-muted text-base italic text-center py-8">
                            No script content yet. Add content to see numbered talking points.
                          </div>
                        )}
                      </div>
                    )}
                  </Droppable>
                </DragDropContext>
              </div>
              
              {/* Typing Bar */}
              <div className="p-4 border-t border-border bg-black/20">
                <div className="flex space-x-3">
                  <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
                    <DialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 bg-black hover:bg-black/80 border border-white rounded-full flex items-center justify-center"
                        title="Import Script"
                      >
                        <Plus className="h-3 w-3 text-white" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md">
                      <DialogHeader>
                        <DialogTitle>Import Script</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="import-script">Paste your script content</Label>
                          <Textarea
                            id="import-script"
                            value={importText}
                            onChange={(e) => setImportText(e.target.value)}
                            placeholder="Paste your script here. Each line will become a numbered talking point..."
                            className="min-h-[200px] resize-none"
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="split-method">Split:</Label>
                          <Select value={splitMethod} onValueChange={setSplitMethod}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="line">By Line Break</SelectItem>
                              <SelectItem value="sentence">By Sentence</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div className="flex space-x-2 justify-end">
                          <Button
                            variant="outline"
                            onClick={() => {
                              setImportText("");
                              setImportDialogOpen(false);
                            }}
                          >
                            Cancel
                          </Button>
                          <Button
                            onClick={handleImportScript}
                            disabled={!importText.trim()}
                            className="bg-studio-accent hover:bg-studio-accent/90 text-studio-bg"
                          >
                            Import
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                  
                  <Input
                    value={newPoint}
                    onChange={(e) => setNewPoint(e.target.value)}
                    onKeyDown={handlePointKeyPress}
                    placeholder="Enter Point Text..."
                    className="flex-1 bg-black/40 border-studio-border text-white placeholder:text-studio-muted"
                  />
                </div>
              </div>
            </div>
          </TabsContent>


          <TabsContent value="details" className="mt-6">
            <div className="bg-studio-card border border-border rounded-lg p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="location" className="text-sm font-medium text-studio-text">Location</Label>
                  <Input 
                    id="location" 
                    placeholder="Enter shooting location" 
                    className="bg-studio-bg border-studio-border text-studio-text"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium text-studio-text">Shoot Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-left font-normal bg-studio-bg border-studio-border text-studio-text hover:bg-studio-accent/20"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        <span>Pick a date</span>
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 bg-studio-card border-studio-border" align="start">
                      <Calendar
                        mode="single"
                        initialFocus
                        className="pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="callTime" className="text-sm font-medium text-studio-text">Call Time</Label>
                  <Input 
                    id="callTime" 
                    type="time" 
                    className="bg-studio-bg border-studio-border text-studio-text"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium text-studio-text">First Export</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-left font-normal bg-studio-bg border-studio-border text-studio-text hover:bg-studio-accent/20"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        <span>Pick a date</span>
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 bg-studio-card border-studio-border" align="start">
                      <Calendar
                        mode="single"
                        initialFocus
                        className="pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="notes" className="text-sm font-medium text-studio-text">Notes</Label>
                  <Textarea 
                    id="notes" 
                    placeholder="Add any additional notes or special instructions..."
                    className="min-h-[80px] bg-studio-bg border-studio-border text-studio-text"
                  />
                </div>
              </div>
              
              {/* Lists Section moved from Lists tab */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                {/* Shot List */}
                <div className="bg-studio-bg border border-border rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-studio-text">Shot List</h3>
                    <Badge variant="outline" className="bg-studio-accent/20 text-studio-accent border-studio-accent/30">
                      {shotList.filter(item => item.checked).length}/{shotList.length}
                    </Badge>
                  </div>
                  
                  <div className="space-y-3 max-h-64 overflow-y-auto mb-4">
                    {shotList.map((item) => (
                      <div key={item.id} className="flex items-center space-x-3 group">
                        <Checkbox
                          checked={item.checked}
                          onCheckedChange={() => handleShotListCheck(item.id)}
                          className="data-[state=checked]:bg-studio-accent data-[state=checked]:border-studio-accent"
                        />
                        <span className={`flex-1 ${item.checked ? 'line-through text-studio-muted' : 'text-studio-text'}`}>
                          {item.text}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveShotItem(item.id)}
                          className="opacity-0 group-hover:opacity-100 h-6 w-6 p-0 text-red-400 hover:text-red-300 hover:bg-red-500/20"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                  
                  <div className="flex space-x-2">
                    <Input
                      value={newShotItem}
                      onChange={(e) => setNewShotItem(e.target.value)}
                      placeholder="Add new shot..."
                      className="bg-studio-card border-studio-border text-studio-text"
                      onKeyPress={(e) => e.key === 'Enter' && handleAddShotItem()}
                    />
                    <Button
                      onClick={handleAddShotItem}
                      size="sm"
                      className="bg-studio-accent hover:bg-studio-accent/90 text-studio-bg"
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* Gear List */}
                <div className="bg-studio-bg border border-border rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-studio-text">Gear List</h3>
                    <Badge variant="outline" className="bg-studio-accent/20 text-studio-accent border-studio-accent/30">
                      {gearList.filter(item => item.checked).length}/{gearList.length}
                    </Badge>
                  </div>
                  
                  <div className="space-y-3 max-h-64 overflow-y-auto mb-4">
                    {gearList.map((item) => (
                      <div key={item.id} className="flex items-center space-x-3 group">
                        <Checkbox
                          checked={item.checked}
                          onCheckedChange={() => handleGearListCheck(item.id)}
                          className="data-[state=checked]:bg-studio-accent data-[state=checked]:border-studio-accent"
                        />
                        <span className={`flex-1 ${item.checked ? 'line-through text-studio-muted' : 'text-studio-text'}`}>
                          {item.text}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveGearItem(item.id)}
                          className="opacity-0 group-hover:opacity-100 h-6 w-6 p-0 text-red-400 hover:text-red-300 hover:bg-red-500/20"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                  
                  <div className="flex space-x-2">
                    <Input
                      value={newGearItem}
                      onChange={(e) => setNewGearItem(e.target.value)}
                      placeholder="Add new gear..."
                      className="bg-studio-card border-studio-border text-studio-text"
                      onKeyPress={(e) => e.key === 'Enter' && handleAddGearItem()}
                    />
                    <Button
                      onClick={handleAddGearItem}
                      size="sm"
                      className="bg-studio-accent hover:bg-studio-accent/90 text-studio-bg"
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="editing" className="mt-6">
            <div className="space-y-6">
              {/* Editor Guides Section */}
              <div className="bg-studio-card border border-border rounded-lg p-6">
                <div className="mb-4">
                  <h3 className="text-lg font-semibold text-studio-text">Editor Guides</h3>
                  <p className="text-sm text-studio-muted mt-1">Your recorded videos will be saved here</p>
                </div>

                {/* Parts organized left to right, versions top to bottom */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {editorGuides.map((part) => (
                    <div key={part.id} className="bg-studio-bg border border-studio-border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <Input
                          value={part.partName}
                          onChange={(e) => handlePartNameChange(part.id, e.target.value)}
                          className="text-sm font-medium bg-transparent border-none text-studio-text p-0 h-auto focus:ring-0"
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemovePart(part.id)}
                          className="h-6 w-6 p-0 text-red-400 hover:text-red-300 hover:bg-red-500/20"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>

                      {/* Versions stacked vertically */}
                      <div className="space-y-2">
                        {part.versions.map((version, versionIndex) => (
                          <div key={versionIndex} className="flex items-center space-x-2 p-2 bg-studio-card border border-studio-border rounded">
                            <FileText className="w-4 h-4 text-studio-accent" />
                            <span className="text-xs text-studio-text flex-1">v{versionIndex + 1}</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDownloadGuide(part.id, versionIndex)}
                              className="h-6 w-6 p-0 text-studio-accent hover:bg-studio-accent/20"
                            >
                              <Download className="w-3 h-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveVersion(part.id, versionIndex)}
                              className="h-6 w-6 p-0 text-red-400 hover:text-red-300 hover:bg-red-500/20"
                            >
                              <X className="w-3 h-3" />
                            </Button>
                          </div>
                        ))}
                        
                        <Button
                          onClick={() => handleAddVersion(part.id)}
                          variant="outline"
                          size="sm"
                          className="w-full border-dashed border-studio-border text-studio-muted hover:text-studio-text hover:border-studio-accent"
                        >
                          <Plus className="w-3 h-3 mr-1" />
                          Add Version
                        </Button>
                      </div>
                    </div>
                  ))}

                  {editorGuides.length === 0 && (
                    <div className="col-span-full text-center py-8 text-studio-muted">
                      <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>No videos recorded yet</p>
                      <p className="text-sm">Record your script to save videos here</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Editor Notes Section */}
              <div className="bg-studio-card border border-border rounded-lg p-6">
                <h3 className="text-lg font-semibold text-studio-text mb-4">Editor Notes</h3>
                <Textarea
                  value={editorNotes}
                  onChange={(e) => setEditorNotes(e.target.value)}
                  placeholder="Add notes for the editor after shooting your video..."
                  className="w-full h-48 resize-none bg-studio-bg border-studio-border text-studio-text text-base leading-relaxed"
                />
              </div>
            </div>
          </TabsContent>


        </Tabs>
      </div>

    </div>
  );
};