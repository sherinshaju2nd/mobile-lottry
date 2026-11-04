import React from "react";
import { FlexWidget, TextWidget } from "react-native-android-widget";
import { TodayWidgetState } from "./widgetState";
import { formatSafeDateDisplay } from "../utils/formatters";
import { formatRupeesShort, parsePrizeAmount } from "../utils/prizeAmounts";

const BG = "#0B3C5D";
const GOLD = "#FBBF24";
const WHITE = "#FFFFFF";
const MUTED = "#BFD7EA";
const LIVE_RED = "#F87171";

const titleCaseTown = (text: string): string =>
  text
    .toLowerCase()
    .split(" ")
    .map((word) => (word ? `${word[0].toUpperCase()}${word.slice(1)}` : word))
    .join(" ");

function Body({ state }: { state: TodayWidgetState }) {
  switch (state.kind) {
    case "result": {
      const amount = parsePrizeAmount(state.firstAmount ?? null);
      const details = [
        amount ? formatRupeesShort(amount) : null,
        state.firstLocation && state.firstLocation.toLowerCase() !== "n/a" ? titleCaseTown(state.firstLocation) : null,
      ]
        .filter(Boolean)
        .join(" · ");
      return (
        <FlexWidget style={{ flexDirection: "column" }}>
          <TextWidget text={state.isToday ? "1st Prize · Today" : `1st Prize · ${formatSafeDateDisplay(state.drawDate)}`} style={{ fontSize: 12, color: GOLD, fontWeight: "700" }} />
          <TextWidget text={state.firstTicket ?? ""} style={{ fontSize: 26, color: WHITE, fontWeight: "900", letterSpacing: 0.05 }} />
          {details ? <TextWidget text={details} style={{ fontSize: 12, color: MUTED }} maxLines={1} truncate="END" /> : null}
        </FlexWidget>
      );
    }
    case "upcoming":
      return (
        <FlexWidget style={{ flexDirection: "column" }}>
          <TextWidget text={`Draw at ${state.drawTimeLabel}`} style={{ fontSize: 20, color: WHITE, fontWeight: "800" }} />
          <TextWidget text={state.countdownLabel ?? ""} style={{ fontSize: 14, color: GOLD, fontWeight: "700" }} />
        </FlexWidget>
      );
    case "live":
      return (
        <FlexWidget style={{ flexDirection: "column" }}>
          <TextWidget text="● LIVE DRAW" style={{ fontSize: 14, color: LIVE_RED, fontWeight: "900" }} />
          <TextWidget text="Results coming in – tap to watch" style={{ fontSize: 14, color: WHITE, fontWeight: "700" }} />
        </FlexWidget>
      );
    case "postponed":
      return (
        <FlexWidget style={{ flexDirection: "column" }}>
          <TextWidget text="Draw postponed" style={{ fontSize: 20, color: GOLD, fontWeight: "800" }} />
          <TextWidget text="Tap for the new date" style={{ fontSize: 13, color: MUTED }} />
        </FlexWidget>
      );
    default:
      return (
        <FlexWidget style={{ flexDirection: "column" }}>
          <TextWidget text="Results unavailable" style={{ fontSize: 18, color: WHITE, fontWeight: "800" }} />
          <TextWidget text="Tap to open the app" style={{ fontSize: 13, color: MUTED }} />
        </FlexWidget>
      );
  }
}

/** Android home-screen widget: today's lottery → countdown → live → 1st prize. Tapping opens the app. */
export function TodayResultWidget({ state }: { state: TodayWidgetState }) {
  return (
    <FlexWidget
      clickAction="OPEN_APP"
      style={{
        height: "match_parent",
        width: "match_parent",
        flexDirection: "column",
        justifyContent: "space-between",
        backgroundColor: BG,
        borderRadius: 18,
        padding: 14,
      }}
    >
      <FlexWidget style={{ flexDirection: "row", justifyContent: "space-between", width: "match_parent" }}>
        <TextWidget text={state.lotteryName} style={{ fontSize: 14, color: WHITE, fontWeight: "800" }} maxLines={1} truncate="END" />
        <TextWidget text="Kerala Lottery" style={{ fontSize: 11, color: MUTED }} />
      </FlexWidget>
      <Body state={state} />
      <TextWidget text={state.updatedAtLabel} style={{ fontSize: 10, color: MUTED }} />
    </FlexWidget>
  );
}
