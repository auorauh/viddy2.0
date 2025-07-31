import { useState } from "react";
import { ArrowLeft, CalendarIcon, Plus, Clock, Video, Trash2, Share, Copy, Mail, FileText, Download, X, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
            <Dialog open={shareDialogOpen} onOpenChange={setShareDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-studio-muted hover:text-studio-text"
                >
                  <Share className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Share Board</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Send to email</Label>
                    <div className="flex space-x-2">
                      <Input
                        id="email"
                        type="email"
                        placeholder="Enter email address"
                        value={emailRecipient}
                        onChange={(e) => setEmailRecipient(e.target.value)}
                        className="flex-1"
                      />
                      <Button onClick={handleEmailShare} size="sm">
                        <Mail className="h-4 w-4 mr-2" />
                        Send
                      </Button>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <div className="flex-1 h-px bg-border"></div>
                    <span className="text-xs text-muted-foreground">OR</span>
                    <div className="flex-1 h-px bg-border"></div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Copy share link</Label>
                    <div className="flex space-x-2">
                      <Input
                        value={shareUrl}
                        readOnly
                        className="flex-1"
                      />
                      <Button onClick={handleCopyLink} size="sm">
                        <Copy className="h-4 w-4 mr-2" />
                        Copy
                      </Button>
                    </div>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
            
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
              value="lists"
              className="data-[state=active]:bg-studio-accent data-[state=active]:text-studio-bg"
            >
              Lists
            </TabsTrigger>
            <TabsTrigger 
              value="editing"
              className="data-[state=active]:bg-studio-accent data-[state=active]:text-studio-bg"
            >
              Editing
            </TabsTrigger>
            <TabsTrigger 
              value="schedule"
              className="data-[state=active]:bg-studio-accent data-[state=active]:text-studio-bg"
            >
              Schedule
            </TabsTrigger>
          </TabsList>

          <TabsContent value="script" className="mt-6 h-full flex flex-col">
            <div className="bg-studio-card border border-border rounded-lg flex-1 flex flex-col">
              {/* Script Points */}
              <div className="p-6 flex-1 overflow-y-auto">
                <div className="space-y-3">
                  {content.split('\n').filter(line => line.trim()).map((line, index) => (
                    <div key={index} className="bg-black/40 rounded-lg p-4 flex items-start space-x-4">
                      <span className="text-white font-bold text-lg min-w-[24px]">
                        {index + 1}
                      </span>
                      <p className="text-white text-base leading-relaxed flex-1">
                        {line.trim()}
                      </p>
                    </div>
                  ))}
                  {(!content || content.trim() === '') && (
                    <div className="text-studio-muted text-base italic text-center py-8">
                      No script content yet. Add content to see numbered talking points.
                    </div>
                  )}
                </div>
              </div>
              
              {/* Typing Bar */}
              <div className="p-4 border-t border-border bg-black/20">
                <div className="flex space-x-3">
                  <div className="flex space-x-2 flex-1">
                    <Input
                      value={newPoint}
                      onChange={(e) => setNewPoint(e.target.value)}
                      onKeyDown={handlePointKeyPress}
                      placeholder="Enter Point Text..."
                      className="flex-1 bg-black/40 border-studio-border text-white placeholder:text-studio-muted"
                    />
                    <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
                      <DialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-10 w-10 p-0 bg-studio-accent/20 hover:bg-studio-accent/30 border border-studio-accent/30 rounded-full"
                          title="Import Script"
                        >
                          <div className="relative">
                            <div className="w-6 h-6 rounded-full bg-studio-accent/10 flex items-center justify-center">
                              <Plus className="h-3 w-3 text-studio-accent" />
                            </div>
                          </div>
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
                  </div>
                  <Button
                    onClick={handleAddPoint}
                    disabled={!newPoint.trim()}
                    className="bg-studio-accent hover:bg-studio-accent/90 text-studio-bg px-6"
                  >
                    Add Point
                  </Button>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="lists" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Shot List */}
              <div className="bg-studio-card border border-border rounded-lg p-6">
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
                    className="bg-studio-bg border-studio-border text-studio-text"
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
              <div className="bg-studio-card border border-border rounded-lg p-6">
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
                    className="bg-studio-bg border-studio-border text-studio-text"
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
            </div>
          </TabsContent>

          <TabsContent value="editing" className="mt-6">
            <div className="space-y-6">
              {/* Editor Guides Section */}
              <div className="bg-studio-card border border-border rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-studio-text">Editor Guides</h3>
                  <Button
                    onClick={() => {
                      const newPart = `Part ${editorGuides.length + 1}`;
                      setEditorGuides(prev => [...prev, {
                        id: Date.now().toString(),
                        partName: newPart,
                        versions: []
                      }]);
                    }}
                    size="sm"
                    className="bg-studio-accent hover:bg-studio-accent/90 text-studio-bg"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Part
                  </Button>
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
                      <p>No editor guides yet</p>
                      <p className="text-sm">Click "Add Part" to create your first guide</p>
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

          <TabsContent value="schedule" className="mt-6">
            <div className="bg-studio-card border border-border rounded-lg p-6 space-y-6 max-h-96 overflow-y-auto">
              {/* Add Schedule Item Section */}
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-studio-text flex items-center">
                  <Clock className="w-5 h-5 mr-2" />
                  Shooting Schedule
                </h3>
                <Button 
                  onClick={handleAddScheduleItem}
                  className="bg-studio-accent hover:bg-studio-accent/90 text-studio-bg"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Scene
                </Button>
              </div>

              {/* Schedule Items List */}
              <div className="space-y-4">
                {scheduleItems.map((item, index) => (
                  <div key={item.id} className="p-4 bg-studio-bg border border-studio-border rounded-lg">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-start">
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-studio-text">Scene</Label>
                        <Input
                          value={item.scene}
                          onChange={(e) => handleScheduleItemChange(item.id, "scene", e.target.value)}
                          placeholder="Scene name/number"
                          className="bg-studio-card border-studio-border text-studio-text"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-studio-text">Start Time</Label>
                        <Input
                          type="time"
                          value={item.startTime}
                          onChange={(e) => handleScheduleItemChange(item.id, "startTime", e.target.value)}
                          className="bg-studio-card border-studio-border text-studio-text"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-studio-text">Duration (min)</Label>
                        <Input
                          type="number"
                          value={item.duration}
                          onChange={(e) => handleScheduleItemChange(item.id, "duration", e.target.value)}
                          placeholder="30"
                          className="bg-studio-card border-studio-border text-studio-text"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-studio-text">End Time</Label>
                        <div className="flex items-center space-x-2">
                          <Badge variant="outline" className="bg-studio-accent/20 text-studio-accent border-studio-accent/30">
                            <Clock className="w-3 h-3 mr-1" />
                            {calculateEndTime(item.startTime, item.duration) || "--:--"}
                          </Badge>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveScheduleItem(item.id)}
                            className="h-8 w-8 p-0 text-red-400 hover:text-red-300 hover:bg-red-500/20"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>

                      <div className="space-y-2 md:col-span-4">
                        <Label className="text-sm font-medium text-studio-text">Description</Label>
                        <Textarea
                          value={item.description}
                          onChange={(e) => handleScheduleItemChange(item.id, "description", e.target.value)}
                          placeholder="Scene description and filming notes..."
                          className="min-h-[60px] bg-studio-card border-studio-border text-studio-text"
                        />
                      </div>
                    </div>
                  </div>
                ))}

                {scheduleItems.length === 0 && (
                  <div className="text-center py-8 text-studio-muted">
                    <Video className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No scenes scheduled yet</p>
                    <p className="text-sm">Click "Add Scene" to start building your schedule</p>
                  </div>
                )}
              </div>

              {/* Schedule Summary */}
              {scheduleItems.length > 0 && (
                <div className="mt-6 p-4 bg-studio-bg border border-studio-border rounded-lg">
                  <h4 className="text-sm font-medium text-studio-text mb-3">Schedule Summary</h4>
                  <div className="space-y-2 text-xs text-studio-muted">
                    <div className="flex items-center justify-between">
                      <span>Total Scenes:</span>
                      <span className="font-medium text-studio-text">{scheduleItems.length}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Total Duration:</span>
                      <span className="font-medium text-studio-text">
                        {scheduleItems.reduce((total, item) => total + (parseInt(item.duration) || 0), 0)} minutes
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>First Scene:</span>
                      <span className="font-medium text-studio-text">
                        {scheduleItems.find(item => item.startTime)?.startTime || "--:--"}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>

    </div>
  );
};