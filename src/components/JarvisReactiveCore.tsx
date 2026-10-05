import React from "react";
import CoucouAgent, {
  CoucouVariant,
  CanonicalVariant,
  CoucouAgentProps,
  CANONICAL_VARIANTS,
} from "./CoucouAgent";

export type AgentState =
  | "idle"
  | "listening"
  | "thinking"
  | "speaking"
  | CoucouVariant;

export interface JarvisReactiveCoreProps {
  state: AgentState;
  onPress?: () => void;
  size?: number;
  showSelector?: boolean;
  showCounter?: boolean;
  interactive?: boolean;
  onVariantChange?: (variant: CanonicalVariant) => void;
}

/**
 * Coucou Animated Agent Core
 * Replaces the legacy circular Jarvis reactor with the friendly 3D Coucou character
 * supporting all 10 canonical variants and aliases (welcoming, asking, searching, etc.).
 */
export default function JarvisReactiveCore({
  state,
  onPress,
  size = 200,
  showSelector = false,
  showCounter = false,
  interactive = true,
  onVariantChange,
}: JarvisReactiveCoreProps) {
  // Map legacy voice states to Coucou variants:
  // "idle" -> "welcoming" / "greeting"
  // "listening" -> "asking" / "question"
  // "thinking" -> "searching" / "thinking"
  // "speaking" -> "working"
  const mappedVariant: CoucouVariant =
    state === "idle"
      ? "welcoming"
      : state === "listening"
      ? "asking"
      : state === "thinking"
      ? "thinking"
      : state === "speaking"
      ? "working"
      : (state as CoucouVariant);

  return (
    <CoucouAgent
      variant={mappedVariant}
      size={size}
      onPress={onPress}
      showSelector={showSelector}
      showCounter={showCounter}
      interactive={interactive}
      onVariantChange={onVariantChange}
    />
  );
}

export { CoucouAgent, CANONICAL_VARIANTS };
