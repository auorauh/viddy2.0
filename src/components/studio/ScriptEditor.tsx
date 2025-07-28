import { useState } from "react";
import { ArrowLeft, CalendarIcon, Plus, Clock, Video, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
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