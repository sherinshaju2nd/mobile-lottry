import React from "react";
import AIAssistant from "../components/ai/AIAssistant";

export default function AIAgentScreen({ navigation }: any) {
  return <AIAssistant onClose={() => navigation.canGoBack() ? navigation.goBack() : undefined} />;
}
