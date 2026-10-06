import { StructuredIntent, LotteryIntentType } from "../types/aiTypes";

export interface LotteryFaqItem {
  id: string;
  category:
    | "TODAY_DRAW"
    | "TOMORROW_DRAW"
    | "WEEKLY_LOTTERIES"
    | "BUMPER_LOTTERIES"
    | "TICKET_CHECK"
    | "PRIZE_STRUCTURE"
    | "SCHEDULE_VENUE"
    | "CLAIM_PROCEDURE"
    | "TAX_COMMISSION"
    | "APP_FEATURES";
  questionEn: string;
  questionMl: string;
  patterns: string[];
  intent: LotteryIntentType;
  lotteryCode?: string;
  lotteryName?: string;
  dateTarget?: string;
  prizeTier?: string;
  directAnswer?: {
    en: string;
    ml: string;
    cardData?: {
      title: string;
      subtitle?: string;
      badgeText?: string;
      primaryHighlight?: string;
      secondaryHighlight?: string;
      details?: Array<{ label: string; value: string }>;
    };
  };
}

export const KERALA_LOTTERY_100_QUESTIONS: LotteryFaqItem[] = [
  // =========================================================================
  // CATEGORY 1: TODAY'S RESULTS & DRAWS (10 Questions)
  // =========================================================================
  {
    id: "Q001",
    category: "TODAY_DRAW",
    questionEn: "What is today's lottery result?",
    questionMl: "ഇന്നത്തെ ലോട്ടറി ഫലം എന്താണ്?",
    patterns: [
      "today result",
      "today lottery result",
      "what is today lottery",
      "todays draw",
      "innathe result",
      "innathe phalam",
      "innathe lottery result",
      "ഇന്നത്തെ ലോട്ടറി ഫലം",
      "ഇന്നത്തെ റിസൾട്ട്",
      "ഇന്നത്തെ ഫലം",
    ],
    intent: "LOTTERY_RESULT",
    dateTarget: "today",
  },
  {
    id: "Q002",
    category: "TODAY_DRAW",
    questionEn: "Who won the first prize in today's lottery?",
    questionMl: "ഇന്നത്തെ ലോട്ടറിയുടെ ഒന്നാം സമ്മാനം ആർക്കാണ്?",
    patterns: [
      "today first prize",
      "who won first prize today",
      "todays first prize number",
      "innathe 1st prize",
      "innathe onnam sammanam",
      "ഇന്നത്തെ ഒന്നാം സമ്മാനം",
      "ഒന്നാം സമ്മാനം അടിച്ച ടിക്കറ്റ് നമ്പർ ഏതാണ്",
      "ഇന്നത്തെ ഒന്നാം സമ്മാന നമ്പർ",
    ],
    intent: "WINNING_NUMBERS",
    dateTarget: "today",
    prizeTier: "1st",
  },
  {
    id: "Q003",
    category: "TODAY_DRAW",
    questionEn: "Which lottery is being drawn today?",
    questionMl: "ഇന്ന് ഏത് ലോട്ടറിയുടെ നറുക്കെടുപ്പാണ്?",
    patterns: [
      "which lottery today",
      "which draw today",
      "today which lottery",
      "innu eth lottery",
      "innu etha draw",
      "ഇന്ന് ഏത് ലോട്ടറി",
      "ഇന്നത്തെ നറുക്കെടുപ്പ് ഏതാണ്",
      "ഇന്നത്തെ ലോട്ടറി ഏതാണ്",
    ],
    intent: "LOTTERY_SCHEDULE",
    dateTarget: "today",
  },
  {
    id: "Q004",
    category: "TODAY_DRAW",
    questionEn: "Is today's lottery result published?",
    questionMl: "ഇന്നത്തെ ലോട്ടറി ഫലം പ്രസിദ്ധീകരിച്ചോ?",
    patterns: [
      "is today result out",
      "is result published",
      "has today result come",
      "result vannao",
      "phalam vannao",
      "ഇന്നത്തെ ഫലം വന്നോ",
      "ഫലം പ്രസിദ്ധീകരിച്ചോ",
      "റിസൾട്ട് വന്നോ",
    ],
    intent: "LOTTERY_RESULT",
    dateTarget: "today",
  },
  {
    id: "Q005",
    category: "TODAY_DRAW",
    questionEn: "What is today's first prize amount?",
    questionMl: "ഇന്നത്തെ ഒന്നാം സമ്മാനത്തുക എത്ര രൂപയാണ്?",
    patterns: [
      "today first prize amount",
      "how much is today first prize",
      "innathe prize ethra",
      "innathe first prize ethra rupa",
      "ഒന്നാം സമ്മാനത്തുക എത്ര",
      "ഇന്നത്തെ ഒന്നാം സമ്മാന തുക",
      "ഇന്നത്തെ സമ്മാനം എത്രയാണ്",
    ],
    intent: "LOTTERY_PRIZE_STRUCTURE",
    dateTarget: "today",
    prizeTier: "1st",
  },
  {
    id: "Q006",
    category: "TODAY_DRAW",
    questionEn: "What are the consolation prize numbers for today?",
    questionMl: "ഇന്നത്തെ സമാശ്വാസ സമ്മാന നമ്പറുകൾ ഏതൊക്കെയാണ്?",
    patterns: [
      "today consolation prize",
      "consolation prize today",
      "consolation numbers",
      "samashwasa sammanam",
      "സമാശ്വാസ സമ്മാനം",
      "ഇന്നത്തെ സമാശ്വാസ സമ്മാനം",
    ],
    intent: "WINNING_NUMBERS",
    dateTarget: "today",
    prizeTier: "consolation",
  },
  {
    id: "Q007",
    category: "TODAY_DRAW",
    questionEn: "Show me all second prize winning numbers of today.",
    questionMl: "ഇന്നത്തെ രണ്ടാം സമ്മാനം ലഭിച്ച നമ്പറുകൾ കാണിക്കൂ.",
    patterns: [
      "today second prize",
      "second prize numbers",
      "2nd prize today",
      "randam sammanam",
      "രണ്ടാം സമ്മാനം",
      "ഇന്നത്തെ രണ്ടാം സമ്മാനം",
    ],
    intent: "WINNING_NUMBERS",
    dateTarget: "today",
    prizeTier: "2nd",
  },
  {
    id: "Q008",
    category: "TODAY_DRAW",
    questionEn: "What is today's 3rd prize winning number?",
    questionMl: "ഇന്നത്തെ മൂന്നാം സമ്മാന നമ്പർ എന്താണ്?",
    patterns: [
      "today third prize",
      "3rd prize numbers today",
      "moonnam sammanam",
      "മൂന്നാം സമ്മാനം",
      "ഇന്നത്തെ മൂന്നാം സമ്മാനം",
    ],
    intent: "WINNING_NUMBERS",
    dateTarget: "today",
    prizeTier: "3rd",
  },
  {
    id: "Q009",
    category: "TODAY_DRAW",
    questionEn: "What is the draw code and series for today?",
    questionMl: "ഇന്നത്തെ നറുക്കെടുപ്പ് കോഡും സീരീസും ഏതാണ്?",
    patterns: [
      "today draw code",
      "today draw series",
      "draw number today",
      "draw code",
      "ഡ്രോ കോഡ്",
      "നറുക്കെടുപ്പ് നമ്പർ",
    ],
    intent: "LOTTERY_RESULT",
    dateTarget: "today",
  },
  {
    id: "Q010",
    category: "TODAY_DRAW",
    questionEn: "What was yesterday's lottery result?",
    questionMl: "ഇന്നലത്തെ ലോട്ടറി ഫലം എന്തായിരുന്നു?",
    patterns: [
      "yesterday result",
      "yesterday lottery result",
      "innalathe result",
      "innale eth lottery",
      "ഇന്നലത്തെ റിസൾട്ട്",
      "ഇന്നലത്തെ ലോട്ടറി ഫലം",
      "കഴിഞ്ഞ ദിവസത്തെ ഫലം",
    ],
    intent: "LOTTERY_RESULT",
    dateTarget: "yesterday",
  },

  // =========================================================================
  // CATEGORY 2: TOMORROW'S LOTTERY & SCHEDULE (10 Questions)
  // =========================================================================
  {
    id: "Q011",
    category: "TOMORROW_DRAW",
    questionEn: "Which lottery is tomorrow?",
    questionMl: "നാളെ ഏത് ലോട്ടറിയാണ്?",
    patterns: [
      "tomorrow lottery",
      "which lottery tomorrow",
      "tomorrows draw",
      "nale lottery etha",
      "nalathe lottery",
      "നാളെ ഏത് ലോട്ടറി",
      "നാളത്തെ ലോട്ടറി ഏതാണ്",
      "നാളത്തെ നറുക്കെടുപ്പ്",
    ],
    intent: "LOTTERY_SCHEDULE",
    dateTarget: "tomorrow",
  },
  {
    id: "Q012",
    category: "TOMORROW_DRAW",
    questionEn: "What is the first prize for tomorrow's lottery?",
    questionMl: "നാളത്തെ ലോട്ടറിയുടെ ഒന്നാം സമ്മാനം എത്രയാണ്?",
    patterns: [
      "tomorrow first prize",
      "tomorrow prize amount",
      "nalathe first prize",
      "nalathe sammanam ethra",
      "നാളത്തെ ഒന്നാം സമ്മാനം",
      "നാളത്തെ സമ്മാനത്തുക എത്ര",
    ],
    intent: "LOTTERY_PRIZE_STRUCTURE",
    dateTarget: "tomorrow",
    prizeTier: "1st",
  },
  {
    id: "Q013",
    category: "TOMORROW_DRAW",
    questionEn: "What is the ticket price for tomorrow's draw?",
    questionMl: "നാളത്തെ ലോട്ടറി ടിക്കറ്റിന്റെ വില എത്രയാണ്?",
    patterns: [
      "tomorrow ticket price",
      "ticket rate tomorrow",
      "ticket price",
      "ticket vila ethra",
      "ടിക്കറ്റ് വില എത്ര",
      "ടിക്കറ്റ് നിരക്ക്",
      "ലോട്ടറി ടിക്കറ്റിന്റെ വില",
    ],
    intent: "LOTTERY_INFORMATION",
    directAnswer: {
      en: "Standard weekly Kerala lottery tickets (Bhagyathara, Sthree Sakthi, Dhanalekshmi, Karunya Plus, Suvarna Keralam, Karunya, Samrudhi) cost ₹50 per ticket (including GST). Bumper lottery tickets range between ₹250 to ₹500.",
      ml: "കേരള ഭാഗ്യക്കുറിയുടെ പ്രതിവാര ലോട്ടറി ടിക്കറ്റുകൾക്ക് (ഭാഗ്യതാരാ, സ്ത്രീശക്തി, ധനലക്ഷ്മി, കാരുണ്യ പ്ലസ്, സുവർണ്ണ കേരളം, കാരുണ്യ, സമൃദ്ധി) ₹50 രൂപയാണ് വില (ജിഎസ്ടി ഉൾപ്പെടെ). ബമ്പർ ടിക്കറ്റുകൾക്ക് ₹250 മുതൽ ₹500 വരെയാണ് വില.",
      cardData: {
        title: "ടിക്കറ്റ് നിരക്ക് (Ticket Price)",
        subtitle: "കേരള ഭാഗ്യക്കുറി വകുപ്പ്",
        primaryHighlight: "₹50 / ടിക്കറ്റ്",
        secondaryHighlight: "സാധാരണ പ്രതിവാര ലോട്ടറികൾക്ക്",
        badgeText: "OFFICIAL RATE",
        details: [
          { label: "പ്രതിവാര ലോട്ടറി", value: "₹50 (ജിഎസ്ടി ഉൾപ്പെടെ)" },
          { label: "ബമ്പർ ലോട്ടറികൾ", value: "₹250 - ₹500" },
        ],
      },
    },
  },
  {
    id: "Q014",
    category: "TOMORROW_DRAW",
    questionEn: "What is the complete weekly Kerala lottery schedule?",
    questionMl: "കേരള ലോട്ടറിയുടെ ആഴ്ചയിലെ നറുക്കെടുപ്പ് വിവരങ്ങൾ എന്തൊക്കെയാണ്?",
    patterns: [
      "weekly schedule",
      "lottery days",
      "which lottery on which day",
      "weekly draws",
      "ethokke divasam ethokke lottery",
      "ആഴ്ചയിലെ ലോട്ടറികൾ",
      "ലോട്ടറി ഷെഡ്യൂൾ",
      "ഏതൊക്കെ ദിവസങ്ങളിൽ ഏതൊക്കെ ലോട്ടറി",
    ],
    intent: "LOTTERY_SCHEDULE",
    directAnswer: {
      en: "Kerala Lottery Weekly Schedule:\n• Monday: Bhagyathara (BT)\n• Tuesday: Sthree Sakthi (SS)\n• Wednesday: Dhanalekshmi (DL)\n• Thursday: Karunya Plus (KN)\n• Friday: Suvarna Keralam (SK)\n• Saturday: Karunya (KR)\n• Sunday: Samrudhi (SM)",
      ml: "കേരള ലോട്ടറി പ്രതിവാര നറുക്കെടുപ്പ് വിവരങ്ങൾ:\n• തിങ്കൾ: ഭാഗ്യതാരാ (Bhagyathara)\n• ചൊവ്വ: സ്ത്രീശക്തി (Sthree Sakthi)\n• ബുധൻ: ധനലക്ഷ്മി (Dhanalekshmi)\n• വ്യാഴം: കാരുണ്യ പ്ലസ് (Karunya Plus)\n• വെള്ളി: സുവർണ്ണ കേരളം (Suvarna Keralam)\n• ശനി: കാരുണ്യ (Karunya)\n• ഞായർ: സമൃദ്ധി (Samrudhi)",
      cardData: {
        title: "പ്രതിവാര നറുക്കെടുപ്പ് പട്ടിക",
        subtitle: "ഏഴ് ദിവസത്തെ ഔദ്യോഗിക ലോട്ടറി വിവരങ്ങൾ",
        primaryHighlight: "എല്ലാ ദിവസവും ഉച്ചയ്ക്ക് 3:00 മണിക്ക്",
        badgeText: "WEEKLY SCHEDULE",
        details: [
          { label: "തിങ്കൾ", value: "ഭാഗ്യതാരാ (Bhagyathara - BT)" },
          { label: "ചൊവ്വ", value: "സ്ത്രീശക്തി (Sthree Sakthi - SS)" },
          { label: "ബുധൻ", value: "ധനലക്ഷ്മി (Dhanalekshmi - DL)" },
          { label: "വ്യാഴം", value: "കാരുണ്യ പ്ലസ് (Karunya Plus - KN)" },
          { label: "വെള്ളി", value: "സുവർണ്ണ കേരളം (Suvarna Keralam - SK)" },
          { label: "ശനി", value: "കാരുണ്യ (Karunya - KR)" },
          { label: "ഞായർ", value: "സമൃദ്ധി (Samrudhi - SM)" },
        ],
      },
    },
  },
  {
    id: "Q015",
    category: "TOMORROW_DRAW",
    questionEn: "What time does tomorrow's draw start?",
    questionMl: "നാളത്തെ നറുക്കെടുപ്പ് എപ്പോഴാണ് ആരംഭിക്കുന്നത്?",
    patterns: [
      "tomorrow draw time",
      "what time is draw tomorrow",
      "nalathe samayam",
      "draw timing",
      "നാളത്തെ സമയം",
      "നറുക്കെടുപ്പ് സമയം",
    ],
    intent: "LOTTERY_SCHEDULE",
    dateTarget: "tomorrow",
  },
  {
    id: "Q016",
    category: "TOMORROW_DRAW",
    questionEn: "Which lottery is on Monday?",
    questionMl: "തിങ്കളാഴ്ച ഏത് ലോട്ടറിയാണ് നറുക്കെടുക്കുന്നത്?",
    patterns: [
      "monday lottery",
      "which lottery on monday",
      "thingalazhcha eth lottery",
      "തിങ്കളാഴ്ച ഏത് ലോട്ടറി",
    ],
    intent: "LOTTERY_SCHEDULE",
    lotteryCode: "BT",
    lotteryName: "Bhagyathara",
    directAnswer: {
      en: "Monday's lottery is Bhagyathara (BT). The first prize is ₹1 Crore, and the draw takes place at 3:00 PM.",
      ml: "തിങ്കളാഴ്ച നറുക്കെടുക്കുന്നത് ഭാഗ്യതാരാ (Bhagyathara) ലോട്ടറിയാണ്. ഒന്നാം സമ്മാനം ₹1 കോടി രൂപയാണ്. നറുക്കെടുപ്പ് ഉച്ചയ്ക്ക് 3:00 മണിക്ക് നടക്കും.",
    },
  },
  {
    id: "Q017",
    category: "TOMORROW_DRAW",
    questionEn: "Which lottery is on Tuesday?",
    questionMl: "ചൊവ്വാഴ്ച ഏത് ലോട്ടറിയാണ്?",
    patterns: [
      "tuesday lottery",
      "which lottery on tuesday",
      "chovvazhcha eth lottery",
      "ചൊവ്വാഴ്ച ഏത് ലോട്ടറി",
    ],
    intent: "LOTTERY_SCHEDULE",
    lotteryCode: "SS",
    lotteryName: "Sthree Sakthi",
    directAnswer: {
      en: "Tuesday's lottery is Sthree Sakthi (SS). The first prize is ₹75 Lakhs, drawn at 3:00 PM.",
      ml: "ചൊവ്വാഴ്ച നറുക്കെടുക്കുന്നത് സ്ത്രീശക്തി (Sthree Sakthi) ലോട്ടറിയാണ്. ഒന്നാം സമ്മാനം ₹75 ലക്ഷം രൂപയാണ്.",
    },
  },
  {
    id: "Q018",
    category: "TOMORROW_DRAW",
    questionEn: "Which lottery is on Wednesday?",
    questionMl: "ബുധനാഴ്ച ഏത് ലോട്ടറിയാണ്?",
    patterns: [
      "wednesday lottery",
      "which lottery on wednesday",
      "budhanazhcha eth lottery",
      "ബുധനാഴ്ച ഏത് ലോട്ടറി",
    ],
    intent: "LOTTERY_SCHEDULE",
    lotteryCode: "DL",
    lotteryName: "Dhanalekshmi",
    directAnswer: {
      en: "Wednesday's lottery is Dhanalekshmi (DL). The first prize is ₹1 Crore!",
      ml: "ബുധനാഴ്ച നറുക്കെടുക്കുന്നത് ധനലക്ഷ്മി (Dhanalekshmi) ലോട്ടറിയാണ്. ഒന്നാം സമ്മാനം ₹1 കോടി രൂപയാണ്!",
    },
  },
  {
    id: "Q019",
    category: "TOMORROW_DRAW",
    questionEn: "Which lottery is on Thursday?",
    questionMl: "വ്യാഴാഴ്ച ഏത് ലോട്ടറിയാണ്?",
    patterns: [
      "thursday lottery",
      "which lottery on thursday",
      "vyazhazhcha eth lottery",
      "വ്യാഴാഴ്ച ഏത് ലോട്ടറി",
    ],
    intent: "LOTTERY_SCHEDULE",
    lotteryCode: "KN",
    lotteryName: "Karunya Plus",
    directAnswer: {
      en: "Thursday's lottery is Karunya Plus (KN). The first prize is ₹80 Lakhs.",
      ml: "വ്യാഴാഴ്ച നറുക്കെടുക്കുന്നത് കാരുണ്യ പ്ലസ് (Karunya Plus) ലോട്ടറിയാണ്. ഒന്നാം സമ്മാനം ₹80 ലക്ഷം രൂപയാണ്.",
    },
  },
  {
    id: "Q020",
    category: "TOMORROW_DRAW",
    questionEn: "Which lottery is on Friday and Saturday?",
    questionMl: "വെള്ളിയും ശനിയും ഏത് ലോട്ടറികളാണ്?",
    patterns: [
      "friday saturday lottery",
      "friday lottery",
      "saturday lottery",
      "velliyazhcha eth lottery",
      "shaniyazhcha eth lottery",
      "വെള്ളിയാഴ്ച ഏത് ലോട്ടറി",
      "ശനിയാഴ്ച ഏത് ലോട്ടറി",
    ],
    intent: "LOTTERY_SCHEDULE",
    directAnswer: {
      en: "Friday: Suvarna Keralam (SK) with ₹70 Lakhs first prize.\nSaturday: Karunya (KR) with ₹80 Lakhs first prize.",
      ml: "വെള്ളിയാഴ്ച: സുവർണ്ണ കേരളം (Suvarna Keralam) - ഒന്നാം സമ്മാനം ₹70 ലക്ഷം.\nശനിയാഴ്ച: കാരുണ്യ (Karunya) - ഒന്നാം സമ്മാനം ₹80 ലക്ഷം.",
    },
  },

  // =========================================================================
  // CATEGORY 3: SPECIFIC WEEKLY LOTTERIES (20 Questions)
  // =========================================================================
  {
    id: "Q021",
    category: "WEEKLY_LOTTERIES",
    questionEn: "Tell me about Bhagyathara lottery.",
    questionMl: "ഭാഗ്യതാരാ ലോട്ടറിയെക്കുറിച്ച് പറയൂ.",
    patterns: [
      "bhagyathara",
      "bhagyathara lottery",
      "bhagyathara details",
      "bhagyathara first prize",
      "bhagyathara sammanam",
      "ഭാഗ്യതാരാ ലോട്ടറി",
      "ഭാഗ്യതാരാ സമ്മാനം",
    ],
    intent: "LOTTERY_INFORMATION",
    lotteryCode: "BT",
    lotteryName: "Bhagyathara",
    directAnswer: {
      en: "Bhagyathara (BT) is drawn every Monday at 3:00 PM. First Prize is ₹1 Crore, Second Prize is ₹10 Lakhs, and Consolation Prize is ₹8,000.",
      ml: "ഭാഗ്യതാരാ (Bhagyathara) ലോട്ടറി എല്ലാ തിങ്കളാഴ്ചയും ഉച്ചയ്ക്ക് 3:00 മണിക്ക് നറുക്കെടുക്കുന്നു. ഒന്നാം സമ്മാനം ₹1 കോടി, രണ്ടാം സമ്മാനം ₹10 ലക്ഷം, സമാശ്വാസ സമ്മാനം ₹8,000 രൂപ.",
    },
  },
  {
    id: "Q022",
    category: "WEEKLY_LOTTERIES",
    questionEn: "What is Bhagyathara latest result?",
    questionMl: "ഭാഗ്യതാരാ ലേറ്റസ്റ്റ് റിസൾട്ട് എന്താണ്?",
    patterns: [
      "bhagyathara result",
      "bhagyathara latest result",
      "bhagyathara winner",
      "bhagyathara phalam",
      "ഭാഗ്യതാരാ ഫലം",
      "ഭാഗ്യതാരാ റിസൾട്ട്",
    ],
    intent: "LOTTERY_RESULT",
    lotteryCode: "BT",
    lotteryName: "Bhagyathara",
  },
  {
    id: "Q023",
    category: "WEEKLY_LOTTERIES",
    questionEn: "Tell me about Sthree Sakthi lottery.",
    questionMl: "സ്ത്രീശക്തി ലോട്ടറിയുടെ വിവരങ്ങൾ പറയൂ.",
    patterns: [
      "sthree sakthi",
      "sthree sakthi details",
      "sthreesakthi first prize",
      "സ്ത്രീശക്തി ലോട്ടറി",
      "സ്ത്രീശക്തി സമ്മാനം",
    ],
    intent: "LOTTERY_INFORMATION",
    lotteryCode: "SS",
    lotteryName: "Sthree Sakthi",
    directAnswer: {
      en: "Sthree Sakthi (SS) is drawn every Tuesday at 3:00 PM. First prize is ₹75 Lakhs, Second prize is ₹10 Lakhs, and Consolation prize is ₹8,000.",
      ml: "സ്ത്രീശക്തി (Sthree Sakthi) എല്ലാ ചൊവ്വാഴ്ചയും ഉച്ചയ്ക്ക് 3:00 മണിക്ക് നറുക്കെടുക്കുന്നു. ഒന്നാം സമ്മാനം ₹75 ലക്ഷം, രണ്ടാം സമ്മാനം ₹10 ലക്ഷം, സമാശ്വാസ സമ്മാനം ₹8,000 രൂപ.",
    },
  },
  {
    id: "Q024",
    category: "WEEKLY_LOTTERIES",
    questionEn: "What is the latest Sthree Sakthi result?",
    questionMl: "ഏറ്റവും പുതിയ സ്ത്രീശക്തി ഫലം എന്താണ്?",
    patterns: [
      "sthree sakthi result",
      "sthree sakthi winner",
      "sthreesakthi phalam",
      "സ്ത്രീശക്തി ഫലം",
      "സ്ത്രീശക്തി റിസൾട്ട്",
    ],
    intent: "LOTTERY_RESULT",
    lotteryCode: "SS",
    lotteryName: "Sthree Sakthi",
  },
  {
    id: "Q025",
    category: "WEEKLY_LOTTERIES",
    questionEn: "Tell me about Dhanalekshmi lottery.",
    questionMl: "ധനലക്ഷ്മി ലോട്ടറിയെക്കുറിച്ച് പറയൂ.",
    patterns: [
      "dhanalekshmi",
      "dhanalekshmi lottery",
      "dhanalakshmi",
      "dhanalekshmi prize",
      "dhanalekshmi first prize",
      "ധനലക്ഷ്മി ലോട്ടറി",
      "ധനലക്ഷ്മി സമ്മാനം",
    ],
    intent: "LOTTERY_INFORMATION",
    lotteryCode: "DL",
    lotteryName: "Dhanalekshmi",
    directAnswer: {
      en: "Dhanalekshmi (DL) is drawn every Wednesday at 3:00 PM. First prize is a grand ₹1 Crore, Second prize is ₹10 Lakhs, and Consolation prize is ₹8,000.",
      ml: "ധനലക്ഷ്മി (Dhanalekshmi) ലോട്ടറി എല്ലാ ബുധനാഴ്ചയും ഉച്ചയ്ക്ക് 3:00 മണിക്ക് നറുക്കെടുക്കുന്നു. ഒന്നാം സമ്മാനം ₹1 കോടി രൂപയാണ്! രണ്ടാം സമ്മാനം ₹10 ലക്ഷം, സമാശ്വാസ സമ്മാനം ₹8,000 രൂപ.",
    },
  },
  {
    id: "Q026",
    category: "WEEKLY_LOTTERIES",
    questionEn: "What is the latest Dhanalekshmi result?",
    questionMl: "ഏറ്റവും പുതിയ ധനലക്ഷ്മി ഫലം എന്താണ്?",
    patterns: [
      "dhanalekshmi result",
      "dhanalakshmi result",
      "dhanalekshmi winning number",
      "dhanalekshmi winner",
      "ധനലക്ഷ്മി ഫലം",
      "ധനലക്ഷ്മി റിസൾട്ട്",
    ],
    intent: "LOTTERY_RESULT",
    lotteryCode: "DL",
    lotteryName: "Dhanalekshmi",
  },
  {
    id: "Q027",
    category: "WEEKLY_LOTTERIES",
    questionEn: "Tell me about Karunya Plus lottery.",
    questionMl: "കാരുണ്യ പ്ലസ് ലോട്ടറിയെക്കുറിച്ച് അറിയണം.",
    patterns: [
      "karunya plus",
      "karunya plus details",
      "karunya plus prize",
      "കാരുണ്യ പ്ലസ് ലോട്ടറി",
      "കാരുണ്യ പ്ലസ് സമ്മാനം",
    ],
    intent: "LOTTERY_INFORMATION",
    lotteryCode: "KN",
    lotteryName: "Karunya Plus",
    directAnswer: {
      en: "Karunya Plus (KN) is drawn on Thursdays at 3:00 PM. First prize is ₹80 Lakhs, Second prize is ₹10 Lakhs, and Consolation prize is ₹8,000.",
      ml: "കാരുണ്യ പ്ലസ് (Karunya Plus) എല്ലാ വ്യാഴാഴ്ചയും ഉച്ചയ്ക്ക് 3:00 മണിക്ക് നറുക്കെടുക്കുന്നു. ഒന്നാം സമ്മാനം ₹80 ലക്ഷം, രണ്ടാം സമ്മാനം ₹10 ലക്ഷം രൂപ.",
    },
  },
  {
    id: "Q028",
    category: "WEEKLY_LOTTERIES",
    questionEn: "What is the latest Karunya Plus result?",
    questionMl: "കാരുണ്യ പ്ലസ് ലേറ്റസ്റ്റ് റിസൾട്ട് പറയൂ.",
    patterns: [
      "karunya plus result",
      "karunya plus latest result",
      "karunya plus winner",
      "കാരുണ്യ പ്ലസ് ഫലം",
      "കാരുണ്യ പ്ലസ് റിസൾട്ട്",
    ],
    intent: "LOTTERY_RESULT",
    lotteryCode: "KN",
    lotteryName: "Karunya Plus",
  },
  {
    id: "Q029",
    category: "WEEKLY_LOTTERIES",
    questionEn: "Tell me about Suvarna Keralam lottery.",
    questionMl: "സുവർണ്ണ കേരളം ലോട്ടറിയുടെ വിവരങ്ങൾ എന്തൊക്കെയാണ്?",
    patterns: [
      "suvarna keralam",
      "suvarna",
      "suvarna keralam lottery",
      "suvarna keralam details",
      "suvarna keralam first prize",
      "സുവർണ്ണ കേരളം ലോട്ടറി",
      "സുവർണ്ണ കേരളം സമ്മാനം",
    ],
    intent: "LOTTERY_INFORMATION",
    lotteryCode: "SK",
    lotteryName: "Suvarna Keralam",
    directAnswer: {
      en: "Suvarna Keralam (SK) is drawn every Friday at 3:00 PM. First prize is ₹70 Lakhs, Second prize is ₹10 Lakhs, and Consolation prize is ₹8,000.",
      ml: "സുവർണ്ണ കേരളം (Suvarna Keralam) എല്ലാ വെള്ളിയാഴ്ചയും ഉച്ചയ്ക്ക് 3:00 മണിക്ക് നറുക്കെടുക്കുന്നു. ഒന്നാം സമ്മാനം ₹70 ലക്ഷം, രണ്ടാം സമ്മാനം ₹10 ലക്ഷം രൂപ.",
    },
  },
  {
    id: "Q030",
    category: "WEEKLY_LOTTERIES",
    questionEn: "What is the latest Suvarna Keralam result?",
    questionMl: "സുവർണ്ണ കേരളം ലേറ്റസ്റ്റ് ഫലം പറയൂ.",
    patterns: [
      "suvarna keralam result",
      "suvarna result",
      "suvarna keralam winner",
      "suvarna keralam phalam",
      "സുവർണ്ണ കേരളം ഫലം",
      "സുവർണ്ണ കേരളം റിസൾട്ട്",
    ],
    intent: "LOTTERY_RESULT",
    lotteryCode: "SK",
    lotteryName: "Suvarna Keralam",
  },
  {
    id: "Q031",
    category: "WEEKLY_LOTTERIES",
    questionEn: "Tell me about Karunya lottery on Saturday.",
    questionMl: "ശനിയാഴ്ചത്തെ കാരുണ്യ ലോട്ടറിയെക്കുറിച്ച് പറയൂ.",
    patterns: [
      "karunya lottery",
      "karunya saturday",
      "karunya details",
      "കാരുണ്യ ലോട്ടറി",
      "കാരുണ്യ സമ്മാനം",
    ],
    intent: "LOTTERY_INFORMATION",
    lotteryCode: "KR",
    lotteryName: "Karunya",
    directAnswer: {
      en: "Karunya (KR) is drawn on Saturdays at 3:00 PM. First prize is ₹80 Lakhs, Second prize is ₹5 Lakhs, and proceeds support healthcare aid for underprivileged families in Kerala.",
      ml: "കാരുണ്യ (Karunya) എല്ലാ ശനിയാഴ്ചയും ഉച്ചയ്ക്ക് 3:00 മണിക്ക് നറുക്കെടുക്കുന്നു. ഒന്നാം സമ്മാനം ₹80 ലക്ഷം, രണ്ടാം സമ്മാനം ₹5 ലക്ഷം രൂപ. ലോട്ടറി വരുമാനം പാവപ്പെട്ട രോഗികളുടെ ചികിത്സാ സഹായത്തിനായി ഉപയോഗിക്കുന്നു.",
    },
  },
  {
    id: "Q032",
    category: "WEEKLY_LOTTERIES",
    questionEn: "What is the latest Karunya result?",
    questionMl: "കാരുണ്യ ലേറ്റസ്റ്റ് റിസൾട്ട് പറയൂ.",
    patterns: [
      "karunya result",
      "karunya winning number",
      "karunya winner",
      "കാരുണ്യ ഫലം",
      "കാരുണ്യ റിസൾട്ട്",
    ],
    intent: "LOTTERY_RESULT",
    lotteryCode: "KR",
    lotteryName: "Karunya",
  },
  {
    id: "Q033",
    category: "WEEKLY_LOTTERIES",
    questionEn: "Tell me about Samrudhi Sunday lottery.",
    questionMl: "ഞായറാഴ്ചത്തെ സമൃദ്ധി ലോട്ടറിയെക്കുറിച്ച് പറയൂ.",
    patterns: [
      "samrudhi lottery",
      "sunday lottery",
      "samrudhi first prize",
      "സമൃദ്ധി ലോട്ടറി",
      "ഞായറാഴ്ച ലോട്ടറി",
    ],
    intent: "LOTTERY_INFORMATION",
    lotteryCode: "SM",
    lotteryName: "Samrudhi",
    directAnswer: {
      en: "Samrudhi (SM) is drawn on Sundays at 3:00 PM. First prize is ₹1 Crore, with substantial lower-tier prizes.",
      ml: "സമൃദ്ധി (Samrudhi) ലോട്ടറി ഞായറാഴ്ചകളിൽ ഉച്ചയ്ക്ക് 3:00 മണിക്ക് നറുക്കെടുക്കുന്നു. ഒന്നാം സമ്മാനം ₹1 കോടി രൂപയാണ്.",
    },
  },
  {
    id: "Q034",
    category: "WEEKLY_LOTTERIES",
    questionEn: "What is the latest Samrudhi result?",
    questionMl: "സമൃദ്ധി ലോട്ടറിയുടെ ഏറ്റവും പുതിയ ഫലം പറയൂ.",
    patterns: [
      "samrudhi result",
      "samrudhi winner",
      "samrudhi phalam",
      "സമൃദ്ധി ഫലം",
      "സമൃദ്ധി റിസൾട്ട്",
    ],
    intent: "LOTTERY_RESULT",
    lotteryCode: "SM",
    lotteryName: "Samrudhi",
  },
  {
    id: "Q035",
    category: "WEEKLY_LOTTERIES",
    questionEn: "Which weekly Kerala lottery has ₹1 Crore first prize?",
    questionMl: "1 കോടി രൂപ ഒന്നാം സമ്മാനമുള്ള പ്രതിവാര ലോട്ടറി ഏതാണ്?",
    patterns: [
      "1 crore lottery",
      "one crore weekly lottery",
      "which lottery has 1 crore",
      "1 kodi lottery",
      "1 കോടി ലോട്ടറി",
      "ഒരു കോടി ലോട്ടറി",
    ],
    intent: "LOTTERY_INFORMATION",
    directAnswer: {
      en: "Bhagyathara (BT, drawn on Mondays) and Dhanalekshmi (DL, drawn on Wednesdays) offer a grand First Prize of ₹1 Crore.",
      ml: "തിങ്കളാഴ്ച നറുക്കെടുക്കുന്ന ഭാഗ്യതാരാ (Bhagyathara), ബുധനാഴ്ച നറുക്കെടുക്കുന്ന ധനലക്ഷ്മി (Dhanalekshmi) എന്നിവയ്ക്ക് ₹1 കോടി രൂപയാണ് ഒന്നാം സമ്മാനം.",
    },
  },
  {
    id: "Q036",
    category: "WEEKLY_LOTTERIES",
    questionEn: "What is the 2nd prize amount in Bhagyathara?",
    questionMl: "ഭാഗ്യതാരാ ലോട്ടറിയുടെ രണ്ടാം സമ്മാനത്തുക എത്രയാണ്?",
    patterns: [
      "bhagyathara second prize",
      "bhagyathara 2nd prize amount",
      "ഭാഗ്യതാരാ രണ്ടാം സമ്മാനം",
    ],
    intent: "LOTTERY_PRIZE_STRUCTURE",
    lotteryCode: "BT",
    prizeTier: "2nd",
  },
  {
    id: "Q037",
    category: "WEEKLY_LOTTERIES",
    questionEn: "What is the 2nd prize amount in Sthree Sakthi?",
    questionMl: "സ്ത്രീശക്തി ലോട്ടറിയുടെ രണ്ടാം സമ്മാനം എത്രയാണ്?",
    patterns: [
      "sthree sakthi second prize",
      "sthree sakthi 2nd prize",
      "സ്ത്രീശക്തി രണ്ടാം സമ്മാനം",
    ],
    intent: "LOTTERY_PRIZE_STRUCTURE",
    lotteryCode: "SS",
    prizeTier: "2nd",
  },
  {
    id: "Q038",
    category: "WEEKLY_LOTTERIES",
    questionEn: "What is the 2nd prize amount in Dhanalekshmi?",
    questionMl: "ധനലക്ഷ്മി ലോട്ടറിയുടെ രണ്ടാം സമ്മാനം എത്രയാണ്?",
    patterns: [
      "dhanalekshmi second prize",
      "dhanalekshmi 2nd prize",
      "ധനലക്ഷ്മി രണ്ടാം സമ്മാനം",
    ],
    intent: "LOTTERY_PRIZE_STRUCTURE",
    lotteryCode: "DL",
    prizeTier: "2nd",
  },
  {
    id: "Q039",
    category: "WEEKLY_LOTTERIES",
    questionEn: "What is the 2nd prize amount in Karunya Plus?",
    questionMl: "കാരുണ്യ പ്ലസ് ലോട്ടറിയുടെ രണ്ടാം സമ്മാനം എത്രയാണ്?",
    patterns: [
      "karunya plus second prize",
      "karunya plus 2nd prize",
      "കാരുണ്യ പ്ലസ് രണ്ടാം സമ്മാനം",
    ],
    intent: "LOTTERY_PRIZE_STRUCTURE",
    lotteryCode: "KN",
    prizeTier: "2nd",
  },
  {
    id: "Q040",
    category: "WEEKLY_LOTTERIES",
    questionEn: "What is the 2nd prize amount in Suvarna Keralam?",
    questionMl: "സുവർണ്ണ കേരളം ലോട്ടറിയുടെ രണ്ടാം സമ്മാനം എത്രയാണ്?",
    patterns: [
      "suvarna keralam second prize",
      "suvarna 2nd prize",
      "സുവർണ്ണ കേരളം രണ്ടാം സമ്മാനം",
    ],
    intent: "LOTTERY_PRIZE_STRUCTURE",
    lotteryCode: "SK",
    prizeTier: "2nd",
  },

  // =========================================================================
  // CATEGORY 4: BUMPER LOTTERIES (15 Questions)
  // =========================================================================
  {
    id: "Q041",
    category: "BUMPER_LOTTERIES",
    questionEn: "Tell me about Thiruvonam Onam Bumper lottery.",
    questionMl: "തിരുവോണം ഓണം ബമ്പർ ലോട്ടറിയെക്കുറിച്ച് പറയൂ.",
    patterns: [
      "onam bumper",
      "thiruvonam bumper",
      "onam bumper first prize",
      "thiruvonam prize",
      "ഓണം ബമ്പർ",
      "തിരുവോണം ബമ്പർ",
      "ഓണം ബമ്പർ സമ്മാനം",
    ],
    intent: "LOTTERY_INFORMATION",
    lotteryCode: "TH",
    lotteryName: "Thiruvonam Bumper",
    directAnswer: {
      en: "Thiruvonam Bumper (Onam Bumper) is Kerala's biggest lottery, offering a historic ₹30 Crores First Prize! Ticket price is ₹500.",
      ml: "കേരളത്തിലെ ഏറ്റവും വലിയ ഭാഗ്യക്കുറിയായ തിരുവോണം ഓണം ബമ്പറിന്റെ ഒന്നാം സമ്മാനം ₹30 കോടി രൂപയാണ്! ടിക്കറ്റ് വില ₹500 രൂപ.",
      cardData: {
        title: "തിരുവോണം ഓണം ബമ്പർ (Onam Bumper)",
        subtitle: "കേരളത്തിലെ റെക്കോർഡ് സമ്മാനം",
        primaryHighlight: "₹30 കോടി",
        secondaryHighlight: "ഒന്നാം സമ്മാനം",
        badgeText: "BUMPER LOTTERY",
        details: [
          { label: "ഒന്നാം സമ്മാനം", value: "₹30 കോടി" },
          { label: "ടിക്കറ്റ് വില", value: "₹500" },
        ],
      },
    },
  },
  {
    id: "Q042",
    category: "BUMPER_LOTTERIES",
    questionEn: "What is the latest Onam Bumper winning number?",
    questionMl: "ഓണം ബമ്പർ വിജയിച്ച ടിക്കറ്റ് നമ്പർ ഏതാണ്?",
    patterns: [
      "onam bumper result",
      "onam bumper winner",
      "thiruvonam bumper result",
      "ഓണം ബമ്പർ റിസൾട്ട്",
      "ഓണം ബമ്പർ ഫലം",
    ],
    intent: "LOTTERY_RESULT",
    lotteryCode: "TH",
    lotteryName: "Thiruvonam Bumper",
  },
  {
    id: "Q043",
    category: "BUMPER_LOTTERIES",
    questionEn: "Tell me about Christmas New Year Bumper lottery.",
    questionMl: "ക്രിസ്മസ് ന്യൂ ഇയർ ബമ്പർ ലോട്ടറിയെക്കുറിച്ച് പറയൂ.",
    patterns: [
      "christmas bumper",
      "xmas bumper",
      "new year bumper",
      "christmas new year bumper",
      "ക്രിസ്മസ് ബമ്പർ",
      "ന്യൂ ഇയർ ബമ്പർ",
    ],
    intent: "LOTTERY_INFORMATION",
    lotteryCode: "XN",
    lotteryName: "Christmas New Year Bumper",
    directAnswer: {
      en: "Christmas New Year Bumper (XN) offers a First Prize of ₹30 Crores! Ticket price is ₹400.",
      ml: "ക്രിസ്മസ് ന്യൂ ഇയർ ബമ്പറിന്റെ ഒന്നാം സമ്മാനം ₹30 കോടി രൂപയാണ്! ടിക്കറ്റ് വില ₹400 രൂപ.",
    },
  },
  {
    id: "Q044",
    category: "BUMPER_LOTTERIES",
    questionEn: "What is Christmas New Year Bumper result?",
    questionMl: "ക്രിസ്മസ് ന്യൂ ഇയർ ബമ്പർ റിസൾട്ട് പറയൂ.",
    patterns: [
      "christmas bumper result",
      "xmas bumper result",
      "ക്രിസ്മസ് ബമ്പർ ഫലം",
      "ക്രിസ്മസ് ബമ്പർ റിസൾട്ട്",
    ],
    intent: "LOTTERY_RESULT",
    lotteryCode: "XN",
    lotteryName: "Christmas New Year Bumper",
  },
  {
    id: "Q045",
    category: "BUMPER_LOTTERIES",
    questionEn: "Tell me about Vishu Bumper lottery.",
    questionMl: "വിഷു ബമ്പർ ലോട്ടറിയുടെ വിവരങ്ങൾ എന്തൊക്കെയാണ്?",
    patterns: [
      "vishu bumper",
      "vishu bumper prize",
      "vishu bumper details",
      "വിഷു ബമ്പർ",
      "വിഷു ബമ്പർ സമ്മാനം",
    ],
    intent: "LOTTERY_INFORMATION",
    lotteryCode: "VB",
    lotteryName: "Vishu Bumper",
    directAnswer: {
      en: "Vishu Bumper (VB) offers a First Prize of ₹30 Crores. Ticket price is ₹300.",
      ml: "വിഷു ബമ്പറിന്റെ ഒന്നാം സമ്മാനം ₹30 കോടി രൂപയാണ്. ടിക്കറ്റ് വില ₹300 രൂപ.",
    },
  },
  {
    id: "Q046",
    category: "BUMPER_LOTTERIES",
    questionEn: "What is Vishu Bumper latest result?",
    questionMl: "വിഷു ബമ്പർ റിസൾട്ട് എന്താണ്?",
    patterns: [
      "vishu bumper result",
      "vishu bumper winner",
      "വിഷു ബമ്പർ ഫലം",
      "വിഷു ബമ്പർ റിസൾട്ട്",
    ],
    intent: "LOTTERY_RESULT",
    lotteryCode: "VB",
    lotteryName: "Vishu Bumper",
  },
  {
    id: "Q047",
    category: "BUMPER_LOTTERIES",
    questionEn: "Tell me about Pooja Bumper lottery.",
    questionMl: "പൂജ ബമ്പർ ലോട്ടറിയെക്കുറിച്ച് പറയൂ.",
    patterns: [
      "pooja bumper",
      "pooja bumper prize",
      "പൂജ ബമ്പർ",
      "പൂജ ബമ്പർ സമ്മാനം",
    ],
    intent: "LOTTERY_INFORMATION",
    lotteryCode: "PB",
    lotteryName: "Pooja Bumper",
    directAnswer: {
      en: "Pooja Bumper (PB) offers a First Prize of ₹12 Crores. Ticket price is ₹300.",
      ml: "പൂജ ബമ്പറിന്റെ ഒന്നാം സമ്മാനം ₹12 കോടി രൂപയാണ്. ടിക്കറ്റ് വില ₹300 രൂപ.",
    },
  },
  {
    id: "Q048",
    category: "BUMPER_LOTTERIES",
    questionEn: "What is Pooja Bumper result?",
    questionMl: "പൂജ ബമ്പർ റിസൾട്ട് പറയൂ.",
    patterns: [
      "pooja bumper result",
      "pooja bumper winner",
      "പൂജ ബമ്പർ ഫലം",
      "പൂജ ബമ്പർ റിസൾട്ട്",
    ],
    intent: "LOTTERY_RESULT",
    lotteryCode: "PB",
    lotteryName: "Pooja Bumper",
  },
  {
    id: "Q049",
    category: "BUMPER_LOTTERIES",
    questionEn: "Tell me about Monsoon Bumper lottery.",
    questionMl: "മൺസൂൺ ബമ്പർ ലോട്ടറിയെക്കുറിച്ച് പറയൂ.",
    patterns: [
      "monsoon bumper",
      "monsoon bumper prize",
      "മൺസൂൺ ബമ്പർ",
      "മൺസൂൺ ബമ്പർ സമ്മാനം",
    ],
    intent: "LOTTERY_INFORMATION",
    lotteryCode: "MB",
    lotteryName: "Monsoon Bumper",
    directAnswer: {
      en: "Monsoon Bumper (MB) offers a First Prize of ₹30 Crores. Ticket price is ₹250.",
      ml: "മൺസൂൺ ബമ്പറിന്റെ ഒന്നാം സമ്മാനം ₹30 കോടി രൂപയാണ്. ടിക്കറ്റ് വില ₹250 രൂപ.",
    },
  },
  {
    id: "Q050",
    category: "BUMPER_LOTTERIES",
    questionEn: "What is Monsoon Bumper result?",
    questionMl: "മൺസൂൺ ബമ്പർ റിസൾട്ട് പറയൂ.",
    patterns: [
      "monsoon bumper result",
      "monsoon bumper winner",
      "മൺസൂൺ ബമ്പർ ഫലം",
      "മൺസൂൺ ബമ്പർ റിസൾട്ട്",
    ],
    intent: "LOTTERY_RESULT",
    lotteryCode: "MB",
    lotteryName: "Monsoon Bumper",
  },
  {
    id: "Q051",
    category: "BUMPER_LOTTERIES",
    questionEn: "Tell me about Summer Bumper lottery.",
    questionMl: "സമ്മർ ബമ്പർ ലോട്ടറിയെക്കുറിച്ച് പറയൂ.",
    patterns: [
      "summer bumper",
      "summer bumper prize",
      "സമ്മർ ബമ്പർ",
      "സമ്മർ ബമ്പർ സമ്മാനം",
    ],
    intent: "LOTTERY_INFORMATION",
    lotteryCode: "SB",
    lotteryName: "Summer Bumper",
    directAnswer: {
      en: "Summer Bumper (SB) offers a First Prize of ₹30 Crores. Ticket price is ₹250.",
      ml: "സമ്മർ ബമ്പറിന്റെ ഒന്നാം സമ്മാനം ₹30 കോടി രൂപയാണ്. ടിക്കറ്റ് വില ₹250 രൂപ.",
    },
  },
  {
    id: "Q052",
    category: "BUMPER_LOTTERIES",
    questionEn: "What is Summer Bumper result?",
    questionMl: "സമ്മർ ബമ്പർ റിസൾട്ട് പറയൂ.",
    patterns: [
      "summer bumper result",
      "summer bumper winner",
      "സമ്മർ ബമ്പർ ഫലം",
      "സമ്മർ ബമ്പർ റിസൾട്ട്",
    ],
    intent: "LOTTERY_RESULT",
    lotteryCode: "SB",
    lotteryName: "Summer Bumper",
  },
  {
    id: "Q053",
    category: "BUMPER_LOTTERIES",
    questionEn: "How many bumper lotteries are there in Kerala each year?",
    questionMl: "കേരളത്തിൽ വർഷത്തിൽ എത്ര ബമ്പർ ലോട്ടറികളുണ്ട്?",
    patterns: [
      "how many bumpers",
      "how many bumper lotteries",
      "all bumper lotteries",
      "list of bumper lotteries",
      "എത്ര ബമ്പർ ലോട്ടറികൾ",
      "എല്ലാ ബമ്പർ ലോട്ടറികളും",
    ],
    intent: "LOTTERY_INFORMATION",
    directAnswer: {
      en: "Kerala conducts 6 Bumper lotteries annually:\n1. Thiruvonam Bumper (₹30 Cr)\n2. Christmas New Year Bumper (₹30 Cr)\n3. Summer Bumper (₹30 Cr)\n4. Vishu Bumper (₹30 Cr)\n5. Monsoon Bumper (₹30 Cr)\n6. Pooja Bumper (₹12 Cr)",
      ml: "കേരളത്തിൽ വർഷംതോറും 6 ബമ്പർ ലോട്ടറികളാണ് നറുക്കെടുക്കുന്നത്:\n1. തിരുവോണം ഓണം ബമ്പർ (₹30 കോടി)\n2. ക്രിസ്മസ് ന്യൂ ഇയർ ബമ്പർ (₹30 കോടി)\n3. സമ്മർ ബമ്പർ (₹30 കോടി)\n4. വിഷു ബമ്പർ (₹30 കോടി)\n5. മൺസൂൺ ബമ്പർ (₹30 കോടി)\n6. പൂജ ബമ്പർ (₹12 കോടി)",
    },
  },
  {
    id: "Q054",
    category: "BUMPER_LOTTERIES",
    questionEn: "What is the highest lottery prize in Kerala?",
    questionMl: "കേരളത്തിലെ ഏറ്റവും വലിയ ലോട്ടറി സമ്മാനം ഏതാണ്?",
    patterns: [
      "highest lottery prize",
      "biggest prize in kerala",
      "highest prize amount",
      "ഏറ്റവും വലിയ സമ്മാനം",
      "ഏറ്റവും ഉയർന്ന ലോട്ടറി സമ്മാനം",
    ],
    intent: "LOTTERY_INFORMATION",
    directAnswer: {
      en: "The highest lottery prize in Kerala is ₹30 Crores, awarded by major bumpers like Thiruvonam, Christmas New Year, Vishu, Summer, and Monsoon Bumpers.",
      ml: "കേരളത്തിലെ ഏറ്റവും വലിയ ലോട്ടറി സമ്മാനം ₹30 കോടി രൂപയാണ് (തിരുവോണം, ക്രിസ്മസ് ന്യൂ ഇയർ, വിഷു, സമ്മർ, മൺസൂൺ ബമ്പറുകൾക്ക് ലഭിക്കുന്നു).",
    },
  },
  {
    id: "Q055",
    category: "BUMPER_LOTTERIES",
    questionEn: "When will the next bumper lottery draw take place?",
    questionMl: "അടുത്ത ബമ്പർ ലോട്ടറി നറുക്കെടുപ്പ് എപ്പോഴാണ്?",
    patterns: [
      "next bumper lottery",
      "upcoming bumper draw",
      "adutha bumper eppozhanu",
      "അടുത്ത ബമ്പർ ലോട്ടറി",
      "അടുത്ത ബമ്പർ നറുക്കെടുപ്പ്",
    ],
    intent: "LOTTERY_SCHEDULE",
  },

  // =========================================================================
  // CATEGORY 5: TICKET CHECKING & VERIFICATION (15 Questions)
  // =========================================================================
  {
    id: "Q056",
    category: "TICKET_CHECK",
    questionEn: "How can I check my lottery ticket?",
    questionMl: "എന്റെ ലോട്ടറി ടിക്കറ്റ് എങ്ങനെ പരിശോധിക്കാം?",
    patterns: [
      "how to check ticket",
      "ticket engane check cheyyam",
      "ticket checking",
      "ടിക്കറ്റ് എങ്ങനെ പരിശോധിക്കാം",
      "ടിക്കറ്റ് ചെക്ക് ചെയ്യേണ്ട വിധം",
    ],
    intent: "TICKET_CHECK",
    directAnswer: {
      en: "You can check your ticket in 3 easy ways:\n1. Type or speak your 6-digit ticket number directly to me.\n2. Tap the Scan button in the bottom menu to scan the ticket barcode.\n3. Go to Search tab and enter your ticket number.",
      ml: "3 എളുപ്പവഴികളിലൂടെ നിങ്ങളുടെ ടിക്കറ്റ് പരിശോധിക്കാം:\n1. നിങ്ങളുടെ 6 അക്ക ടിക്കറ്റ് നമ്പർ എന്നോട് പറയുകയോ ഇവിടെ ടൈപ്പ് ചെയ്യുകയോ ചെയ്യുക.\n2. താഴെയുള്ള 'Scan' ബട്ടൺ അമർത്തി ടിക്കറ്റിലെ ബാർകോഡ് സ്കാൻ ചെയ്യുക.\n3. 'Search' ടാബിൽ കയറി ടിക്കറ്റ് നമ്പർ ടൈപ്പ് ചെയ്ത് പരിശോധിക്കുക.",
    },
  },
  {
    id: "Q057",
    category: "TICKET_CHECK",
    questionEn: "Check ticket number 123456.",
    questionMl: "123456 എന്ന ടിക്കറ്റ് നമ്പർ പരിശോധിക്കുക.",
    patterns: [
      "check ticket 123456",
      "check 123456",
      "ticket 123456",
      "123456 check cheyyu",
      "ടിക്കറ്റ് 123456 പരിശോധിക്കൂ",
    ],
    intent: "TICKET_CHECK",
  },
  {
    id: "Q058",
    category: "TICKET_CHECK",
    questionEn: "Did my ticket win any prize?",
    questionMl: "എന്റെ ടിക്കറ്റിന് എന്തെങ്കിലും സമ്മാനം ലഭിച്ചോ?",
    patterns: [
      "did my ticket win",
      "ente ticketin sammanam kittiyo",
      "prize adicho",
      "ടിക്കറ്റിന് സമ്മാനം ഉണ്ടോ",
      "ടിക്കറ്റിന് സമ്മാനം ലഭിച്ചോ",
    ],
    intent: "TICKET_CHECK",
    directAnswer: {
      en: "Please provide your 6-digit ticket number (e.g., 'Check ticket WA 123456'), and I will verify it against the official database immediately!",
      ml: "ദയവായി നിങ്ങളുടെ 6 അക്ക ടിക്കറ്റ് നമ്പർ പറയൂ (ഉദാ: 'ടിക്കറ്റ് 123456 പരിശോധിക്കുക'). ഞാൻ ഉടനടി ഔദ്യോഗിക ഡാറ്റാബേസിൽ പരിശോധിച്ച് ഫലം അറിയിക്കാം!",
    },
  },
  {
    id: "Q059",
    category: "TICKET_CHECK",
    questionEn: "Can I search without series code?",
    questionMl: "സീരീസ് കോഡ് ഇല്ലാതെ ടിക്കറ്റ് പരിശോധിക്കാമോ?",
    patterns: [
      "search without series",
      "without code",
      "just 6 digits",
      "series illathe check cheyyamo",
      "സീരീസ് ഇല്ലാതെ പരിശോധിക്കാമോ",
    ],
    intent: "TICKET_CHECK",
    directAnswer: {
      en: "Yes! You can search using just the 6-digit number (e.g. 543210). If it matches across any series, all matching prize tiers will be shown.",
      ml: "തീർച്ചയായും! സീരീസ് അക്ഷരങ്ങൾ ഇല്ലാതെ വെറും 6 അക്കങ്ങൾ (ഉദാ: 543210) മാത്രം നൽകിയും പരിശോധിക്കാം. എല്ലാ സീരീസുകളിലുമുള്ള സമ്മാനങ്ങൾ പരിശോധിക്കപ്പെടും.",
    },
  },
  {
    id: "Q060",
    category: "TICKET_CHECK",
    questionEn: "What are the series letters used in Kerala lotteries?",
    questionMl: "കേരള ലോട്ടറിയിൽ ഉപയോഗിക്കുന്ന സീരീസ് അക്ഷരങ്ങൾ ഏതൊക്കെയാണ്?",
    patterns: [
      "series letters",
      "lottery series letters",
      "series alphabets",
      "ഏതൊക്കെ സീരീസ്",
      "സീരീസ് അക്ഷരങ്ങൾ",
    ],
    intent: "LOTTERY_INFORMATION",
    directAnswer: {
      en: "Kerala lotteries typically use 12 series: WA, WB, WC, WD, WE, WF, WG, WH, WJ, WK, WL, WM.",
      ml: "കേരള ഭാഗ്യക്കുറിയിൽ സാധാരണയായി 12 സീരീസുകളാണുള്ളത്: WA, WB, WC, WD, WE, WF, WG, WH, WJ, WK, WL, WM.",
    },
  },
  {
    id: "Q061",
    category: "TICKET_CHECK",
    questionEn: "Can I check older historical tickets from last month?",
    questionMl: "കഴിഞ്ഞ മാസത്തെ പഴയ ടിക്കറ്റുകൾ പരിശോധിക്കാമോ?",
    patterns: [
      "check old ticket",
      "historical ticket search",
      "last month ticket",
      "palaya ticket check cheyyamo",
      "പഴയ ടിക്കറ്റ് പരിശോധിക്കാമോ",
    ],
    intent: "TICKET_CHECK",
    directAnswer: {
      en: "Yes! Our database contains verified historical results. Simply enter your ticket number or use the Archive tab to view past draws.",
      ml: "തീർച്ചയായും! ആപ്പിലെ ആർക്കൈവ് (Archive) ഡാറ്റാബേസിൽ മുൻകാലങ്ങളിലെ എല്ലാ ഫലങ്ങളുമുണ്ട്. ടിക്കറ്റ് നമ്പർ നൽകി പരിശോധിക്കാവുന്നതാണ്.",
    },
  },
  {
    id: "Q062",
    category: "TICKET_CHECK",
    questionEn: "How do I check the last 4 digits prize?",
    questionMl: "അവസാന 4 അക്ക സമ്മാനം എങ്ങനെ അറിയാം?",
    patterns: [
      "last 4 digits prize",
      "last 4 numbers",
      "avasanatha 4 digit",
      "അവസാന 4 അക്കം",
      "അവസാന 4 അക്ക സമ്മാനം",
    ],
    intent: "PRIZE_STRUCTURE",
    directAnswer: {
      en: "Prizes from 4th to 8th rank (₹5,000, ₹2,000, ₹1,000, ₹500, ₹100) are awarded based on the matching last 4 digits of your ticket.",
      ml: "4-ാം സമ്മാനം മുതൽ 8-ാം സമ്മാനം വരെയുള്ള തുകകൾ (₹5,000, ₹2,000, ₹1,000, ₹500, ₹100) നിങ്ങളുടെ ടിക്കറ്റിന്റെ അവസാന 4 അക്കങ്ങൾ ഒത്തുനോക്കിയാണ് നൽകുന്നത്.",
    },
  },
  {
    id: "Q063",
    category: "TICKET_CHECK",
    questionEn: "What is a consolation prize in Kerala lottery?",
    questionMl: "കേരള ലോട്ടറിയിൽ സമാശ്വാസ സമ്മാനം എന്നാൽ എന്താണ്?",
    patterns: [
      "what is consolation prize",
      "consolation prize meaning",
      "samashwasa sammanam ennal entha",
      "സമാശ്വാസ സമ്മാനം എന്നാൽ എന്താണ്",
    ],
    intent: "LOTTERY_INFORMATION",
    directAnswer: {
      en: "A consolation prize (typically ₹8,000) is given to tickets having the same 6-digit winning number as the 1st prize, but in the other 11 remaining series.",
      ml: "ഒന്നാം സമ്മാനം ലഭിച്ച അതേ 6 അക്ക നമ്പറുള്ള മറ്റ് 11 സീരീസുകളിലെ ടിക്കറ്റുകൾക്കാണ് സമാശ്വാസ സമ്മാനം (സാധാരണയായി ₹8,000 രൂപ) ലഭിക്കുന്നത്.",
    },
  },
  {
    id: "Q064",
    category: "TICKET_CHECK",
    questionEn: "Check if my ticket has won 5000 rupees.",
    questionMl: "എന്റെ ടിക്കറ്റിന് 5000 രൂപ സമ്മാനം ലഭിച്ചിട്ടുണ്ടോ എന്ന് പരിശോധിക്കൂ.",
    patterns: [
      "won 5000 rupees",
      "5000 prize check",
      "5000 kittiyo",
      "5000 രൂപ അടിച്ചോ",
    ],
    intent: "TICKET_CHECK",
    prizeTier: "4th",
  },
  {
    id: "Q065",
    category: "TICKET_CHECK",
    questionEn: "Can I check bumper tickets using this app?",
    questionMl: "ഈ ആപ്പ് ഉപയോഗിച്ച് ബമ്പർ ടിക്കറ്റ് പരിശോധിക്കാമോ?",
    patterns: [
      "check bumper ticket",
      "bumper checking",
      "ബമ്പർ ടിക്കറ്റ് പരിശോധിക്കാമോ",
    ],
    intent: "TICKET_CHECK",
    directAnswer: {
      en: "Yes! All Kerala bumper lottery tickets (Onam, Christmas, Vishu, Pooja, Monsoon, Summer) can be checked by ticket number or barcode scan.",
      ml: "തീർച്ചയായും! ഓണം, ക്രിസ്മസ്, വിഷു, പൂജ, മൺസൂൺ, സമ്മർ തുടങ്ങി എല്ലാ ബമ്പർ ടിക്കറ്റുകളും നമ്പറോ ബാർകോഡോ ഉപയോഗിച്ച് പരിശോധിക്കാം.",
    },
  },
  {
    id: "Q066",
    category: "TICKET_CHECK",
    questionEn: "What if my ticket matches partially?",
    questionMl: "ടിക്കറ്റിലെ ചില നമ്പറുകൾ മാത്രം ഒത്തുവന്നാൽ സമ്മാനം കിട്ടുമോ?",
    patterns: [
      "partial match",
      "few numbers match",
      "kure number mathram",
      "ചില നമ്പറുകൾ മാത്രം ഒത്തുവന്നാൽ",
    ],
    intent: "LOTTERY_INFORMATION",
    directAnswer: {
      en: "For 1st, 2nd, and 3rd prizes, all 6 digits and series must match. For 4th to 8th prizes, the last 4 digits must match exactly.",
      ml: "1, 2, 3 സമ്മാനങ്ങൾക്ക് 6 അക്കങ്ങളും കൃത്യമായി ഒത്തു cut വരണം. 4 മുതൽ 8 വരെയുള്ള ചെറിയ സമ്മാനങ്ങൾക്ക് ടിക്കറ്റിന്റെ അവസാന 4 അക്കങ്ങൾ ഒത്തു cut വന്നാൽ മതിയാകും.",
    },
  },
  {
    id: "Q067",
    category: "TICKET_CHECK",
    questionEn: "Is my ticket check result 100% verified?",
    questionMl: "ടിക്കറ്റ് പരിശോധനാ ഫലം 100% കൃത്യവും ഔദ്യോഗികവുമാണോ?",
    patterns: [
      "is result verified",
      "official result check",
      "100 percent accurate",
      "ഫലം ഔദ്യോഗികമാണോ",
      "കൃത്യമാണോ",
    ],
    intent: "LOTTERY_INFORMATION",
    directAnswer: {
      en: "Yes, our results are synchronized with the official Kerala Government Gazette and verified draw records.",
      ml: "അതെ, ഈ ആപ്പിലെ ഫലങ്ങൾ കേരള സർക്കാർ ലോട്ടറി വകുപ്പിന്റെ ഔദ്യോഗിക ഗസറ്റ് റെക്കോർഡുകളുമായി നേരിട്ട് ഒത്തുനോക്കി ഉറപ്പുവരുത്തിയവയാണ്.",
    },
  },
  {
    id: "Q068",
    category: "TICKET_CHECK",
    questionEn: "Check ticket AB 458921.",
    questionMl: "AB 458921 എന്ന ടിക്കറ്റ് നമ്പർ പരിശോധിക്കുക.",
    patterns: ["check ab 458921", "ab 458921", "ab458921"],
    intent: "TICKET_CHECK",
  },
  {
    id: "Q069",
    category: "TICKET_CHECK",
    questionEn: "Check ticket WN 982104.",
    questionMl: "WN 982104 എന്ന ടിക്കറ്റ് നമ്പർ പരിശോധിക്കുക.",
    patterns: ["check wn 982104", "wn 982104", "wn982104"],
    intent: "TICKET_CHECK",
  },
  {
    id: "Q070",
    category: "TICKET_CHECK",
    questionEn: "Check ticket KR 304192.",
    questionMl: "KR 304192 എന്ന ടിക്കറ്റ് നമ്പർ പരിശോധിക്കുക.",
    patterns: ["check kr 304192", "kr 304192", "kr304192"],
    intent: "TICKET_CHECK",
  },

  // =========================================================================
  // CATEGORY 6: PRIZE STRUCTURE & AMOUNTS (10 Questions)
  // =========================================================================
  {
    id: "Q071",
    category: "PRIZE_STRUCTURE",
    questionEn: "What are all the prize tiers in a weekly lottery?",
    questionMl: "പ്രതിവാര ലോട്ടറിയിലെ സമ്മാന ഘടന എങ്ങനെയാണ്?",
    patterns: [
      "prize tiers",
      "all prize tiers",
      "prize structure",
      "sammana ghadana",
      "സമ്മാന ഘടന",
      "എല്ലാ സമ്മാനങ്ങളും",
    ],
    intent: "LOTTERY_PRIZE_STRUCTURE",
    directAnswer: {
      en: "Kerala Weekly Lotteries have 8 prize tiers + Consolation prize:\n1st Prize: ₹70L - ₹1 Crore\n2nd Prize: ₹5L - ₹10 Lakhs\n3rd Prize: ₹1 Lakh / ₹5,000\n4th Prize: ₹5,000\n5th Prize: ₹2,000 / ₹1,000\n6th Prize: ₹1,000 / ₹500\n7th Prize: ₹500\n8th Prize: ₹100\nConsolation: ₹8,000",
      ml: "പ്രതിവാര ലോട്ടറികളിൽ 8 സമ്മാന തട്ടുകളും സമാശ്വാസ സമ്മാനവും ഉണ്ട്:\n• ഒന്നാം സമ്മാനം: ₹70 ലക്ഷം - ₹1 കോടി\n• രണ്ടാം സമ്മാനം: ₹5 ലക്ഷം - ₹10 ലക്ഷം\n• മൂന്നാം സമ്മാനം: ₹1 ലക്ഷം\n• 4-ാം സമ്മാനം: ₹5,000\n• 5-ാം സമ്മാനം: ₹2,000 / ₹1,000\n• 6-ാം സമ്മാനം: ₹1,000 / ₹500\n• 7-ാം സമ്മാനം: ₹500\n• 8-ാം സമ്മാനം: ₹100\n• സമാശ്വാസ സമ്മാനം: ₹8,000",
    },
  },
  {
    id: "Q072",
    category: "PRIZE_STRUCTURE",
    questionEn: "How much is the 4th prize in Kerala lottery?",
    questionMl: "കേരള ലോട്ടറിയിൽ നാലാം സമ്മാനം എത്രയാണ്?",
    patterns: [
      "fourth prize amount",
      "4th prize ethra",
      "നാലാം സമ്മാനം എത്ര",
    ],
    intent: "LOTTERY_PRIZE_STRUCTURE",
    prizeTier: "4th",
    directAnswer: {
      en: "The 4th prize in most weekly Kerala lotteries is ₹5,000.",
      ml: "മിക്ക പ്രതിവാര കേരള ലോട്ടറികളിലും നാലാം സമ്മാനം ₹5,000 രൂപയാണ്.",
    },
  },
  {
    id: "Q073",
    category: "PRIZE_STRUCTURE",
    questionEn: "How much is the 5th prize in Kerala lottery?",
    questionMl: "അഞ്ചാം സമ്മാനം എത്ര രൂപയാണ്?",
    patterns: [
      "fifth prize amount",
      "5th prize ethra",
      "അഞ്ചാം സമ്മാനം എത്ര",
    ],
    intent: "LOTTERY_PRIZE_STRUCTURE",
    prizeTier: "5th",
    directAnswer: {
      en: "The 5th prize is generally ₹1,000 or ₹2,000 depending on the specific draw structure.",
      ml: "അഞ്ചാം സമ്മാനം സാധാരണയായി ₹1,000 അല്ലെങ്കിൽ ₹2,000 രൂപയാണ്.",
    },
  },
  {
    id: "Q074",
    category: "PRIZE_STRUCTURE",
    questionEn: "How much is the lowest prize in Kerala lottery?",
    questionMl: "കേരള ലോട്ടറിയിലെ ഏറ്റവും കുറഞ്ഞ സമ്മാനത്തുക എത്രയാണ്?",
    patterns: [
      "lowest prize",
      "minimum prize",
      "8th prize",
      "ettam sammanam",
      "ഏറ്റവും കുറഞ്ഞ സമ്മാനം",
      "എട്ടാം സമ്മാനം",
    ],
    intent: "LOTTERY_PRIZE_STRUCTURE",
    prizeTier: "8th",
    directAnswer: {
      en: "The lowest prize in Kerala weekly lotteries is the 8th prize of ₹100.",
      ml: "കേരള പ്രതിവാര ലോട്ടറികളിലെ ഏറ്റവും കുറഞ്ഞ സമ്മാനം എട്ടാം സമ്മാനമായ ₹100 രൂപയാണ്.",
    },
  },
  {
    id: "Q075",
    category: "PRIZE_STRUCTURE",
    questionEn: "How many people get consolation prize?",
    questionMl: "എത്രപേർക്ക് സമാശ്വാസ സമ്മാനം ലഭിക്കും?",
    patterns: [
      "how many get consolation",
      "consolation prize count",
      "എത്രപേർക്ക് സമാശ്വാസ സമ്മാനം",
    ],
    intent: "LOTTERY_PRIZE_STRUCTURE",
    directAnswer: {
      en: "In each 12-series draw, 11 tickets win the consolation prize (all remaining series with the same 1st prize number).",
      ml: "ഓരോ നറുക്കെടുപ്പിലും 11 പേർക്ക് സമാശ്വാസ സമ്മാനം ലഭിക്കും (12 സീരീസുകളിൽ ഒന്നാം സമ്മാനം ലഭിച്ചതൊഴികെയുള്ള ബാക്കി 11 സീരീസുകൾക്ക്).",
    },
  },
  {
    id: "Q076",
    category: "PRIZE_STRUCTURE",
    questionEn: "What is the prize structure of Onam Bumper?",
    questionMl: "ഓണം ബമ്പറിന്റെ സമ്മാന ഘടന എങ്ങനെയാണ്?",
    patterns: [
      "onam bumper prize structure",
      "onam bumper prizes list",
      "ഓണം ബമ്പർ സമ്മാന ഘടന",
    ],
    intent: "LOTTERY_PRIZE_STRUCTURE",
    lotteryCode: "TH",
    directAnswer: {
      en: "Onam Bumper Prizes:\n• 1st Prize: ₹25 Crores (1 ticket)\n• 2nd Prize: ₹1 Crore each (20 tickets)\n• 3rd Prize: ₹50 Lakhs each (20 tickets)\n• 4th Prize: ₹5 Lakhs each (10 tickets)\n• 5th Prize: ₹2 Lakhs each (10 tickets)\n• 6th to 9th Prizes: ₹5,000 down to ₹500.",
      ml: "ഓണം ബമ്പർ സമ്മാനങ്ങൾ:\n• ഒന്നാം സമ്മാനം: ₹25 കോടി (1 പേർക്ക്)\n• രണ്ടാം സമ്മാനം: ₹1 കോടി വീതം (20 പേർക്ക്)\n• മൂന്നാം സമ്മാനം: ₹50 ലക്ഷം വീതം (20 പേർക്ക്)\n• നാലാം സമ്മാനം: ₹5 ലക്ഷം വീതം (10 പേർക്ക്)\n• മറ്റ് നിരവധി ചെറിയ സമ്മാനങ്ങൾ ₹5,000 മുതൽ ₹500 വരെ.",
    },
  },
  {
    id: "Q077",
    category: "PRIZE_STRUCTURE",
    questionEn: "What is the 3rd prize amount in Dhanalekshmi?",
    questionMl: "ധനലക്ഷ്മി ലോട്ടറിയുടെ മൂന്നാം സമ്മാനം എത്രയാണ്?",
    patterns: ["dhanalekshmi third prize", "dhanalekshmi 3rd prize", "ധനലക്ഷ്മി മൂന്നാം സമ്മാനം"],
    intent: "LOTTERY_PRIZE_STRUCTURE",
    lotteryCode: "DL",
    prizeTier: "3rd",
  },
  {
    id: "Q078",
    category: "PRIZE_STRUCTURE",
    questionEn: "What is the 3rd prize amount in Karunya Plus?",
    questionMl: "കാരുണ്യ പ്ലസ് ലോട്ടറിയുടെ മൂന്നാം സമ്മാനം എത്രയാണ്?",
    patterns: ["karunya plus third prize", "karunya plus 3rd prize", "കാരുണ്യ പ്ലസ് മൂന്നാം സമ്മാനം"],
    intent: "LOTTERY_PRIZE_STRUCTURE",
    lotteryCode: "KN",
    prizeTier: "3rd",
  },
  {
    id: "Q079",
    category: "PRIZE_STRUCTURE",
    questionEn: "What is the 3rd prize amount in Bhagyathara?",
    questionMl: "ഭാഗ്യതാരാ ലോട്ടറിയുടെ മൂന്നാം സമ്മാനം എത്രയാണ്?",
    patterns: ["bhagyathara third prize", "bhagyathara 3rd prize", "ഭാഗ്യതാരാ മൂന്നാം സമ്മാനം"],
    intent: "LOTTERY_PRIZE_STRUCTURE",
    lotteryCode: "BT",
    prizeTier: "3rd",
  },
  {
    id: "Q080",
    category: "PRIZE_STRUCTURE",
    questionEn: "What is the 3rd prize amount in Suvarna Keralam?",
    questionMl: "സുവർണ്ണ കേരളം ലോട്ടറിയുടെ മൂന്നാം സമ്മാനം എത്രയാണ്?",
    patterns: ["suvarna keralam third prize", "suvarna 3rd prize", "സുവർണ്ണ കേരളം മൂന്നാം സമ്മാനം"],
    intent: "LOTTERY_PRIZE_STRUCTURE",
    lotteryCode: "SK",
    prizeTier: "3rd",
  },

  // =========================================================================
  // CATEGORY 7: DRAW TIMING, TELECAST & VENUE (8 Questions)
  // =========================================================================
  {
    id: "Q081",
    category: "SCHEDULE_VENUE",
    questionEn: "What time is the lottery draw conducted?",
    questionMl: "കേരള ലോട്ടറി നറുക്കെടുപ്പ് ഏത് സമയത്താണ് നടക്കുന്നത്?",
    patterns: [
      "what time is draw",
      "draw time",
      "draw timing",
      "narukkeduppu samayam",
      "നറുക്കെടുപ്പ് സമയം എപ്പോഴാണ്",
      "ലോട്ടറി സമയം",
    ],
    intent: "SCHEDULE_VENUE",
    directAnswer: {
      en: "All official Kerala State Lottery draws begin at 3:00 PM every afternoon.",
      ml: "കേരള ഭാഗ്യക്കുറിയുടെ എല്ലാ നറുക്കെടുപ്പുകളും ദിവസവും ഉച്ചയ്ക്ക് 3:00 മണിക്ക് കൃത്യമായി ആരംഭിക്കുന്നു.",
    },
  },
  {
    id: "Q082",
    category: "SCHEDULE_VENUE",
    questionEn: "Where is the Kerala lottery draw conducted?",
    questionMl: "ലോട്ടറി നറുക്കെടുപ്പ് എവിടെവെച്ചാണ് നടക്കുന്നത്?",
    patterns: [
      "where is draw conducted",
      "draw venue",
      "draw location",
      "narukkeduppu sthalam",
      "നറുക്കെടുപ്പ് വേദി",
      "എവിടെവെച്ചാണ് നറുക്കെടുപ്പ്",
    ],
    intent: "SCHEDULE_VENUE",
    directAnswer: {
      en: "The draw is conducted openly at Gorky Bhavan, Near Bakery Junction, Thiruvananthapuram, in the presence of an independent judges panel and the public.",
      ml: "തിരുവനന്തപുരം ബേക്കറി ജംഗ്ഷന് സമീപമുള്ള 'ഗോർക്കി ഭവനിൽ' വെച്ചാണ് ജഡ്ജിംഗ് പാനലിന്റെയും പൊതുജനങ്ങളുടെയും സാന്നിധ്യത്തിൽ സുതാര്യമായി നറുക്കെടുപ്പ് നടക്കുന്നത്.",
    },
  },
  {
    id: "Q083",
    category: "SCHEDULE_VENUE",
    questionEn: "Can the public watch the lottery draw directly?",
    questionMl: "പൊതുജനങ്ങൾക്ക് നറുക്കെടുപ്പ് നേരിൽ കാണാൻ സാധിക്കുമോ?",
    patterns: [
      "can public watch draw",
      "direct viewing",
      "neril kaanamo",
      "നേരിൽ കാണാമോ",
      "പൊതുജനങ്ങൾക്ക് കാണാമോ",
    ],
    intent: "SCHEDULE_VENUE",
    directAnswer: {
      en: "Yes, the draw at Gorky Bhavan is completely open to the public to ensure transparency.",
      ml: "തീർച്ചയായും, ഗോർക്കി ഭവനിൽ നടക്കുന്ന നറുക്കെടുപ്പ് പൂർണ്ണമായും പൊതുജനങ്ങൾക്ക് സൗജന്യമായി നേരിൽ കാണാവുന്നതാണ്.",
    },
  },
  {
    id: "Q084",
    category: "SCHEDULE_VENUE",
    questionEn: "Where can I watch the live lottery draw?",
    questionMl: "ലൈവ് നറുക്കെടുപ്പ് എവിടെ കാണാം?",
    patterns: [
      "watch live draw",
      "live draw telecast",
      "live stream",
      "live streaming",
      "ലൈവ് നറുക്കെടുപ്പ് എവിടെ കാണാം",
      "ലൈവ് ടെലികാസ്റ്റ്",
    ],
    intent: "SCHEDULE_VENUE",
    directAnswer: {
      en: "Live draws are broadcast at 3:00 PM on official Kerala Lottery YouTube channels and regional Malayalam news channels.",
      ml: "ഉച്ചയ്ക്ക് 3:00 മണിക്ക് കേരള ഭാഗ്യക്കുറി വകുപ്പിന്റെ ഔദ്യോഗിക യൂട്യൂബ് ചാനലുകളിലും പ്രധാന മലയാള വാർത്താ ചാനലുകളിലും തത്സമയം സംപ്രേഷണം ചെയ്യും.",
    },
  },
  {
    id: "Q085",
    category: "SCHEDULE_VENUE",
    questionEn: "How long does the draw take?",
    questionMl: "നറുക്കെടുപ്പ് എത്ര സമയം നീണ്ടുനിൽക്കും?",
    patterns: [
      "how long draw takes",
      "draw duration",
      "ethra samayam edukkum",
      "എത്ര സമയം എടുക്കും",
    ],
    intent: "SCHEDULE_VENUE",
    directAnswer: {
      en: "The draw begins at 3:00 PM and finishes around 4:00 PM to 4:30 PM, after which the official gazette list is published.",
      ml: "ഉച്ചയ്ക്ക് 3:00 മണിക്ക് ആരംഭിക്കുന്ന നറുക്കെടുപ്പ് 4:00 മുതൽ 4:30 ഓടെ പൂർത്തിയാകുകയും ഔദ്യോഗിക ഗസറ്റ് ലിസ്റ്റ് പുറത്തിറങ്ങുകയും ചെയ്യും.",
    },
  },
  {
    id: "Q086",
    category: "SCHEDULE_VENUE",
    questionEn: "Who supervises the lottery draw?",
    questionMl: "നറുക്കെടുപ്പ് നിയന്ത്രിക്കുന്നത് ആരാണ്?",
    patterns: [
      "who supervises draw",
      "judges panel",
      "draw supervision",
      "ആരാണ് നറുക്കെടുപ്പ് നിയന്ത്രിക്കുന്നത്",
    ],
    intent: "SCHEDULE_VENUE",
    directAnswer: {
      en: "The draw is overseen by a panel of government-appointed judges, including retired judges and senior administrative officers.",
      ml: "റിട്ടയേർഡ് ജഡ്ജിമാരും മുതിർന്ന ഐ.എ.എസ്/സർക്കാർ ഉദ്യോഗസ്ഥരും ഉൾപ്പെടുന്ന സ്വതന്ത്ര ജൂറി പാനലാണ് നറുക്കെടുപ്പ് പരിശോധിച്ചുറപ്പാക്കുന്നത്.",
    },
  },
  {
    id: "Q087",
    category: "SCHEDULE_VENUE",
    questionEn: "Are lottery draws conducted on public holidays?",
    questionMl: "പൊതു അവധി ദിവസങ്ങളിൽ നറുക്കെടുപ്പ് ഉണ്ടാകുമോ?",
    patterns: [
      "draw on holidays",
      "sunday draw",
      "holiday lottery",
      "അവധി ദിവസങ്ങളിൽ നറുക്കെടുപ്പ് ഉണ്ടോ",
    ],
    intent: "SCHEDULE_VENUE",
    directAnswer: {
      en: "Draws are conducted daily as scheduled, except for specific national holidays like Gandhi Jayanti (Oct 2), Independence Day, and Republic Day.",
      ml: "ഗാന്ധി ജയന്തി, സ്വാതന്ത്ര്യദിനം, റിപ്പബ്ലിക് ദിനം തുടങ്ങിയ ചില ദേശീയ അവധി ദിവസങ്ങൾ ഒഴികെ മറ്റെല്ലാ ദിവസങ്ങളിലും കൃത്യമായി നറുക്കെടുപ്പ് നടക്കുന്നു.",
    },
  },
  {
    id: "Q088",
    category: "SCHEDULE_VENUE",
    questionEn: "When are official PDF results available?",
    questionMl: "ഔദ്യോഗിക പി.ഡി.എഫ് ഫലങ്ങൾ എപ്പോൾ ലഭ്യമാകും?",
    patterns: [
      "pdf result time",
      "official pdf",
      "gazette result time",
      "പിഡിഎഫ് എപ്പോൾ വരും",
      "ഔദ്യോഗിക ഫലം എപ്പോൾ",
    ],
    intent: "SCHEDULE_VENUE",
    directAnswer: {
      en: "The verified government gazette PDF is released between 4:30 PM and 5:00 PM on draw days.",
      ml: "നറുക്കെടുപ്പ് പൂർത്തിയായ ശേഷം വൈകുന്നേരം 4:30 മുതൽ 5:00 നകം ഔദ്യോഗിക സർക്കാർ ഗസറ്റ് പി.ഡി.എഫ് ലഭ്യമാകും.",
    },
  },

  // =========================================================================
  // CATEGORY 8: CLAIMING PRIZES & REQUIRED DOCUMENTS (12 Questions)
  // =========================================================================
  {
    id: "Q089",
    category: "CLAIM_PROCEDURE",
    questionEn: "How do I claim a prize up to ₹1,00,000?",
    questionMl: "1 ലക്ഷം രൂപ വരെയുള്ള സമ്മാനം എങ്ങനെ വാങ്ങാം?",
    patterns: [
      "claim up to 1 lakh",
      "claim below 100000",
      "small prize claim",
      "1 lakh vare ulla sammanam",
      "1 ലക്ഷം രൂപ വരെയുള്ള സമ്മാനം",
      "ലോട്ടറി സമ്മാനം എങ്ങനെ വാങ്ങാം",
    ],
    intent: "CLAIM_PROCEDURE",
    directAnswer: {
      en: "Prizes up to ₹5,000 can be collected from any authorized lottery agency. Prizes from ₹5,000 to ₹1,00,000 can be claimed at any District Lottery Office (DLO).",
      ml: "₹5,000 വരെയുള്ള സമ്മാനങ്ങൾ അംഗീകൃത ലോട്ടറി ഏജൻസികളിൽ നിന്ന് നേരിട്ട് വാങ്ങാം. ₹5,000 മുതൽ ₹1,00,000 വരെയുള്ള സമ്മാനങ്ങൾ ജില്ലാ ലോട്ടറി ഓഫീസുകളിൽ (DLO) നിന്ന് മാറ്റിയെടുക്കാം.",
    },
  },
  {
    id: "Q090",
    category: "CLAIM_PROCEDURE",
    questionEn: "How do I claim a prize above ₹1,00,000?",
    questionMl: "1 ലക്ഷം രൂപയ്ക്ക് മുകളിലുള്ള വലിയ സമ്മാനങ്ങൾ എങ്ങനെ ക്ലെയിം ചെയ്യാം?",
    patterns: [
      "claim above 1 lakh",
      "big prize claim",
      "first prize claim process",
      "1 lakshathinu mukalil",
      "1 ലക്ഷത്തിന് മുകളിൽ",
      "ഒന്നാം സമ്മാനം എങ്ങനെ ക്ലെയിം ചെയ്യാം",
    ],
    intent: "CLAIM_PROCEDURE",
    directAnswer: {
      en: "Prizes above ₹1,00,000 must be submitted to the Director of State Lotteries in Thiruvananthapuram, or routed securely through a Nationalized/Scheduled Bank.",
      ml: "₹1,00,000 ന് മുകളിലുള്ള സമ്മാനങ്ങൾ തിരുവനന്തപുരത്തെ സംസ്ഥാന ഭാഗ്യക്കുറി ഡയറക്ടറേറ്റിൽ നേരിട്ടോ, അല്ലെങ്കിൽ അംഗീകൃത ദേശസാൽകൃത/ഷെഡ്യൂൾഡ് ബാങ്കുകൾ മുഖേനയോ സമർപ്പിക്കണം.",
    },
  },
  {
    id: "Q091",
    category: "CLAIM_PROCEDURE",
    questionEn: "What is the time limit to claim a lottery prize in Kerala?",
    questionMl: "ലോട്ടറി സമ്മാനം വാങ്ങാനുള്ള സമയപരിധി എത്ര ദിവസമാണ്?",
    patterns: [
      "time limit to claim",
      "how many days to claim",
      "claim deadline",
      "samaya paridhi",
      "എത്ര ദിവസത്തിനുള്ളിൽ ലോട്ടറി മാറ്റിയെടുക്കണം",
      "സമയപരിധി എത്ര ദിവസമാണ്",
    ],
    intent: "CLAIM_PROCEDURE",
    directAnswer: {
      en: "Winning tickets must be surrendered within 30 days from the date of the draw.",
      ml: "നറുക്കെടുപ്പ് തീയതി മുതൽ 30 ദിവസത്തിനുള്ളിൽ വിജയിച്ച ഒറിജിനൽ ടിക്കറ്റ് ഹാജരാക്കി സമ്മാനം ക്ലെയിം ചെയ്യേണ്ടതാണ്.",
    },
  },
  {
    id: "Q092",
    category: "CLAIM_PROCEDURE",
    questionEn: "What documents are required to claim a lottery prize?",
    questionMl: "ലോട്ടറി സമ്മാനം വാങ്ങാൻ എന്തൊക്കെ രേഖകൾ വേണം?",
    patterns: [
      "documents required",
      "id proof for lottery",
      "claim documents",
      "enthelam rekhakal venam",
      "എന്തൊക്കെ രേഖകൾ വേണം",
      "ആവശ്യമായ രേഖകൾ",
    ],
    intent: "CLAIM_PROCEDURE",
    directAnswer: {
      en: "Documents required:\n1. Original winning ticket with signature & name on reverse\n2. Two passport size photos (attested by Gazetted Officer)\n3. Self-attested PAN Card copy\n4. Valid ID & Address proof (Aadhaar, Passport, Voter ID)\n5. Claim application form with Revenue Stamp\n6. Bank passbook copy with IFSC code.",
      ml: "ആവശ്യമായ രേഖകൾ:\n1. പുറകിൽ ഒപ്പുവെച്ച ഒറിജിനൽ ടിക്കറ്റ്\n2. ഗസറ്റഡ് ഓഫീസർ സാക്ഷ്യപ്പെടുത്തിയ 2 പാസ്‌പോർട്ട് ഫോട്ടോകൾ\n3. പാൻ കാർഡ് (PAN Card) കോപ്പി\n4. ആധാർ കാർഡ് / വോട്ടർ ഐഡി / പാസ്‌പോർട്ട് കോപ്പി\n5. റവന്യൂ സ്റ്റാമ്പ് പതിച്ച ക്ലെയിം അപേക്ഷാ ഫോം\n6. ബാങ്ക് പാസ്സ്ബുക്ക് കോപ്പി (IFSC കോഡ് ഉൾപ്പെടെ).",
    },
  },
  {
    id: "Q093",
    category: "CLAIM_PROCEDURE",
    questionEn: "Can I claim the prize through a bank?",
    questionMl: "ബാങ്ക് വഴി സമ്മാനം ക്ലെയിം ചെയ്യാൻ കഴിയുമോ?",
    patterns: [
      "claim through bank",
      "bank prize collection",
      "bank vazhi claim cheyyamo",
      "ബാങ്ക് വഴി സമ്മാനം ക്ലെയിം ചെയ്യാം",
    ],
    intent: "CLAIM_PROCEDURE",
    directAnswer: {
      en: "Yes, you can surrender your winning ticket and claim documents to any nationalized or scheduled bank, and the bank will handle the verification and credit the net amount to your account.",
      ml: "തീർച്ചയായും, ദേശസാൽകൃത അല്ലെങ്കിൽ ഷെഡ്യൂൾഡ് ബാങ്കുകളിൽ ടിക്കറ്റും രേഖകളും കൈമാറിയാൽ ബാങ്ക് അത് സർക്കാരിലേക്ക് അയച്ച് തുക നിങ്ങളുടെ അക്കൗണ്ടിലേക്ക് നിക്ഷേപിച്ചുതരും.",
    },
  },
  {
    id: "Q094",
    category: "CLAIM_PROCEDURE",
    questionEn: "What happens if a winning ticket is damaged or torn?",
    questionMl: "ടിക്കറ്റ് കേടുവരികയോ കീറുകയോ ചെയ്താൽ സമ്മാനം ലഭിക്കുമോ?",
    patterns: [
      "damaged ticket",
      "torn ticket",
      "ticket keeriyaal",
      "ടിക്കറ്റ് കേടുവന്നാൽ",
      "ടിക്കറ്റ് കീറിയാൽ",
    ],
    intent: "CLAIM_PROCEDURE",
    directAnswer: {
      en: "If the barcode, ticket number, and official security watermarks are intact, the lottery directorate may verify it via forensic lab testing. Severely mutilated tickets may be rejected.",
      ml: "ബാർകോഡും നമ്പറും സുരക്ഷാ മുദ്രകളും വ്യക്തമായി കാണാമെങ്കിൽ ഫോറൻസിക് പരിശോധനയിലൂടെ സ്ഥിരീകരിച്ച് സമ്മാനം നൽകും. നമ്പർ വായിക്കാൻ കഴിയാത്തവിധം നശിച്ചാൽ സമ്മാനം നിരസിക്കപ്പെട്ടേക്കാം.",
    },
  },
  {
    id: "Q095",
    category: "CLAIM_PROCEDURE",
    questionEn: "Is PAN card mandatory to claim lottery prize?",
    questionMl: "ലോട്ടറി സമ്മാനം വാങ്ങാൻ പാൻ കാർഡ് നിർബന്ധമാണോ?",
    patterns: [
      "is pan card mandatory",
      "pan card required",
      "pan card nirmbandhamano",
      "പാൻ കാർഡ് നിർബന്ധമാണോ",
    ],
    intent: "CLAIM_PROCEDURE",
    directAnswer: {
      en: "Yes, for any prize of ₹10,000 or above, a valid PAN card is mandatory for income tax TDS deduction.",
      ml: "അതെ, ₹10,000 ന് മുകളിലുള്ള സമ്മാനങ്ങൾക്ക് ആദായനികുതി ടി.ഡി.എസ് കിഴിവ് ചെയ്യുന്നതിനായി പാൻ കാർഡ് നിർബന്ധമാണ്.",
    },
  },
  {
    id: "Q096",
    category: "CLAIM_PROCEDURE",
    questionEn: "Where are District Lottery Offices (DLO) located?",
    questionMl: "ജില്ലാ ലോട്ടറി ഓഫീസുകൾ എവിടെയൊക്കെയാണ് ഉള്ളത്?",
    patterns: [
      "where are dlo offices",
      "district lottery office",
      "dlo location",
      "ജില്ലാ ലോട്ടറി ഓഫീസ്",
    ],
    intent: "CLAIM_PROCEDURE",
    directAnswer: {
      en: "Every district headquarters across Kerala (all 14 districts) has an official District Lottery Office (DLO).",
      ml: "കേരളത്തിലെ 14 ജില്ലാ ആസ്ഥാനങ്ങളിലും അതത് ജില്ലാ ലോട്ടറി ഓഫീസുകൾ (DLO) പ്രവർത്തിക്കുന്നുണ്ട്.",
    },
  },
  {
    id: "Q097",
    category: "CLAIM_PROCEDURE",
    questionEn: "Can non-Kerala residents buy and claim Kerala lottery?",
    questionMl: "കേരളത്തിന് പുറത്തുള്ളവർക്ക് ലോട്ടറി എടുക്കാനും സമ്മാനം വാങ്ങാനും പറ്റുമോ?",
    patterns: [
      "non kerala resident",
      "other state people buy",
      "outside kerala claim",
      "പുറത്തുള്ളവർക്ക് സമ്മാനം കിട്ടുമോ",
    ],
    intent: "CLAIM_PROCEDURE",
    directAnswer: {
      en: "Yes! Any Indian citizen who physically buys a ticket within the state of Kerala can claim their prize, provided all official documentation is submitted.",
      ml: "തീർച്ചയായും! കേരളത്തിൽ വെച്ച് നേരിട്ട് ടിക്കറ്റ് വാങ്ങുന്ന ഏതൊരു ഇന്ത്യൻ പൗരനും നിയമാനുസൃത രേഖകൾ ഹാജരാക്കി സമ്മാനം വാങ്ങാവുന്നതാണ്.",
    },
  },
  {
    id: "Q098",
    category: "CLAIM_PROCEDURE",
    questionEn: "Is online Kerala lottery legal?",
    questionMl: "കേരള ലോട്ടറി ഓൺലൈനായി വിൽക്കുന്നത് നിയമപരമാണോ?",
    patterns: [
      "online lottery legal",
      "online purchase",
      "can i buy online",
      "ഓൺലൈൻ ലോട്ടറി നിയമപരമാണോ",
      "ഓൺലൈനായി വാങ്ങാമോ",
    ],
    intent: "CLAIM_PROCEDURE",
    directAnswer: {
      en: "No! Online sale of Kerala Lottery is illegal. Kerala State Lottery Department sells paper tickets only through registered physical retail agents.",
      ml: "അല്ല! കേരള ഭാഗ്യക്കുറിയുടെ ഓൺലൈൻ വിൽപ്പന കർശനമായി നിരോധിച്ചിട്ടുള്ളതും നിയമവിരുദ്ധവുമാണ്. പേപ്പർ ടിക്കറ്റുകൾ മാത്രമേ വിൽക്കാൻ അനുമതിയുള്ളൂ.",
    },
  },
  {
    id: "Q099",
    category: "CLAIM_PROCEDURE",
    questionEn: "What if I lose my winning ticket?",
    questionMl: "ലോട്ടറി ടിക്കറ്റ് നഷ്ടപ്പെട്ടാൽ എന്ത് ചെയ്യണം?",
    patterns: [
      "lost ticket",
      "ticket nashtappettal",
      "ടിക്കറ്റ് നഷ്ടപ്പെട്ടാൽ",
    ],
    intent: "CLAIM_PROCEDURE",
    directAnswer: {
      en: "A physical lottery ticket is a bearer instrument. Without the original physical ticket, prizes cannot be claimed under Kerala Lottery rules.",
      ml: "ഭാഗ്യക്കുറി ടിക്കറ്റ് ഒരു 'Bearer Document' ആണ്. ഒറിജിനൽ ടിക്കറ്റ് കൈവശമില്ലാതെ സമ്മാനം ക്ലെയിം ചെയ്യാൻ നിയമപരമായി സാധിക്കില്ല.",
    },
  },
  {
    id: "Q100",
    category: "CLAIM_PROCEDURE",
    questionEn: "Can minors claim lottery prize?",
    questionMl: "പ്രായപൂർത്തിയാകാത്തവർക്ക് ലോട്ടറി സമ്മാനം ക്ലെയിം ചെയ്യാമോ?",
    patterns: [
      "minor claim",
      "below 18 years",
      "kuttikalkk claim cheyyamo",
      "കുട്ടികൾക്ക് സമ്മാനം കിട്ടുമോ",
    ],
    intent: "CLAIM_PROCEDURE",
    directAnswer: {
      en: "Yes, but the prize must be claimed through a legal guardian, and joint bank accounts with guardianship documentation are required.",
      ml: "സാധിക്കും, എന്നാൽ രക്ഷിതാവ് മുഖേന മാത്രമേ ക്ലെയിം ചെയ്യാനാകൂ. രക്ഷിതാവിന്റെയും കുട്ടിയുടെയും പേരിലുള്ള ജോയിന്റ് അക്കൗണ്ട് വിവരങ്ങൾ ആവശ്യമാണ്.",
    },
  },

  // =========================================================================
  // CATEGORY 9: TAX, TDS & NET PRIZE CALCULATION (8 Questions)
  // =========================================================================
  {
    id: "Q101",
    category: "TAX_COMMISSION",
    questionEn: "What is the tax rate on Kerala lottery winnings?",
    questionMl: "കേരള ലോട്ടറി സമ്മാനങ്ങൾക്ക് എത്ര ശതമാനം നികുതിയുണ്ട്?",
    patterns: [
      "tax on lottery",
      "tds rate",
      "how much tax",
      "tax ethra",
      "ലോട്ടറി നികുതി എത്രയാണ്",
      "ടാക്സ് എത്ര ശതമാനം",
    ],
    intent: "TAX_COMMISSION",
    directAnswer: {
      en: "For prizes above ₹10,000, flat 30% TDS is deducted under Section 194B of the Income Tax Act, plus applicable surcharge and cess for large bumper amounts.",
      ml: "₹10,000 രൂപയ്ക്ക് മുകളിലുള്ള സമ്മാനങ്ങൾക്ക് ആദായനികുതി വകുപ്പിന്റെ സെക്ഷൻ 194B പ്രകാരം 30% ടി.ഡി.എസ് (TDS) കിഴിവ് ചെയ്യപ്പെടും.",
    },
  },
  {
    id: "Q102",
    category: "TAX_COMMISSION",
    questionEn: "How much is the lottery agent commission?",
    questionMl: "ലോട്ടറി ഏജന്റ് കമ്മീഷൻ എത്ര ശതമാനമാണ്?",
    patterns: [
      "agent commission",
      "how much agent commission",
      "agentinte commission",
      "ഏജന്റ് കമ്മീഷൻ എത്രയാണ്",
    ],
    intent: "TAX_COMMISSION",
    directAnswer: {
      en: "Agent commission is 10% of the gross prize amount, which is paid directly by the government to the selling agent.",
      ml: "ടിക്കറ്റ് വിറ്റ ഏജന്റിന് സമ്മാനത്തുകയുടെ 10% ഏജന്റ് കമ്മീഷനായി സർക്കാർ നേരിട്ട് നൽകുന്നു.",
    },
  },
  {
    id: "Q103",
    category: "TAX_COMMISSION",
    questionEn: "How much in-hand money does a 1 Crore prize winner get?",
    questionMl: "1 കോടി രൂപ സമ്മാനം അടിച്ചാൽ കയ്യിൽ എത്ര രൂപ കിട്ടും?",
    patterns: [
      "1 crore in hand",
      "one crore tax deduction",
      "1 kodi adichal ethra kittum",
      "1 കോടി അടിച്ചാൽ എത്ര കിട്ടും",
    ],
    intent: "TAX_COMMISSION",
    directAnswer: {
      en: "On ₹1 Crore prize:\n• Gross Prize: ₹1,00,00,000\n• Agent Commission (10%): ₹10,00,000\n• TDS Tax (30% on remaining ₹90L): ₹27,00,000\n• Net In-Hand: ₹63,00,000 (₹63 Lakhs).",
      ml: "₹1 കോടി സമ്മാനത്തിന്:\n• ആകെ തുക: ₹1,00,00,000\n• ഏജന്റ് കമ്മീഷൻ (10%): ₹10,00,000\n• നികുതി (30% TDS ബാക്കി ₹90 ലക്ഷത്തിന്): ₹27,00,000\n• കയ്യിൽ ലഭിക്കുന്നത്: ₹63,00,000 (₹63 ലക്ഷം രൂപ).",
    },
  },
  {
    id: "Q104",
    category: "TAX_COMMISSION",
    questionEn: "How much in-hand money does a 25 Crore Onam Bumper winner get?",
    questionMl: "25 കോടി ഓണം ബമ്പർ അടിച്ചാൽ കയ്യിൽ എത്ര കിട്ടും?",
    patterns: [
      "25 crore in hand",
      "onam bumper in hand money",
      "25 crore tax",
      "25 kodi adichal ethra kittum",
      "25 കോടി അടിച്ചാൽ കയ്യിൽ എത്ര കിട്ടും",
    ],
    intent: "TAX_COMMISSION",
    directAnswer: {
      en: "On ₹25 Crores Onam Bumper:\n• Gross Prize: ₹25,00,00,000\n• Agent Commission (10%): ₹2.50 Crores\n• Net prize before tax: ₹22.50 Crores\n• TDS Tax + Surcharge (approx 35.88%): approx ₹8.07 Crores\n• Net In-Hand: approx ₹14.43 Crores.",
      ml: "₹25 കോടി ഓണം ബമ്പറിന്:\n• ആകെ തുക: ₹25 കോടി\n• ഏജന്റ് കമ്മീഷൻ (10%): ₹2.50 കോടി\n• നികുതി + സർചാർജ്ജ് (ഏകദേശം 35.88%): ₹8.07 കോടി\n• കയ്യിൽ ലഭിക്കുന്നത്: ഏകദേശം ₹14.43 കോടി രൂപ.",
    },
  },
  {
    id: "Q105",
    category: "TAX_COMMISSION",
    questionEn: "Is tax deducted on prizes below ₹10,000?",
    questionMl: "10,000 രൂപയിൽ താഴെയുള്ള സമ്മാനങ്ങൾക്ക് നികുതിയുണ്ടോ?",
    patterns: [
      "tax below 10000",
      "is tax deducted on 5000",
      "10000 താഴെയുള്ള സമ്മാനത്തിന് നികുതിയുണ്ടോ",
    ],
    intent: "TAX_COMMISSION",
    directAnswer: {
      en: "No! Prizes up to ₹10,000 are completely exempt from TDS deduction at source.",
      ml: "ഇല്ല! ₹10,000 വരെയുള്ള സമ്മാനങ്ങൾക്ക് സ്രോതസ്സിൽ നിന്ന് നികുതി (TDS) പിടിക്കില്ല. മുഴുവൻ തുകയും മാറ്റിയെടുക്കാം.",
    },
  },
  {
    id: "Q106",
    category: "TAX_COMMISSION",
    questionEn: "Do I get a TDS certificate after prize deduction?",
    questionMl: "നികുതി കിഴിവിന് ശേഷം ടി.ഡി.എസ് സർട്ടിഫിക്കറ്റ് ലഭിക്കുമോ?",
    patterns: [
      "tds certificate",
      "form 16a lottery",
      "ടിഡിഎസ് സർട്ടിഫിക്കറ്റ് ലഭിക്കുമോ",
    ],
    intent: "TAX_COMMISSION",
    directAnswer: {
      en: "Yes, the Lottery Directorate or the paying bank issues Form 16A confirming the exact tax deducted and deposited with the Income Tax Department.",
      ml: "അതെ, കിഴിച്ച നികുതിയുടെ തെളിവായി ഭാഗ്യക്കുറി വകുപ്പിൽ നിന്നോ ബാങ്കിൽ നിന്നോ 'Form 16A' ടി.ഡി.എസ് സർട്ടിഫിക്കറ്റ് ലഭിക്കും.",
    },
  },
  {
    id: "Q107",
    category: "TAX_COMMISSION",
    questionEn: "Does the winner have to pay the agent commission from prize money?",
    questionMl: "ഏജന്റ് കമ്മീഷൻ വിജയിയുടെ കയ്യിൽ നിന്നാണോ നൽകുന്നത്?",
    patterns: [
      "winner pay agent commission",
      "agent commission deducted from prize",
      "ഏജന്റ് കമ്മീഷൻ ആരാണ് നൽകുന്നത്",
    ],
    intent: "TAX_COMMISSION",
    directAnswer: {
      en: "The government pays the 10% agent commission directly as structured in the official prize allocation rules.",
      ml: "സർക്കാർ നേരിട്ടാണ് 10% ഏജന്റ് കമ്മീഷൻ നൽകുന്നത്. സമ്മാന ഘടനയനുസരിച്ച് തുക ക്രമീകരിച്ചാണ് വിജയിക്ക് നൽകുന്നത്.",
    },
  },
  {
    id: "Q108",
    category: "TAX_COMMISSION",
    questionEn: "How much in-hand money does an 80 Lakhs prize winner get?",
    questionMl: "80 ലക്ഷം രൂപ അടിച്ചാൽ എത്ര രൂപ കയ്യിൽ കിട്ടും?",
    patterns: [
      "80 lakh in hand",
      "80 lakh tax",
      "80 laksham adichal ethra",
      "80 ലക്ഷം അടിച്ചാൽ എത്ര കിട്ടും",
    ],
    intent: "TAX_COMMISSION",
    directAnswer: {
      en: "On an ₹80 Lakhs prize (Karunya / Karunya Plus):\n• Agent Commission (10%): ₹8 Lakhs\n• Tax on remaining ₹72 Lakhs (30%): ₹21.60 Lakhs\n• Net In-Hand: ₹50.40 Lakhs.",
      ml: "₹80 ലക്ഷം രൂപ സമ്മാനത്തിന് (കാരുണ്യ / കാരുണ്യ പ്ലസ്):\n• ഏജന്റ് കമ്മീഷൻ (10%): ₹8 ലക്ഷം\n• നികുതി (30% TDS): ₹21.60 ലക്ഷം\n• കയ്യിൽ ലഭിക്കുന്നത്: ₹50.40 ലക്ഷം രൂപ.",
    },
  },

  // =========================================================================
  // CATEGORY 10: APP FEATURES & GENERAL ASSISTANCE (7 Questions)
  // =========================================================================
  {
    id: "Q109",
    category: "APP_FEATURES",
    questionEn: "How do I scan the barcode on my lottery ticket?",
    questionMl: "ലോട്ടറി ടിക്കറ്റിലെ ബാർകോഡ് എങ്ങനെ സ്കാൻ ചെയ്യാം?",
    patterns: [
      "how to scan barcode",
      "scan ticket",
      "barcode scanner",
      "scanner engane upayogikkam",
      "ബാർകോഡ് സ്കാൻ ചെയ്യുന്നത് എങ്ങനെ",
      "ടിക്കറ്റ് സ്കാൻ ചെയ്യുക",
    ],
    intent: "APP_HELP",
    directAnswer: {
      en: "Tap the floating Camera/Scan button at the center of the bottom navigation bar. Point your camera at the barcode on the lottery ticket for instant verification.",
      ml: "താഴെയുള്ള മെനുവിലെ നടുവിലുള്ള 'Scan' ക്യാമറ ബട്ടൺ അമർത്തുക. ടിക്കറ്റിലെ ബാർകോഡിന് നേരെ ക്യാമറ പിടിച്ചാൽ നിമിഷങ്ങൾക്കകം ഫലം കാണാം.",
    },
  },
  {
    id: "Q110",
    category: "APP_FEATURES",
    questionEn: "How do I set draw reminders?",
    questionMl: "ലോട്ടറി നറുക്കെടുപ്പ് റിമൈൻഡറുകൾ എങ്ങനെ സെറ്റ് ചെയ്യാം?",
    patterns: [
      "set reminder",
      "draw notification",
      "reminder engane set cheyyam",
      "റിമൈൻഡർ സെറ്റ് ചെയ്യുക",
      "നോട്ടിഫിക്കേഷൻ",
    ],
    intent: "APP_HELP",
    directAnswer: {
      en: "Open the Reminders screen from the menu, select your preferred lottery draws, and you will receive notifications before the draw begins at 3:00 PM.",
      ml: "മെനുവിലെ 'Reminders' തിരഞ്ഞെടുത്ത് നിങ്ങൾക്ക് ആവശ്യമുള്ള ലോട്ടറികൾ ഓൺ ചെയ്തുവെക്കുക. ഉച്ചയ്ക്ക് 3:00 മണിക്ക് മുൻപായി ഫോണിൽ നോട്ടിഫിക്കേഷൻ ലഭിക്കും.",
    },
  },
  {
    id: "Q111",
    category: "APP_FEATURES",
    questionEn: "How can I change the app language between Malayalam and English?",
    questionMl: "ആപ്പിലെ ഭാഷ മലയാളത്തിലേക്കോ ഇംഗ്ലീഷിലേക്കോ എങ്ങനെ മാറ്റാം?",
    patterns: [
      "change language",
      "switch language",
      "bhasha engane maattam",
      "ഭാഷ മാറ്റുന്നത് എങ്ങനെ",
    ],
    intent: "APP_HELP",
    directAnswer: {
      en: "Tap the Settings icon at the top right of the AI screen and choose between Malayalam and English, or simply ask me 'Switch to English' or 'മലയാളത്തിൽ സംസാരിക്കൂ'.",
      ml: "മുകളിൽ വലതുവശത്തുള്ള ക്രമീകരണ (Settings) ഐക്കൺ അമർത്തി മലയാളമോ ഇംഗ്ലീഷോ തിരഞ്ഞെടുക്കാം. അല്ലെങ്കിൽ 'Switch to Malayalam' എന്ന് നേരിട്ട് പറഞ്ഞാലും മതിയാകും.",
    },
  },
  {
    id: "Q112",
    category: "APP_FEATURES",
    questionEn: "How do I view lottery analytics and number patterns?",
    questionMl: "ലോട്ടറി അനലിറ്റിക്സും സ്ഥിരം നമ്പറുകളും എങ്ങനെ കാണാം?",
    patterns: [
      "analytics",
      "number pattern",
      "hot numbers",
      "statistics",
      "അനലിറ്റിക്സ്",
      "സ്റ്റാറ്റിസ്റ്റിക്സ്",
    ],
    intent: "APP_HELP",
    directAnswer: {
      en: "Tap the 'Statistics' tab in the main bottom navigation to view frequent winning digits, patterns, and historical probability charts.",
      ml: "താഴത്തെ മെനുവിലെ 'Statistics' ടാബിൽ അമർത്തിയാൽ സ്ഥിരമായി വരുന്ന നമ്പറുകൾ, ചാർട്ടുകൾ, ഫലങ്ങളുടെ അനലിറ്റിക്സ് എന്നിവ വിശദമായി കാണാം.",
    },
  },
  {
    id: "Q113",
    category: "APP_FEATURES",
    questionEn: "Does this app work offline?",
    questionMl: "ഇന്റർനെറ്റ് ഇല്ലാതെ ഈ ആപ്പ് പ്രവർത്തിക്കുമോ?",
    patterns: [
      "work offline",
      "offline mode",
      "internet illathe",
      "ഓഫ്‌ലൈൻ ആയി പ്രവർത്തിക്കുമോ",
    ],
    intent: "APP_HELP",
    directAnswer: {
      en: "Yes! Recent draw results and 100+ lottery guide questions are stored locally and accessible offline.",
      ml: "അതെ! കഴിഞ്ഞ ദിവസങ്ങളിലെ ഫലങ്ങളും 100+ ലോട്ടറി ചോദ്യങ്ങളും ഇന്റർനെറ്റ് ഇല്ലാതെയും ഓഫ്‌ലൈനായി പരിശോധിക്കാൻ സാധിക്കും.",
    },
  },
  {
    id: "Q114",
    category: "APP_FEATURES",
    questionEn: "Who develops and maintains this application?",
    questionMl: "ഈ ആപ്ലിക്കേഷൻ ആരാണ് വികസിപ്പിച്ചത്?",
    patterns: [
      "who developed this app",
      "developer info",
      "about app",
      "ആരാണ് വികസിപ്പിച്ചത്",
      "ആപ്പിനെക്കുറിച്ച്",
    ],
    intent: "APP_HELP",
    directAnswer: {
      en: "This application is developed as an AI-powered smart assistant for Kerala lottery enthusiasts, powered by Google Gemini AI and official verified draw datasets.",
      ml: "കേരള ഭാഗ്യക്കുറി പ്രേമികൾക്കായി ആധുനിക AI സാങ്കേതികവിദ്യയും ഔദ്യോഗിക ഗസറ്റ് വിവരങ്ങളും സംയോജിപ്പിച്ച് നിർമ്മിച്ച സ്മാർട്ട് AI അസിസ്റ്റന്റ് ആപ്പാണിത്.",
    },
  },
  {
    id: "Q115",
    category: "APP_FEATURES",
    questionEn: "What should I do if the microphone is not working?",
    questionMl: "മൈക്രോഫോൺ പ്രവർത്തിക്കുന്നില്ലെങ്കിൽ എന്ത് ചെയ്യണം?",
    patterns: [
      "mic not working",
      "microphone error",
      "mic issue",
      "മൈക്ക് പ്രവർത്തിക്കുന്നില്ല",
      "ശബ്ദം കേൾക്കുന്നില്ല",
    ],
    intent: "APP_HELP",
    directAnswer: {
      en: "Please ensure microphone permission is granted in your device settings. Alternatively, you can type your question directly in the text input box below.",
      ml: "ഫോണിന്റെ സെറ്റിങ്സിൽ പോയി മൈക്രോഫോൺ അനുമതി (Microphone Permission) നൽകിയിട്ടുണ്ടോ എന്ന് പരിശോധിക്കുക. അല്ലെങ്കിൽ താഴെയുള്ള ബോക്സിൽ ചോദ്യങ്ങൾ ടൈപ്പ് ചെയ്തും ചോദിക്കാം.",
    },
  },
];

