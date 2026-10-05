import { useVoiceAssistant, UseVoiceAssistantProps } from "./useVoiceAssistant";
import { useSpeechRecognition } from "./useSpeechRecognition";
import { useTextToSpeech } from "./useTextToSpeech";
import { useLotteryQuery } from "./useLotteryQuery";

export function useLotteryAI(props?: UseVoiceAssistantProps) {
  const voiceAssistant = useVoiceAssistant(props);
  const directQuery = useLotteryQuery();

  return {
    ...voiceAssistant,
    queryDatabase: directQuery.executeQuery,
    isQueryLoading: directQuery.loading,
  };
}

export {
  useVoiceAssistant,
  useSpeechRecognition,
  useTextToSpeech,
  useLotteryQuery,
};
