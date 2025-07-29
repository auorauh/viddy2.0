import { useState } from "react";
import { ChevronLeft, ChevronRight, X, Check } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface Idea {
  id: string;
  title: string;
  description: string;
  category: string;
}

const sampleIdeas: Idea[] = [
  {
    id: "1",
    title: "Morning Routine Challenge",
    description: "Create a 30-day morning routine challenge video series to help viewers start their day productively.",
    category: "Lifestyle"
  },
  {
    id: "2", 
    title: "Tech Review: Smart Home Gadgets",
    description: "Review the latest smart home devices and show how they integrate into daily life.",
    category: "Technology"
  },
  {
    id: "3",
    title: "Local Food Adventure",
    description: "Explore hidden food gems in your city and create a guide for fellow food enthusiasts.",
    category: "Food & Travel"
  },
  {
    id: "4",
    title: "DIY Studio Setup on Budget",
    description: "Show viewers how to create a professional video setup without breaking the bank.",
    category: "Education"
  },
  {
    id: "5",
    title: "Behind the Scenes: Video Creation",
    description: "Take viewers through your entire video creation process from idea to upload.",
    category: "Content Creation"
  }
];

const IdeaPitch = () => {
  const navigate = useNavigate();
  const [currentIdeaIndex, setCurrentIdeaIndex] = useState(0);
  const [likedIdeas, setLikedIdeas] = useState<string[]>([]);
  const [rejectedIdeas, setRejectedIdeas] = useState<string[]>([]);

  const currentIdea = sampleIdeas[currentIdeaIndex];

  const handleChoice = (choice: 'like' | 'reject') => {
    if (choice === 'like') {
      setLikedIdeas(prev => [...prev, currentIdea.id]);
    } else {
      setRejectedIdeas(prev => [...prev, currentIdea.id]);
    }

    if (currentIdeaIndex < sampleIdeas.length - 1) {
      setCurrentIdeaIndex(prev => prev + 1);
    } else {
      // Show results or restart
      setCurrentIdeaIndex(0);
    }
  };

  return (
    <div className="min-h-screen bg-studio-bg flex flex-col">
      {/* Header */}
      <header className="p-4 md:p-6 border-b border-border">
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => navigate('/')}
            className="text-studio-text hover:text-studio-accent"
          >
            <ChevronLeft className="h-5 w-5 mr-2" />
            Back to Studio
          </Button>
          <h1 className="text-xl md:text-2xl font-bold text-studio-text">Idea Pitch</h1>
          <div className="text-sm text-studio-muted">
            {currentIdeaIndex + 1} / {sampleIdeas.length}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-4 md:p-6">
        <div className="w-full max-w-lg">
          <Card className="bg-studio-card border-border shadow-lg">
            <CardContent className="p-6 md:p-8 text-center">
              <div className="mb-4">
                <span className="inline-block px-3 py-1 bg-studio-accent/20 text-studio-accent rounded-full text-sm font-medium">
                  {currentIdea.category}
                </span>
              </div>
              
              <h2 className="text-xl md:text-2xl font-bold text-studio-text mb-4">
                {currentIdea.title}
              </h2>
              
              <p className="text-studio-muted leading-relaxed mb-8">
                {currentIdea.description}
              </p>

              <div className="flex items-center justify-center space-x-4">
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => handleChoice('reject')}
                  className="flex items-center space-x-2 bg-destructive/10 border-destructive/30 text-destructive hover:bg-destructive/20 hover:border-destructive/50"
                >
                  <X className="h-5 w-5" />
                  <span>Pass</span>
                </Button>
                
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => handleChoice('like')}
                  className="flex items-center space-x-2 bg-green-500/10 border-green-500/30 text-green-500 hover:bg-green-500/20 hover:border-green-500/50"
                >
                  <Check className="h-5 w-5" />
                  <span>Love It</span>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Progress indicator */}
          <div className="mt-6 flex justify-center space-x-2">
            {sampleIdeas.map((_, index) => (
              <div
                key={index}
                className={`h-2 w-2 rounded-full transition-colors ${
                  index === currentIdeaIndex
                    ? 'bg-studio-accent'
                    : index < currentIdeaIndex
                    ? 'bg-studio-muted'
                    : 'bg-studio-muted/30'
                }`}
              />
            ))}
          </div>
        </div>
      </main>

      {/* Stats */}
      <footer className="p-4 md:p-6 border-t border-border">
        <div className="flex justify-center space-x-8 text-sm text-studio-muted">
          <div className="flex items-center space-x-2">
            <Check className="h-4 w-4 text-green-500" />
            <span>Liked: {likedIdeas.length}</span>
          </div>
          <div className="flex items-center space-x-2">
            <X className="h-4 w-4 text-destructive" />
            <span>Passed: {rejectedIdeas.length}</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default IdeaPitch;