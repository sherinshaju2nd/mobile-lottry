export type Language = "en" | "ml";

export const translations = {
  en: {
    // Language Selection Screen
    select_language_title: "Select Language",
    select_language_subTitle: "ഭാഷ തിരഞ്ഞെടുക്കുക",
    select_language_desc:
      "Choose your preferred language for Kerala Lottery results and checking.",
    english: "English",
    malayalam: "മലയാളം (Malayalam)",
    continue: "Continue / തുടരുക",

    // Navigation Tabs
    tab_home: "Home",
    tab_lotteries: "Lotteries",
    tab_scan: "Scan",
    tab_checker: "Checker",
    tab_archives: "Archives",
    tab_date: "Date",

    // Home Screen
    app_header_title: "Kerala Lottery Results",
    app_header_subtitle: "Live Draw Updates & Ticket Verifier",
    latest_draws: "Latest Lottery Results",
    today_draw: "Today's Draw",
    yesterday_result: "Yesterday's Result",
    next_draw: "Next Scheduled Draw",
    first_prize: "1st Prize",
    draw_code: "Draw Code",
    draw_date: "Draw Date",
    view_breakdown: "View Full Results →",
    quick_check_title: "Quick Ticket Checker",
    quick_check_desc:
      "Enter your ticket number to check winning status instantly across all lotteries.",
    enter_ticket_placeholder: "e.g. BT 263322 or 3322",
    check_now: "Check Now",
    scan_barcode: "Scan Barcode",
    scanner_active_soon: "Scanner Active Soon",
    weekly_schedule: "Weekly Lottery Schedule",
    weekly_schedule_sub: "weekly draw timings & series details",
    monday: "Monday",
    tuesday: "Tuesday",
    wednesday: "Wednesday",
    thursday: "Thursday",
    friday: "Friday",
    saturday: "Saturday",
    sunday: "Sunday",
    latest_draw_badge: "LATEST DRAW",
    location: "Location",
    agent: "Agent",
    complete_prize_breakdown: "Complete Prize Breakdown",
    consolation_prize: "Consolation Prize",
    results_not_yet_published: "Today's Draw Results Not Yet Published",
    results_pending_desc:
      "Draw results for today will be published live at 2:55 PM - 3:00 PM IST.",

    // Lotteries Screen
    lotteries_title: "Kerala Weekly Lotteries",
    lotteries_subtitle: "Browse all 7 weekly  state lotteries",
    ticket_price: "Ticket Price",
    view_archive: "View Draw Archive",

    // Checker / Search Screen
    checker_title: "Ticket Result Checker",
    checker_subtitle:
      "Verify single tickets or batch bundles against Kerala state lottery results.",
    single_search: "Single Ticket Search",
    batch_search: "Bundle / Batch Search",
    ticket_number: "Ticket Number",
    draw_date_filter: "Draw Date Filter (Optional)",
    all_draws: "All Draws (Full DB)",
    pick_date: "Pick Date",
    check_ticket_btn: "Check Winning Ticket",
    check_batch_btn: "Check All Bundle Tickets",
    paste_multiple_placeholder:
      "Enter tickets separated by newlines e.g.:\nBT 263322\nSS 192842\n3322",
    search_results_for: "Search Results for",
    no_prize_found: "No Prize Match Found",
    no_prize_desc: "did not match any published winning prize tiers.",

    // Archives Screen
    archives_title: "Lottery Results Archive",
    archives_subtitle: "Historical draw records & winning numbers database",
    search_draws_placeholder: "Search by lottery name, code (e.g. WIN-WIN)...",
    filter_by_lottery: "Filter by Lottery",
    all_lotteries: "All Lotteries",

    // Draw Breakdown Screen
    breakdown_title: "Draw Breakdown",
    breakdown_subtitle: "Complete prize tiers & winning numbers",
    winning_numbers: "Winning Ticket Numbers",
    prize_tier: "Prize Tier",

    // Barcode Scanner & Result
    scan_ticket_title: "Scan Lottery Barcode",
    align_barcode: "Align ticket barcode inside frame",
    select_draw_date: "Select Draw Date",
    scanned_ticket: "Scanned Ticket",

    // General & Header
    change_language: "Language / ഭാഷ",
    loading: "Loading...",
    reset: "Reset",
    close: "Close",
    cancel: "Cancel",
  },
  ml: {
    // Language Selection Screen
    select_language_title: "ഭാഷ തിരഞ്ഞെടുക്കുക",
    select_language_subTitle: "Select Language",
    select_language_desc:
      "കേരള ലോട്ടറി ഫലങ്ങൾക്കും പരിശോധനയ്ക്കുമായി നിങ്ങളുടെ ഭാഷ തിരഞ്ഞെടുക്കുക.",
    english: "English (ഇംഗ്ലീഷ്)",
    malayalam: "മലയാളം",
    continue: "തുടരുക / Continue",

    // Navigation Tabs
    tab_home: "ഹോം",
    tab_lotteries: "ലോട്ടറികൾ",
    tab_scan: "സ്‌കാൻ",
    tab_checker: "ചെക്കർ",
    tab_archives: "ആർക്കൈവുകൾ",
    tab_date: "തീയതി",

    // Home Screen
    app_header_title: "കേരള ലോട്ടറി ഫലങ്ങൾ",
    app_header_subtitle: "തത്സമയ ഫലങ്ങളും ടിക്കറ്റ് പരിശോധനയും",
    latest_draws: "ഏറ്റവും പുതിയ ലോട്ടറി ഫലങ്ങൾ",
    today_draw: "ഇന്നത്തെ നറുക്കെടുപ്പ്",
    yesterday_result: "ഇന്നലത്തെ ഫലം",
    next_draw: "അടുത്ത നറുക്കെടുപ്പ്",
    first_prize: "ഒന്നാം സമ്മാനം",
    draw_code: "ഡ്രോ കോഡ്",
    draw_date: "നറുക്കെടുപ്പ് തീയതി",
    view_breakdown: "സമ്പൂർണ്ണ ഫലം കാണുക →",
    quick_check_title: "ദ്രുത ടിക്കറ്റ് പരിശോധന",
    quick_check_desc:
      "സമ്മാനം ലഭിച്ചിട്ടുണ്ടോ എന്ന് ഉടൻ പരിശോധിക്കാൻ ടിക്കറ്റ് നമ്പർ നൽകുക.",
    enter_ticket_placeholder: "ഉദാ: BT 263322 അല്ലെങ്കിൽ 3322",
    check_now: "പരിശോധിക്കുക",
    scan_barcode: "ബാർകോഡ് സ്‌കാൻ ചെയ്യുക",
    scanner_active_soon: "സ്‌കാനർ ഉടൻ ലഭ്യമാകും",
    weekly_schedule: "വാരാദ്ധ്യ ലോട്ടറി സമയം",
    weekly_schedule_sub: "ആഴ്ചയിലെ നറുക്കെടുപ്പ് വിവരങ്ങൾ",
    monday: "തിങ്കൾ",
    tuesday: "ചൊവ്വ",
    wednesday: "ബുധൻ",
    thursday: "വ്യാഴം",
    friday: "വെള്ളി",
    saturday: "ശനി",
    sunday: "ഞായർ",
    latest_draw_badge: "ഏറ്റവും പുതിയ നറുക്കെടുപ്പ്",
    location: "സ്ഥലം",
    agent: "ഏജന്റ്",
    complete_prize_breakdown: "സമ്പൂർണ്ണ സമ്മാന വിവരങ്ങൾ",
    consolation_prize: "സമാശ്വാസ സമ്മാനം",
    results_not_yet_published:
      "ഇന്നത്തെ നറുക്കെടുപ്പ് ഫലം പ്രസിദ്ധീകരിച്ചിട്ടില്ല",
    results_pending_desc:
      "ഇന്നത്തെ നറുക്കെടുപ്പ് ഫലം ഉച്ചയ്ക്ക് 2:55 - 3:00 മണിക്ക് തത്സമയം പ്രസിദ്ധീകരിക്കും.",

    // Lotteries Screen
    lotteries_title: "കേരള ലോട്ടറി പരമ്പരകൾ",
    lotteries_subtitle: "ആഴ്ചയിലെ 7 സംസ്ഥാന ലോട്ടറികൾ കാണുക",
    ticket_price: "ടിക്കറ്റ് വില",
    view_archive: "പഴയ ഫലങ്ങൾ കാണുക",

    // Checker / Search Screen
    checker_title: "ടിക്കറ്റ് ഫല പരിശോധന",
    checker_subtitle: "കേരള ലോട്ടറി ഫലങ്ങളുമായി ടിക്കറ്റുകൾ പരിശോധിക്കുക.",
    single_search: "സിംഗിൾ ടിക്കറ്റ്",
    batch_search: "ബാച്ച് / ബണ്ടിൽ",
    ticket_number: "ടിക്കറ്റ് നമ്പർ",
    draw_date_filter: "നറുക്കെടുപ്പ് തീയതി (ഓപ്ഷണൽ)",
    all_draws: "എല്ലാ ഫലങ്ങളും (Full DB)",
    pick_date: "തീയതി തിരഞ്ഞെടുക്കുക",
    check_ticket_btn: "പരിശോധിക്കുക",
    check_batch_btn: "എല്ലാ ടിക്കറ്റുകളും പരിശോധിക്കുക",
    paste_multiple_placeholder:
      "ഓരോ വരിയിലും ഓരോ ടിക്കറ്റ് നമ്പർ നൽകുക ഉദാ:\nBT 263322\nSS 192842\n3322",
    search_results_for: "തിരച്ചിൽ ഫലം:",
    no_prize_found: "സമ്മാനം ലഭിച്ചിട്ടില്ല",
    no_prize_desc:
      "നൽകിയ ടിക്കറ്റിന് സമ്മാനാർഹമായ മാച്ച് ഒന്നും ലഭിച്ചിട്ടില്ല.",

    // Archives Screen
    archives_title: "പഴയ ഫലങ്ങളുടെ ആർക്കൈവ്",
    archives_subtitle: "മുൻകാല നറുക്കെടുപ്പ് ഫലങ്ങളുടെ ഡാറ്റാബേസ്",
    search_draws_placeholder: "ലോട്ടറി പേരോ കോഡോ നൽകി തിരയുക (ഉദാ: WIN-WIN)...",
    filter_by_lottery: "ലോട്ടറി തിരഞ്ഞെടുക്കുക",
    all_lotteries: "എല്ലാ ലോട്ടറികളും",

    // Draw Breakdown Screen
    breakdown_title: "ഡ്രോ വിവരങ്ങൾ",
    breakdown_subtitle: "സമ്മാന ഘടനയും വിജയിച്ച ടിക്കറ്റുകളും",
    winning_numbers: "വിജയിച്ച ടിക്കറ്റ് നമ്പറുകൾ",
    prize_tier: "സമ്മാന തുക",

    // Barcode Scanner & Result
    scan_ticket_title: "ലോട്ടറി ബാർകോഡ് സ്‌കാൻ ചെയ്യുക",
    align_barcode: "ടിക്കറ്റ് ബാർകോഡ് ചട്ടക്കൂടിനുള്ളിൽ വെക്കുക",
    select_draw_date: "നറുക്കെടുപ്പ് തീയതി തിരഞ്ഞെടുക്കുക",
    scanned_ticket: "സ്‌കാൻ ചെയ്ത ടിക്കറ്റ്",

    // General & Header
    change_language: "ഭാഷ / Language",
    loading: "ലഭ്യമാക്കുന്നു...",
    reset: "റീസെറ്റ്",
    close: "അടയ്ക്കുക",
    cancel: "റദ്ദാക്കുക",
  },
};
