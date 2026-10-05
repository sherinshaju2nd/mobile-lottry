import { ImageSourcePropType } from "react-native";
import { AgentState } from "../types/aiAgent";

export const CHARACTER_ASSETS: Record<AgentState, ImageSourcePropType> = {
  idle: require("../../assets/ai/characters/idle.png"),
  greeting: require("../../assets/ai/characters/greeting.png"),
  listening: require("../../assets/ai/characters/listening.png"),
  transcribing: require("../../assets/ai/characters/thinking.png"),
  thinking: require("../../assets/ai/characters/thinking.png"),
  searching: require("../../assets/ai/characters/searching.png"),
  processing: require("../../assets/ai/characters/processing.png"),
  speaking: require("../../assets/ai/characters/speaking.png"),
  success: require("../../assets/ai/characters/success.png"),
  error: require("../../assets/ai/characters/error.png"),
};

export const BACKGROUND_ASSETS = {
  kerala_night: require("../../assets/ai/backgrounds/bg_kerala_night.jpg"),
};

export const QUICK_ACTIONS: Array<{
  id: string;
  labelEn: string;
  labelMl: string;
  queryEn: string;
  queryMl: string;
}> = [
  {
    id: "today_result",
    labelEn: "Today's result",
    labelMl: "ഇന്നത്തെ ഫലം",
    queryEn: "What is today's lottery result?",
    queryMl: "ഇന്നത്തെ ലോട്ടറി ഫലം എന്താണ്?",
  },
  {
    id: "tomorrow_lottery",
    labelEn: "Tomorrow's lottery",
    labelMl: "നാളത്തെ ലോട്ടറി",
    queryEn: "Which lottery draw is tomorrow?",
    queryMl: "നാളെ ഏത് ലോട്ടറിയാണ്?",
  },
  {
    id: "search_number",
    labelEn: "Search a number",
    labelMl: "നമ്പർ പരിശോധന",
    queryEn: "Check ticket number",
    queryMl: "ടിക്കറ്റ് നമ്പർ പരിശോധിക്കുക",
  },
  {
    id: "bumper_lottery",
    labelEn: "Bumper lottery",
    labelMl: "ബമ്പർ ലോട്ടറി",
    queryEn: "Tell me about upcoming bumper lottery",
    queryMl: "അടുത്ത ബമ്പർ ലോട്ടറിയുടെ വിവരങ്ങൾ പറയൂ",
  },
];
