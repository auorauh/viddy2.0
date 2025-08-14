import { useState, useEffect } from "react";
import { ArrowLeft, RotateCcw, Play, Square, Pause, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { ScriptBoard } from "../../pages/Studio";

interface TeleprompterModeProps {
  script: ScriptBoard;
  onBack: () => void;
}

export const TeleprompterMode = ({ script, onBack }: TeleprompterModeProps) => {
  const [scriptPoints, setScriptPoints] = useState<string[]>([]);
  const [currentPoint, setCurrentPoint] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingState, setRecordingState] = useState<'idle' | 'countdown' | 'recording'>('idle');
  const [countdown, setCountdown] = useState(3);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState("");

  // Break script into bullet points/sentences
  useEffect(() => {
    const points = script.content
      .split(/[.!?]+/)
      .map(point => point.trim())
      .filter(point => point.length > 10); // Filter out very short fragments
    setScriptPoints(points);
  }, [script.content]);

  // Countdown timer
  useEffect(() => {
    if (recordingState === 'countdown' && countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (recordingState === 'countdown' && countdown === 0) {
      setRecordingState('recording');
      setIsRecording(true);
    }
  }, [recordingState, countdown]);

  // Recording timer - starts immediately when component mounts
  useEffect(() => {
    const timer = setInterval(() => {
      setRecordingTime(prev => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleStartRecording = () => {
    setCountdown(3);
    setRecordingTime(0);
    setRecordingState('countdown');
  };

  const handleStopRecording = () => {
    setRecordingState('idle');
    setIsRecording(false);
    setRecordingTime(0);
  };

  const handleNextPoint = () => {
    if (currentPoint < scriptPoints.length - 1) {
      setCurrentPoint(currentPoint + 1);
      setRecordingState('idle');
      setIsRecording(false);
      setRecordingTime(0);
    }
  };

  const handleRedoPoint = () => {
    setRecordingState('idle');
    setIsRecording(false);
    setRecordingTime(0);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const openTeleprompterWindow = () => {
    const newWindow = window.open('', '_blank', 'width=800,height=600,scrollbars=yes,resizable=yes');
    if (newWindow) {
      newWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Teleprompter</title>
            <style>
              body {
                margin: 0;
                padding: 40px;
                background: black;
                color: white;
                font-family: system-ui, -apple-system, sans-serif;
                display: flex;
                align-items: center;
                justify-content: center;
                min-height: 100vh;
                text-align: center;
              }
              .content {
                font-size: 2.5rem;
                line-height: 1.6;
                font-weight: 300;
                max-width: 80%;
              }
            </style>
          </head>
          <body>
            <div class="content">
              ${currentText}
            </div>
          </body>
        </html>
      `);
      newWindow.document.close();
    }
  };

  const handleEditStart = () => {
    setEditText(scriptPoints[currentPoint] || "");
    setIsEditing(true);
  };

  const handleEditSave = () => {
    const updatedPoints = [...scriptPoints];
    updatedPoints[currentPoint] = editText;
    setScriptPoints(updatedPoints);
    setIsEditing(false);
  };

  const handleEditCancel = () => {
    setIsEditing(false);
    setEditText("");
  };

  const currentText = scriptPoints[currentPoint] || "Script completed!";

  return (
    <div className="flex-1 flex flex-col bg-black">
      {/* Recording Header */}
      <header className="bg-studio-record px-6 py-3 flex items-center text-white relative">
        <div className="flex items-center space-x-4">
          <span className="text-sm font-mono">
            {String(currentPoint + 1).padStart(2, '0')}/{String(scriptPoints.length).padStart(2, '0')}
          </span>
          <span className="text-sm">Font Size: 38px</span>
          <button
            onClick={openTeleprompterWindow}
            className="text-sm text-white hover:text-white/80 underline cursor-pointer"
          >
            Teleprompter
          </button>
          <div className="flex-1 bg-white/20 h-2 rounded-full max-w-32">
            <div 
              className="bg-white h-full rounded-full transition-all"
              style={{ width: `${((currentPoint + 1) / scriptPoints.length) * 100}%` }}
            />
          </div>
        </div>
        
        {/* Centered Timer */}
        <div className="absolute left-1/2 transform -translate-x-1/2">
          <span className="text-lg font-mono font-bold">{formatTime(recordingTime)}</span>
        </div>
        
        {/* Edit and Pause buttons moved to absolute far right */}
        <div className="absolute right-6 flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleEditStart}
            className="text-white hover:bg-white/10"
          >
            <Edit className="mr-1 h-4 w-4" />
            Edit
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="text-white hover:bg-white/10"
          >
            Pause
          </Button>
        </div>
      </header>

      {/* Main Teleprompter Area */}
      <div 
        className="flex-1 flex items-center justify-center p-12 cursor-pointer"
        onClick={!isEditing && (recordingState === 'idle' ? handleStartRecording : handleStopRecording)}
      >
        <div className="max-w-4xl text-center">
          {!isEditing && recordingState === 'idle' && (
            <p className="text-white/60 text-lg mb-8">
              Click anywhere or space bar to start
            </p>
          )}
          
          {!isEditing && recordingState === 'countdown' && (
            <div className="text-studio-accent text-8xl font-bold mb-8">
              {countdown}
            </div>
          )}
          
          {!isEditing && recordingState === 'recording' && (
            <div className="flex items-center justify-center mb-8 space-x-4">
              <div className="w-4 h-4 bg-studio-record rounded-full animate-pulse" />
              <span className="text-studio-record text-lg font-medium">RECORDING</span>
            </div>
          )}
          
          {isEditing ? (
            <div className="w-full max-w-2xl">
              <Textarea
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                className="w-full min-h-[200px] text-white text-2xl leading-relaxed font-light bg-white/10 border-white/20 resize-none"
                placeholder="Edit your script point..."
              />
              <div className="flex justify-center space-x-4 mt-6">
                <Button
                  onClick={handleEditSave}
                  className="bg-studio-accent text-studio-bg hover:bg-studio-accent/90"
                >
                  Save
                </Button>
                <Button
                  variant="outline"
                  onClick={handleEditCancel}
                  className="bg-transparent border-white/20 text-white hover:bg-white/10"
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <p className="text-white text-4xl leading-relaxed font-light">
              {currentText}
            </p>
          )}
        </div>
      </div>

      {/* Control Buttons */}
      {recordingState === 'idle' && currentPoint < scriptPoints.length && (
        <div className="p-6 flex justify-center space-x-4">
          <Button
            variant="outline"
            onClick={handleRedoPoint}
            className="bg-transparent border-white/20 text-white hover:bg-white/10"
          >
            <RotateCcw className="mr-2 h-4 w-4" />
            Redo
          </Button>
          
          {recordingTime > 0 && (
            <Button
              onClick={handleNextPoint}
              className="bg-studio-accent text-studio-bg hover:bg-studio-accent/90"
            >
              Next Point
            </Button>
          )}
        </div>
      )}

      {/* Completion Message */}
      {currentPoint >= scriptPoints.length && (
        <div className="p-6 flex justify-center">
          <Button
            onClick={onBack}
            className="bg-studio-accent text-studio-bg hover:bg-studio-accent/90"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Editor
          </Button>
        </div>
      )}
    </div>
  );
};