import { useState } from "react";
import { Send, Bot, User, Home, Plus, MessageCircle } from "lucide-react";
import { NavLink } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
}

const Chatbot = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      text: "Hi! I'm Viddy, your AI assistant. I can help you with video scripting, content ideas, and creative suggestions. How can I assist you today?",
      isUser: false,
      timestamp: new Date(),
    },
  ]);
  const [inputMessage, setInputMessage] = useState("");

  const handleSendMessage = () => {
    if (!inputMessage.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputMessage,
      isUser: true,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage("");

    // Simulate AI response
    setTimeout(() => {
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: "I understand you're asking about " + inputMessage + ". Let me help you with that! This is a demo response - in a real implementation, this would connect to an AI service to provide helpful video creation assistance.",
        isUser: false,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, aiResponse]);
    }, 1000);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="flex-1 flex flex-col p-4 max-w-4xl mx-auto w-full">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-studio-text mb-2">Ask Viddy</h1>
          <p className="text-studio-muted">Your AI assistant for video creation and content ideas</p>
        </div>

        {/* Chat Messages */}
        <Card className="flex-1 bg-studio-card border-studio-border mb-4">
          <CardContent className="p-0">
            <ScrollArea className="h-[60vh] p-6">
              <div className="space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.isUser ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[70%] rounded-lg p-4 ${
                        message.isUser
                          ? "bg-studio-accent text-studio-bg"
                          : "bg-studio-bg border border-studio-border text-studio-text"
                      }`}
                    >
                      <div className="flex items-start space-x-2">
                        {!message.isUser && (
                          <Bot className="w-5 h-5 mt-0.5 text-studio-accent flex-shrink-0" />
                        )}
                        {message.isUser && (
                          <User className="w-5 h-5 mt-0.5 text-studio-bg flex-shrink-0" />
                        )}
                        <div className="flex-1">
                          <p className="leading-relaxed">{message.text}</p>
                          <p className={`text-xs mt-2 opacity-70 ${
                            message.isUser ? "text-studio-bg" : "text-studio-muted"
                          }`}>
                            {message.timestamp.toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Input Area */}
        <div className="flex space-x-2">
          <Input
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask Viddy anything about video creation..."
            className="flex-1 bg-studio-bg border-studio-border text-studio-text"
          />
          <Button
            onClick={handleSendMessage}
            disabled={!inputMessage.trim()}
            className="bg-studio-accent text-studio-bg hover:bg-studio-accent/90"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Bottom Navigation */}
      <footer className="border-t border-border p-4 md:p-8">
        <div className="flex items-center justify-center space-x-4 md:space-x-8">
          <Button
            variant="ghost"
            size="lg"
            asChild
            className="flex items-center space-x-2 md:space-x-3 text-studio-text hover:text-studio-accent h-auto py-3 md:py-4 px-4 md:px-6"
          >
            <NavLink to="/">
              <Home className="h-5 w-5 md:h-6 md:w-6" />
              <span className="text-xs md:text-sm">Studio</span>
            </NavLink>
          </Button>
          
          <Button
            variant="ghost"
            size="lg"
            asChild
            className="flex items-center space-x-2 md:space-x-3 text-studio-text hover:text-studio-accent h-auto py-3 md:py-4 px-4 md:px-6"
          >
            <NavLink to="/">
              <Plus className="h-5 w-5 md:h-6 md:w-6" />
              <span className="text-xs md:text-sm">New Project</span>
            </NavLink>
          </Button>

          <Button
            variant="ghost"
            size="lg"
            className="flex items-center space-x-2 md:space-x-3 text-studio-text hover:text-studio-accent h-auto py-3 md:py-4 px-4 md:px-6"
          >
            <Bot className="h-5 w-5 md:h-6 md:w-6" />
            <span className="text-xs md:text-sm">Ask Viddy</span>
          </Button>
          
          <Button
            variant="ghost"
            size="lg"
            asChild
            className="flex items-center space-x-2 md:space-x-3 text-studio-text hover:text-studio-accent h-auto py-3 md:py-4 px-4 md:px-6"
          >
            <NavLink to="/profile">
              <User className="h-5 w-5 md:h-6 md:w-6" />
              <span className="text-xs md:text-sm">Profile</span>
            </NavLink>
          </Button>
        </div>
      </footer>
    </div>
  );
};

export default Chatbot;