/**
 * Fast search and resolution engine for the 100+ Kerala Lottery questions.
 * Sub-1ms execution time. Completely eliminates Gemini network call if matched!
 */
export function matchOfflineQuestion(
  rawQuery: string
): { item: LotteryFaqItem; confidence: number } | null {
  const q = rawQuery.trim().toLowerCase().replace(/[?!.,;:_]/g, " ");
  if (!q) return null;

  // 1. Direct Pattern Match (Exact or substring)
  for (const item of KERALA_LOTTERY_100_QUESTIONS) {
    for (const pattern of item.patterns) {
      const p = pattern.toLowerCase();
      if (q === p || q.includes(p)) {
        return { item, confidence: 1.0 };
      }
    }
  }

  // 2. Token overlap score
  const queryTokens = q.split(/\s+/).filter((t) => t.length > 2);
  let bestMatch: { item: LotteryFaqItem; score: number } | null = null;

  for (const item of KERALA_LOTTERY_100_QUESTIONS) {
    for (const pattern of item.patterns) {
      const pTokens = pattern.toLowerCase().split(/\s+/).filter((t) => t.length > 2);
      if (pTokens.length === 0) continue;

      let matchedTokens = 0;
      for (const token of pTokens) {
        if (queryTokens.includes(token)) {
          matchedTokens++;
        }
      }

      const score = matchedTokens / pTokens.length;
      if (score >= 0.75 && (!bestMatch || score > bestMatch.score)) {
        bestMatch = { item, score };
      }
    }
  }

  if (bestMatch && bestMatch.score >= 0.75) {
    return { item: bestMatch.item, confidence: parseFloat(bestMatch.score.toFixed(2)) };
  }

  return null;
}
