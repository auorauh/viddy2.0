import type { ScriptBoard } from "../../pages/Studio";
import { Button } from "@/components/ui/button";
import { Camera, Volume2, CheckCircle,LaptopMinimalCheck } from "lucide-react";

interface FinishProps {
  script: ScriptBoard;
  onBack: () => void;
}


export const Finish = ({ script, onBack }: FinishProps) => {
  

  

  return (
    <div className="flex-1 flex flex-col bg-studio-bg">

      {/* Main Content */}
      <div className=" flex items-center justify-center p-8">
        <div className="max-w-md text-center space-y-8">
          <div className="w-20 h-20 mx-auto bg-studio-accent/10 rounded-full flex items-center justify-center">
            <Camera className="w-10 h-10 text-studio-accent" />
          </div>
          
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-studio-text">
              That's a wrap! If you need help editing with your editors guide, watch this video:
            </h2>
                <p className="text-sm text-studio-muted">
                    Youtube.com/LINKTOVIDEOGUIDEGOESHERE
                </p>
            <p className="text-studio-muted leading-relaxed">
              Follow these steps to perfectly sync your video recording with your editor guide:
            </p>
          </div>

            <div className="flex items-center space-x-3">
              <div className="w-6 h-6 bg-studio-accent text-studio-bg rounded-full flex items-center justify-center text-sm font-bold mt-0.5">
                1
              </div>
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-1">
                  <CheckCircle className="w-4 h-4 text-studio-accent" />
                  <p className="font-medium text-studio-text">Download your Editors guide</p>
                  <Button className="self-end">DOWNLOAD</Button>
                </div>
              </div>
            </div>

          <div className="space-y-6 text-left">
            <div className="flex items-center space-x-3">
              <div className="w-6 h-6 bg-studio-accent text-studio-bg rounded-full flex items-center justify-center text-sm font-bold mt-0.5">
                2
              </div>
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-1">
                  <LaptopMinimalCheck className="w-4 h-4 text-studio-accent"/>
                  <p className="font-medium text-studio-text">Open footage in your editing software</p>
                </div>
                <p className="text-sm text-studio-muted">
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <div className="w-6 h-6 bg-studio-accent text-studio-bg rounded-full flex items-center justify-center text-sm font-bold mt-0.5">
                3
              </div>
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-1">
                  <Camera className="w-6 h-6 text-studio-accent" />
                  <p className="font-medium text-studio-text">Make a cut at the first frame of the bell sound and delete everything before the bell</p>
                </div>
                <p className="text-sm text-studio-muted">
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <div className="w-6 h-6 bg-studio-accent  text-studio-bg rounded-full flex items-center justify-center text-sm font-bold mt-0.5">
                4
              </div>
              <div className="flex-1">
                <div className="flex items-center  space-x-2 mb-1">
                  <CheckCircle className="w-4 h-4 text-studio-accent" />
                  <p className="font-medium text-studio-text">Import editors guide and line up with your footage</p>
                </div>
                <p className="text-sm text-studio-muted">
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <div className="w-6 h-6 bg-studio-accent text-studio-bg rounded-full flex items-center justify-center text-sm font-bold mt-0.5">
                5
              </div>
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-1">
                  <CheckCircle className="w-4 h-4 text-studio-accent" />
                  <p className="font-medium text-studio-text">Quick cut your video and complete your remaining edits</p>
                </div>
                <p className="text-sm text-studio-muted">
                </p>
              </div>
            </div>
          </div>

          <Button
          onClick={onBack}
            className="w-full bg-studio-accent text-studio-bg hover:bg-studio-accent/90 text-lg py-6"
          >
            End Session
          </Button>
        </div>
      </div>
    </div>
  );
};
