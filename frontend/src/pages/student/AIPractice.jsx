import { useState } from "react";
import { AISidebar } from "../../components/ai/AISidebar";
import { TranslateAI } from "../../components/ai/TranslateAI";
import { ConversationAI } from "../../components/ai/ConversationAI";
import { ElevenLabsConversation } from "../../components/ai/ElevenLabsConversation";
import { AISpeakingPractice } from "../../components/ai/AISpeakingPractice";
import { ListeningAI } from "../../components/ai/ListeningAI";
import { WritingAI } from "../../components/ai/WritingAI";
import { ReadingAI } from "../../components/ai/ReadingAI";
import { FlashcardAI } from "../../components/ai/FlashcardAI";
import "./AIPractice.css";

export default function AIPractice() {
  const [activeTab, setActiveTab] = useState("translate");

  const renderContent = () => {
    switch (activeTab) {
      case "translate":
        return <TranslateAI />;
      case "conversation":
        return <ConversationAI />;
      case "voice-conversation":
        return <ElevenLabsConversation />;
      case "speaking":
        return <AISpeakingPractice />;
      case "listening":
        return <ListeningAI />;
      case "writing":
        return <WritingAI />;
      case "reading":
        return <ReadingAI />;
      case "flashcard":
        return <FlashcardAI />;
      default:
        return <TranslateAI />;
    }
  };

  return (
    <div className="ai-practice-container">
      <AISidebar activeTab={activeTab} onTabChange={setActiveTab} />
      <main className="ai-practice-content">
        <div className="container mx-auto px-6 py-8" style={{ maxWidth: '100%', overflowX: 'hidden' }}>
          {renderContent()}
        </div>
      </main>
    </div>
  );
}

