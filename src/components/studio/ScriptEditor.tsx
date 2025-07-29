import { useState } from "react";
import { ArrowLeft, CalendarIcon, Plus, Clock, Video, Trash2, Share, Copy, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
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
  const [lists, setLists] = useState("");
  const [details, setDetails] = useState("");
  const [editing, setEditing] = useState("");
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [emailRecipient, setEmailRecipient] = useState("");
  
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
            <div className="bg-studio-card border border-border rounded-lg p-6 h-96">
              <Textarea
                value={editing}
                onChange={(e) => setEditing(e.target.value)}
                placeholder="Add post-production editing notes..."
                className="w-full h-full resize-none bg-transparent border-none text-studio-text text-base leading-relaxed focus:ring-0 focus:outline-none"
              />
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