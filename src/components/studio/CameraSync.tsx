import { Button } from "@/components/ui/button";
import { Camera, Volume2, CheckCircle } from "lucide-react";

interface CameraSyncProps {
  onSync: () => void;
  onBack: () => void;
}

export const CameraSync = ({ onSync, onBack }: CameraSyncProps) => {
  const playBellSound = () => {
    // Create a simple bell sound using Web Audio API
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    // Create a bell-like sound with multiple frequencies
    const frequencies = [800, 1000, 1200];
    const duration = 0.8;
    
    frequencies.forEach((freq, index) => {
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.value = freq;
      oscillator.type = 'sine';
      
      // Bell envelope
      gainNode.gain.setValueAtTime(0, audioContext.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.3 / (index + 1), audioContext.currentTime + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + duration);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + duration);
    });
    
    // Navigate to teleprompter after bell sound
    setTimeout(() => {
      onSync();
    }, 1000);
  };

  return (
    <div className="flex-1 flex flex-col bg-studio-bg">
      {/* Header */}
      <header className="bg-studio-surface px-6 py-4 border-b border-studio-border">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold text-studio-text">Camera Sync</h1>
          <Button
            variant="ghost"
            onClick={onBack}
            className="text-studio-muted hover:text-studio-text"
          >
            Back to Editor
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="max-w-md text-center space-y-8">
          <div className="w-20 h-20 mx-auto bg-studio-accent/10 rounded-full flex items-center justify-center">
            <Camera className="w-10 h-10 text-studio-accent" />
          </div>
          
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-studio-text">
              Sync Your Camera with Viddy
            </h2>
            <p className="text-studio-muted leading-relaxed">
              Follow these steps to perfectly sync your camera recording with your script:
            </p>
          </div>

          <div className="space-y-6 text-left">
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-studio-accent text-studio-bg rounded-full flex items-center justify-center text-sm font-bold mt-0.5">
                1
              </div>
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-1">
                  <Volume2 className="w-4 h-4 text-studio-accent" />
                  <p className="font-medium text-studio-text">Turn up your volume</p>
                </div>
                <p className="text-sm text-studio-muted">
                  Make sure your computer or device volume is loud enough to hear the sync bell.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-studio-accent text-studio-bg rounded-full flex items-center justify-center text-sm font-bold mt-0.5">
                2
              </div>
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-1">
                  <Camera className="w-4 h-4 text-studio-accent" />
                  <p className="font-medium text-studio-text">Start recording on your camera</p>
                </div>
                <p className="text-sm text-studio-muted">
                  Press record on your camera or phone first, then come back here.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-studio-accent text-studio-bg rounded-full flex items-center justify-center text-sm font-bold mt-0.5">
                3
              </div>
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-1">
                  <CheckCircle className="w-4 h-4 text-studio-accent" />
                  <p className="font-medium text-studio-text">Hit "Sync" when ready</p>
                </div>
                <p className="text-sm text-studio-muted">
                  The bell sound will help you sync your audio in post-production.
                </p>
              </div>
            </div>
          </div>

          <Button
            onClick={playBellSound}
            className="w-full bg-studio-accent text-studio-bg hover:bg-studio-accent/90 text-lg py-6"
          >
            🔔 Sync & Start Recording
          </Button>
        </div>
      </div>
    </div>
  );
};