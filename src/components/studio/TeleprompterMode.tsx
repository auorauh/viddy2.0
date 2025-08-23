import { useState, useEffect } from "react";
import { ArrowLeft, RotateCcw, Play, Square, Pause, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import type { ScriptBoard } from "../../pages/Studio";

interface TeleprompterModeProps {
  script: ScriptBoard;
  onBack: () => void;
  onFinish: () => void;
}

export const TeleprompterMode = ({ script, onBack, onFinish }: TeleprompterModeProps) => {
  const [scriptPoints, setScriptPoints] = useState<string[]>([]);
  const [currentPoint, setCurrentPoint] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingState, setRecordingState] = useState<'idle' | 'countdown' | 'recording'>('idle');
  const [countdown, setCountdown] = useState(3);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState("");
  const [hasRecordedCurrentPoint, setHasRecordedCurrentPoint] = useState(false);
  const [isSmall, setIsSmall] = useState(false);
  const [mobileView, setMobile] = useState(false);
  const [fontSize, setFontSize] = useState(5);

  // Break script into bullet points/sentences
useEffect(() => {
  const points = script.content
    .split(/[.!?]+/)
    .map(point => point.trim())
    .filter(point => point.length > 10);
  setScriptPoints(points);

  checkScreen();

  window.addEventListener("resize", checkScreen);
  return () => window.removeEventListener("resize", checkScreen);
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
  //spacebar listener and action
    useEffect(() => {
      const spaceBarAction = (e) => {
        if (e.code === 'Space') {
          e.preventDefault();
          if(hasRecordedCurrentPoint && !isEditing && recordingState === "idle" && currentPoint+1 == scriptPoints.length) {
            finishRecording();
          } else if (hasRecordedCurrentPoint && !isEditing && recordingState === "idle") {
            handleNextPoint();
          }
          if (!isEditing && recordingState === "idle" ) {
            handleStartRecording();
          } else if (!isEditing && recordingState === "recording") {
            handleStopRecording();
          }
        }
        if (e.code === 'ArrowLeft') {
          handlePreviousPoint();
        }
      };

      window.addEventListener("keydown", spaceBarAction);
      return () => window.removeEventListener("keydown", spaceBarAction);
    }, [isEditing, recordingState,hasRecordedCurrentPoint]);

  // Recording timer - starts immediately when component mounts
  useEffect(() => {
    const timer = setInterval(() => {
      setRecordingTime(prev => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const checkScreen = () => {
  const isMobile = window.innerWidth < 600;
  if (isMobile)  {setFontSize(1.5);}
  setMobile(isMobile);

};

  const handleStartRecording = () => {
    setCountdown(3);
    setRecordingTime(0);
    setRecordingState('countdown');
  };

  const handleStopRecording = () => {
    setRecordingState('idle');
    setIsRecording(false);
    setHasRecordedCurrentPoint(true);
    setRecordingTime(0);
  };

  const handleNextPoint = () => {
    if (currentPoint < scriptPoints.length - 1) {
      setCurrentPoint(currentPoint + 1);
      setRecordingState('idle');
      setIsRecording(false);
      setHasRecordedCurrentPoint(false);
      setRecordingTime(0);
    }
  };

  const handleRedoPoint = () => {
    setRecordingState('idle');
    setIsRecording(false);
    setHasRecordedCurrentPoint(false);
    setRecordingTime(0);
  };
  const handlePreviousPoint = () => {
    setCurrentPoint(currentPoint - 1);
    setRecordingState('idle');
    setIsRecording(false);
    setHasRecordedCurrentPoint(false);
  }

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
            <div class="content" style="font-size: ${fontSize}rem;">
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
  
  const finishRecording = () => {
    //TODO: SRT FILE Generation here 
    onFinish();
  }

  const currentText = scriptPoints[currentPoint] || "Script completed!";

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black">
      {/* Recording Header */}
      <header className="bg-studio-record px-6 py-3 flex items-center text-white relative flex-wrap">
        <div className="flex items-center space-x-4">
          <span className="text-sm font-mono">
            {String(currentPoint + 1).padStart(2, '0')}/{String(scriptPoints.length).padStart(2, '0')}
          </span>
          {mobileView ?
          <div className="relative w-48">
            <label className="block mb-1 text-sm text-white">Font Size</label>
            <select
              value={fontSize}
              onChange={(e) => setFontSize(Number(e.target.value))}
              className="w-[75px] bg-studio-record text-white p-2 rounded border border-gray-600 focus:outline-none focus:ring-2 focus:ring-yellow-500"
            >
              <option value={1.5}>1</option>
              <option value={1.75}>2</option>
              <option value={2}>3</option>
              <option value={2.5}>4</option>
              <option value={3}>5</option>
            </select>
          </div>
          : 
          <>
          <span className="text-sm">Font Size: {fontSize}</span>
                <input
                  type="range"
                  min="2"
                  max="9"
                  value={fontSize}
                  onChange={(e) => setFontSize(Number(e.target.value))}
                  className="
                    w-[150px] h-2
                    bg-gray-300 rounded-lg appearance-none cursor-pointer
                    accent-yellow-500
                  "
                />
          </>
          }
          {mobileView ? <></> : 
          <button
            onClick={openTeleprompterWindow}
            className="text-sm text-white hover:text-white/80 underline cursor-pointer"
          >
            Teleprompter
          </button>
          }
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
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="text-white hover:bg-white/10"
              >
                End
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>End Recording Session?</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to end early? Your progress will be saved.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>No</AlertDialogCancel>
                <AlertDialogAction onClick={onBack}>Yes</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </header>

      {/* Main Teleprompter Area */}
      <div 
        className="flex-1 flex items-center justify-center p-12 cursor-pointer w-full overflow-y-auto"
        onClick={!isEditing && (recordingState === 'idle' ? handleStartRecording : handleStopRecording)}
      >
        <div className="w-full text-center">
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
                className="min-w-[300px] min-h-[600px] text-white text-2xl leading-relaxed font-light bg-white/10 border-white/20 resize-none"
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
            <p className="w-full text-white text-4xl leading-relaxed font-light" style={{ fontSize: `${fontSize}rem` }}>
              {currentText}
            </p>
          )}
        </div>
      </div>

      {/* Control Buttons */}
      {recordingState === 'idle' && currentPoint < scriptPoints.length && hasRecordedCurrentPoint && (
        <div className="p-6 flex justify-center space-x-4">
          {currentPoint === 0 ? <></> : 
          <Button
            onClick={handlePreviousPoint}
            className="bg-studio-accent text-studio-bg hover:bg-studio-accent/90">
            Go back
          </Button>}
          <Button
            variant="outline"
            onClick={handleRedoPoint}
            className="bg-transparent border-white/20 text-white hover:bg-white/10"
          >
            <RotateCcw className="mr-2 h-4 w-4" />
            Redo
          </Button>
          
            {currentPoint+1 == scriptPoints.length ? 
                    <Button
            onClick={finishRecording}
            className="bg-studio-accent text-studio-bg hover:bg-studio-accent/90"
          >
            Finish Recording
          </Button>
           : 
          <Button
            onClick={handleNextPoint}
            className="bg-studio-accent text-studio-bg hover:bg-studio-accent/90"
          >
            Next Point
          </Button>
            }
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