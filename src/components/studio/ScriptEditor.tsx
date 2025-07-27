import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { ScriptBoard } from "../../pages/Studio";

interface ScriptEditorProps {
  script: ScriptBoard;
  onRecord: () => void;
  onBack: () => void;
}

export const ScriptEditor = ({ script, onRecord, onBack }: ScriptEditorProps) => {
  const [content, setContent] = useState(script.content);

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
            <h1 className="text-xl font-bold text-studio-text border border-border rounded px-3 py-1">
              {script.title}
            </h1>
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
              <p className="text-studio-muted">Bullet points and lists for your script</p>
            </div>
          </TabsContent>

          <TabsContent value="details" className="mt-6">
            <div className="bg-studio-card border border-border rounded-lg p-6 h-96">
              <p className="text-studio-muted">Production details and notes</p>
            </div>
          </TabsContent>

          <TabsContent value="editing" className="mt-6">
            <div className="bg-studio-card border border-border rounded-lg p-6 h-96">
              <p className="text-studio-muted">Post-production editing notes</p>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};