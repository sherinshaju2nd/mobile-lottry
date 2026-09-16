import fs from 'fs';
import path from 'path';

interface TranslationRow {
  languageCode: string;
  title: string;
  shortDescription: string;
  fullDescription: string;
}

const translations: TranslationRow[] = [
  {
    languageCode: 'en-US',
    title: 'Kerala Lottery Results Today',
    shortDescription: 'Live 3 PM Kerala lottery results, barcode ticket scanner, AI analytics & PDF.',
    fullDescription: `Get accurate, fast, and live Kerala Lottery draw results right on your phone! Kerala Lottery Results Today is your trusted utility for live 3 PM draw updates, lottery ticket barcode scanning, AI lottery analytics, district winning heatmaps, and official Kerala Lottery PDF gazette downloads.

Whether checking weekly Kerala Lottery draws or bumper lotteries, never miss a winning lottery number!

🔥 KEY KERALA LOTTERY FEATURES:

⚡ Live 3:00 PM Kerala Lottery Results:
• Real-time Kerala Lottery live updates starting daily at 3:00 PM IST with live countdown timers.
• Full prize breakdown: 1st Prize down to 8th Prize and Consolation lottery prize tiers.
• Fast offline caching to view today's Kerala Lottery result smoothly.

📷 Smart Lottery Barcode Scanner:
• Instantly scan the barcode on your Kerala Lottery ticket using your phone camera.
• Quick number matching verifies your lottery ticket against official prize lists.

🤖 AI Lottery Analytics & Trends:
• Explore Kerala Lottery historical number statistics, hot/cold digit trends, and repeat patterns.
• Smart AI analytics to review winning lottery frequencies.

🗺️ District Jackpot Heatmaps:
• See which Kerala districts have won the most Kerala Lottery jackpots and top prizes.
• Track lottery agency and district winning performance.

🎙️ AI Lottery Voice Assistant:
• Ask lottery questions hands-free in Malayalam (മലയാളം) or English.
• Get instant voice answers for today's Kerala Lottery results and schedules.

📤 1-Tap WhatsApp Result Sharing:
• Share official Kerala Lottery result summaries directly to WhatsApp Status and chats with clean result cards.

⏰ Smart Lottery Draw Reminders:
• Get prompt alerts when the 3:00 PM Kerala Lottery draw begins and when final gazettes are released.
• Alerts for Bumper Lottery ticket sales and draw dates.

🔎 Fast Lottery Number Search:
• Search 4-digit, 5-digit, or 6-digit numbers across current and archived Kerala Lottery results.

📅 Weekly & Bumper Lottery Schedule:
• Weekly: Win-Win, Sthree Sakthi, Fifty-Fifty, Karunya Plus, Nirmal, Karunya, and Akshaya.
• Bumpers: Onam Bumper, Vishu Bumper, Pooja, Xmas-New Year, Monsoon, and Summer Bumper.

📜 Official Kerala Lottery PDF Gazette:
• Download and view authentic Kerala Government Gazette PDF lottery result sheets.

💰 Prize Claim Guide & Tax Calculator:
• Step-by-step guidance on how to claim Kerala Lottery prizes with a built-in TDS tax calculator.

🌐 Dual Language: English & മലയാളം (Malayalam).

⚠️ DISCLAIMER & POLICY NOTICE:
• Informational Utility Only: This app is an independent informational reference for lottery ticket holders and is NOT an official app of the Kerala State Lottery Department or Government of Kerala.
• No Gambling / No Ticket Sales: This app DOES NOT sell lottery tickets, does not facilitate real-money gambling, and does not accept bets or wagers.
• Official Verification: All lottery results are aggregated from publicly available government gazettes. Users are advised to verify winning numbers with the official Kerala Government Gazette before claiming prizes.
• Strictly for users aged 18 years and older.`
  },
  {
    languageCode: 'ml-IN',
    title: 'കേരള ലോട്ടറി റിസൾട്ട് ടുഡേ',
    shortDescription: 'തത്സമയ 3 PM കേരള ലോട്ടറി റിസൾട്ട്, ബാർകോഡ് സ്കാനർ, AI അനലിറ്റിക്സ് & PDF ഗസറ്റ്.',
    fullDescription: `ഏറ്റവും കൃത്യവും വേഗതയേറിയതുമായ ലൈവ് കേരള ലോട്ടറി നറുക്കെടുപ്പ് ഫലങ്ങൾ നിങ്ങളുടെ മൊബൈലിൽ തത്സമയം അറിയാം! കേരള ലോട്ടറി റിസൾട്ട് ടുഡേ ആപ്പ് ലൈവ് 3 PM അപ്‌ഡേറ്റുകൾ, ടിക്കറ്റ് ബാർകോഡ് സ്കാനിംഗ്, എഐ ലോട്ടറി അനലിറ്റിക്‌സ്, ജില്ലാ അടിസ്ഥാനത്തിലുള്ള വിൻ ഹിസ്റ്ററി, ഒഫീഷ്യൽ PDF ഗസറ്റ് ഡൗൺലോഡ് എന്നിവ നൽകുന്നു.

പ്രധാന സവിശേഷതകൾ:

⚡ തത്സമയ 3:00 PM ലൈവ് റിസൾട്ട്:
• ദിവസേന 3:00 PM മുതൽ തത്സമയ ലൈവ് അപ്‌ഡേറ്റുകളും കൗണ്ട്ഡൗണും.
• ഒന്നാം സമ്മാനം മുതൽ എട്ടാം സമ്മാനം വരെയുള്ള സമ്പൂർണ്ണ പ്രൈസ് വിവരങ്ങൾ.
• ഇന്റർനെറ്റ് വേഗത കുറവാണെങ്കിലും റിസൾട്ട് കാണാനുള്ള ഓഫ്‌ലൈൻ കാഷിംഗ്.

📷 സ്മാർട്ട് ലോട്ടറി ബാർകോഡ് സ്കാനർ:
• ഫോൺ ക്യാമറ ഉപയോഗിച്ച് ടിക്കറ്റിലെ ബാർകോഡ് സ്കാൻ ചെയ്യാം.
• നിങ്ങളുടെ ടിക്കറ്റിന് സമ്മാനമുണ്ടോ എന്ന് നിമിഷങ്ങൾക്കകം അറിയാം.

🤖 എഐ ലോട്ടറി അനലിറ്റിക്സ്:
• മുൻകാല നറുക്കെടുപ്പുകളുടെ നമ്പർ സ്റ്റാറ്റിസ്റ്റിക്സും റിപ്പീറ്റ് പാറ്റേണുകളും.
• ലോട്ടറി നമ്പറുകളുടെ ട്രെൻഡുകൾ പരിശോധിക്കാൻ സ്മാർട്ട് AI അനലിറ്റിക്സ്.

🗺️ ജില്ലാ വിൻ ഹിസ്റ്ററി:
• ഏറ്റവും കൂടുതൽ ഒന്നാം സമ്മാനങ്ങളും ജാക്ക്‌പോട്ടുകളും നേടിയ ജില്ലകളെക്കുറിച്ചുള്ള വിവരങ്ങൾ.

🎙️ എഐ വോയ്‌സ് അസിസ്റ്റന്റ്:
• മലയാളത്തിലും ഇംഗ്ലീഷിലും ശബ്ദത്തിലൂടെ ലോട്ടറി വിവരങ്ങൾ ചോദിച്ചറിയാം.

📤 ഒറ്റ ടാപ്പിൽ വാട്ട്സ്ആപ്പ് ഷെയറിംഗ്:
• ലോട്ടറി റിസൾട്ട് കാർഡുകൾ വാട്ട്സ്ആപ്പ് സ്റ്റാറ്റസിലേക്കും ഗ്രൂപ്പുകളിലേക്കും എളുപ്പത്തിൽ ഷെയർ ചെയ്യാം.

⏰ ലൈവ് നോട്ടിഫിക്കേഷനുകൾ:
• 3:00 PM നറുക്കെടുപ്പ് ആരംഭിക്കുമ്പോഴും ഒഫീഷ്യൽ ഗസറ്റ് വരുമ്പോഴും കൃത്യമായ അലേർട്ടുകൾ.

🔎 ഫാസ്റ്റ് നമ്പർ സെർച്ച്:
• അവസാന 4 അക്കങ്ങളോ മുഴുവൻ നമ്പറോ നൽകി എളുപ്പത്തിൽ റിസൾട്ട് തിരയാം.

📅 വീക്ക്‌ലി & ബമ്പർ ലോട്ടറി വിവരങ്ങൾ:
• വീക്ക്‌ലി: വിൻ-വിൻ, സ്ത്രീ ശക്തി, ഫിഫ്റ്റി-ഫിഫ്റ്റി, കാരുണ്യ പ്ലസ്, നിർമ്മൽ, കാരുണ്യ, അക്ഷയ.
• ബമ്പറുകൾ: തിരുവോണം ബമ്പർ, വിഷു, പൂജ, ക്രിസ്മസ്-ന്യൂ ഇയർ, മൺസൂൺ, സമ്മർ ബമ്പർ.

📜 ഒഫീഷ്യൽ ഗസറ്റ് PDF ഡൗൺലോഡ്:
• സർക്കാർ ഒഫീഷ്യൽ ഗസറ്റ് PDF നേരിട്ട് ഡൗൺലോഡ് ചെയ്യാം.

💰 പ്രൈസ് ക്ലെയിം ഗൈഡ് & ടാക്സ് കാൽക്കുലേറ്റർ:
• സമ്മാനത്തുക കൈപ്പറ്റാനുള്ള നിർദ്ദേശങ്ങളും TDS ടാക്സ് കാൽക്കുലേറ്ററും.

⚠️ നിരാകരണ അറിയിപ്പ് (DISCLAIMER):
• ഈ ആപ്പ് ലോട്ടറി ടിക്കറ്റ് വിവരങ്ങൾ അറിയാനുള്ള ഒരു ഇൻഫർമേഷൻ യൂട്ടിലിറ്റി മാത്രമാണ്. ഇത് കേരള സർക്കാർ ലോട്ടറി വകുപ്പിന്റെ ഔദ്യോഗിക ആപ്പ് അല്ല.
• ഈ ആപ്പിലൂടെ ലോട്ടറി ടിക്കറ്റുകൾ വിൽക്കുകയോ ചൂതാട്ടം നടത്തുകയോ ചെയ്യുന്നില്ല.
• സമ്മാനങ്ങൾ ക്ലെയിം ചെയ്യുന്നതിന് മുൻപ് ഒഫീഷ്യൽ ഗവൺമെന്റ് ഗസറ്റുമായി ഒത്തുനോക്കുക.
• 18 വയസ്സിന് മുകളിലുള്ളവർക്ക് മാത്രം.`
  },
  {
    languageCode: 'hi-IN',
    title: 'Kerala Lottery Results Today',
    shortDescription: 'लाइव 3 PM केरल लॉटरी रिजल्ट, बारकोड स्कैनर, AI एनालिटिक्स और PDF गजट।',
    fullDescription: `अपने फोन पर सबसे तेज़ और सटीक लाइव केरल लॉटरी रिजल्ट प्राप्त करें! Kerala Lottery Results Today आपको लाइव 3 PM ड्रा अपडेट, लॉटरी टिकट बारकोड स्कैनर, AI एनालिटिक्स और आधिकारिक PDF गजट डाउनलोड की सुविधा देता है।

मुख्य विशेषताएं:

⚡ लाइव 3:00 PM केरल लॉटरी रिजल्ट:
• रोजाना 3:00 PM IST पर लाइव अपडेट और काउंटडाउन टाइमर।
• पहले इनाम से 8वें इनाम तक पूरा प्राइज़ ब्रेकडाउन।
• कमजोर नेटवर्क पर भी स्मूथ काम करने वाला ऑफलाइन कैश।

📷 स्मार्ट लॉटरी बारकोड स्कैनर:
• अपने फोन कैमरे से लॉटरी टिकट का बारकोड स्कैन करें और तुरंत रिजल्ट चेक करें।

🤖 AI लॉटरी एनालिटिक्स:
• पिछले ड्रा के नंबर स्टैटिस्टिक्स और ट्रेंड्स देखें।

🗺️ डिस्ट्रिक्ट विनिंग रिकॉर्ड्स:
• जानें किस जिले में सबसे ज्यादा जैकपॉट और पहले इनाम जीते गए हैं।

🎙️ AI वॉयस असिस्टेंट:
• बोलकर लॉटरी रिजल्ट और शेड्यूल की जानकारी लें।

📤 1-टैप व्हाट्सएप शेयरिंग:
• लॉटरी रिजल्ट आसानी से व्हाट्सएप स्टेटस और ग्रुप्स पर शेयर करें।

⏰ ड्रॉ नोटिफिकेशन:
• 3:00 PM लाइव ड्रॉ शुरू होने और फाइनल गजट आने पर तुरंत अलर्ट।

📅 सभी साप्ताहिक और बम्पर लॉटरी:
• Win-Win, Sthree Sakthi, Fifty-Fifty, Karunya Plus, Nirmal, Karunya, Akshaya और सभी बम्पर लॉटरी (Onam, Vishu, Pooja, Xmas)।

📜 आधिकारिक PDF गजट:
• ओरिजिनल सरकारी गजट PDF सीधे डाउनलोड करें।

⚠️ अस्वीकरण (DISCLAIMER):
• यह ऐप केवल सूचनात्मक उद्देश्य के लिए है और केरल सरकार या राज्य लॉटरी विभाग का आधिकारिक ऐप नहीं है।
• यह ऐप लॉटरी टिकट नहीं बेचता और न ही किसी प्रकार के जुए का समर्थन करता है।
• इनाम का दावा करने से पहले सरकारी गजट से नंबर जरूर मिलाएं।
• केवल 18 वर्ष या उससे अधिक आयु के उपयोगकर्ताओं के लिए।`
  },
  {
    languageCode: 'ta-IN',
    title: 'Kerala Lottery Results Today',
    shortDescription: 'நேரலை 3 PM கேரளா லாட்டரி முடிவுகள், பார்கோடு ஸ்கேனர் & PDF கெஜட்.',
    fullDescription: `உங்கள் மொபைலில் நேரலை கேரளா லாட்டரி முடிவுகளை உடனுக்குடன் பெறுங்கள்! Kerala Lottery Results Today ஆப் மூலம் நேரலை 3 PM முடிவுகள், பார்கோடு டிக்கெட் ஸ்கேனர், AI பகுப்பாய்வு மற்றும் அதிகாரப்பூர்வ PDF கெஜட் பதிவிறக்கம் செய்யலாம்.

சிறப்பம்சங்கள்:

⚡ நேரலை 3:00 PM முடிவுகள்:
• தினமும் மதியம் 3:00 மணிக்கு நேரலை முடிவுகள் மற்றும் கவுண்டவுன் டைமர்.
• 1-ஆம் பரிசு முதல் 8-ஆம் பரிசு வரையிலான முழுமையான பரிசு விவரங்கள்.
• ஆஃப்லைன் கேச்சிங் வசதி.

📷 ஸ்மார்ட் பார்கோடு ஸ்கேனர்:
• உங்கள் மொபைல் கேமரா மூலம் டிக்கெட் பார்கோடை ஸ்கேன் செய்து முடிவுகளை எளிதில் சரிபார்க்கலாம்.

🤖 AI லாட்டரி அனலிட்டிக்ஸ்:
• முந்தைய எண்களின் புள்ளிவிவரங்கள் மற்றும் டிரெண்டுகளை அறியலாம்.

🗺️ மாவட்ட வெற்றி விவரங்கள்:
• எந்த மாவட்டத்தில் அதிக ஜாக்பாட் மற்றும் முதல் பரிசுகள் கிடைத்துள்ளன என்பதை தெரிந்து கொள்ளலாம்.

🎙️ AI வாய்ஸ் அசிஸ்டண்ட்:
• குரல் மூலம் லாட்டரி முடிவுகள் மற்றும் நேரங்களை எளிதாக கேட்கலாம்.

📤 வாட்ஸ்அப் பகிர்வு:
• லாட்டரி முடிவுகளை ஒரே கிளிக்கில் வாட்ஸ்அப் ஸ்டேட்டஸ் மற்றும் குரூப்களில் பகிரலாம்.

⏰ அறிவிப்புகள் (Notifications):
• மதியம் 3:00 மணிக்கு குலுக்கல் தொடங்கும் போது நேரலை எச்சரிக்கை.

📅 வாராந்திர & பம்பர் லாட்டரி:
• Win-Win, Sthree Sakthi, Fifty-Fifty, Karunya Plus, Nirmal, Karunya, Akshaya மற்றும் பம்பர் முடிவுகள்.

📜 அதிகாரப்பூர்வ PDF பதிவிறக்கம்:
• கேரள அரசு அதிகாரப்பூர்வ கெஜட் PDF-ஐ எளிதாக பதிவிறக்கம் செய்யலாம்.

⚠️ பொறுப்புத் துறப்பு (DISCLAIMER):
• இந்த செயலி தகவல் நோக்கத்திற்காக மட்டுமே உருவாக்கப்பட்டது. இது கேரள அரசு அல்லது லாட்டரி துறையின் அதிகாரப்பூர்வ செயலி அல்ல.
• இந்த செயலி லாட்டரி டிக்கெட்டுகளை விற்பனை செய்யவோ அல்லது சூதாட்டத்தை ஆதரிக்கவோ இல்லை.
• பரிசுகளை பெறுவதற்கு முன் அதிகாரப்பூர்வ அரசிதழில் சரிபார்க்கவும்.
• 18 வயது அல்லது அதற்கு மேற்பட்டவர்களுக்கு மட்டுமே.`
  },
  {
    languageCode: 'kn-IN',
    title: 'Kerala Lottery Results Today',
    shortDescription: 'ಲೈವ್ 3 PM ಕೇರಳ ಲಾಟರಿ ಫಲಿತಾಂಶ, ಬಾರ್ಕೋಡ್ ಸ್ಕ್ಯಾನರ್ ಮತ್ತು PDF ಗೆಜೆಟ್.',
    fullDescription: `ನಿಮ್ಮ ಮೊಬೈಲ್‌ನಲ್ಲಿ ನಿಖರ ಮತ್ತು ವೇಗದ ಲೈವ್ ಕೇರಳ ಲಾಟರಿ ಫಲಿತಾಂಶಗಳನ್ನು ಪಡೆಯಿರಿ! Kerala Lottery Results Today ಅಪ್ಲಿಕೇಶನ್ ಲೈವ್ 3 PM ಫಲಿತಾಂಶಗಳು, ಬಾರ್‌ಕೋಡ್ ಟಿಕೆಟ್ ಸ್ಕ್ಯಾನರ್, AI ಅಂಕಿಅಂಶಗಳು ಮತ್ತು ಅಧಿಕೃತ PDF ಗೆಜೆಟ್ ಡೌನ್‌ಲೋಡ್ ನೀಡುತ್ತದೆ.

ಪ್ರಮುಖ ಲಕ್ಷಣಗಳು:

⚡ ಲೈವ್ 3:00 PM ಫಲಿತಾಂಶಗಳು:
• ಪ್ರತಿದಿನ ಮಧ್ಯಾಹ್ನ 3:00 ಗಂಟೆಗೆ ಲೈವ್ ಫಲಿತಾಂಶ ಅಪ್‌ಡೇಟ್‌ಗಳು.
• 1ನೇ ಬಹುಮಾನದಿಂದ 8ನೇ ಬಹುಮಾನದವರೆಗಿನ ಸಂಪೂರ್ಣ ವಿವರ.

📷 ಬಾರ್ಕೋಡ್ ಸ್ಕ್ಯಾನರ್:
• ಟಿಕೆಟ್ ಬಾರ್‌ಕೋಡ್ ಸ್ಕ್ಯಾನ್ ಮಾಡಿ ತಕ್ಷಣ ಬಹುಮಾನ ಪರಿಶೀಲಿಸಿ.

🤖 AI ಲಾಟರಿ ಅನಲಿಟಿಕ್ಸ್:
• ಹಿಂದಿನ ಡ್ರಾ ಸಂಖ್ಯೆಗಳ ಅಂಕಿಅಂಶಗಳು ಮತ್ತು ಟ್ರೆಂಡ್‌ಗಳನ್ನು ವೀಕ್ಷಿಸಿ.

🗺️ ಜಿಲ್ಲಾವಾರು ಫಲಿತಾಂಶಗಳು:
• ಯಾವ ಜಿಲ್ಲೆಯಲ್ಲಿ ಹೆಚ್ಚು ಜಾಕ್‌ಪಾಟ್ ಬಂದಿದೆ ಎಂದು ತಿಳಿಯಿರಿ.

🎙️ AI ಧ್ವನಿ ಸಹಾಯಕ:
• ಧ್ವನಿ ಮೂಲಕ ಲಾಟರಿ ಫಲಿತಾಂಶಗಳನ್ನು ಕೇಳಿ ತಿಳಿಯಿರಿ.

📤 ವಾಟ್ಸಾಪ್ ಹಂಚಿಕೆ:
• ಸುಲಭವಾಗಿ ವಾಟ್ಸಾಪ್‌ನಲ್ಲಿ ಫಲಿತಾಂಶ ಹಂಚಿಕೊಳ್ಳಿ.

⏰ ಅಧಿಸೂಚನೆಗಳು:
• ಡ್ರಾ ಪ್ರಾರಂಭವಾದಾಗ ತ್ವರಿತ ಎಚ್ಚರಿಕೆಗಳು.

📅 ಸಾಪ್ತಾಹಿಕ ಮತ್ತು ಬಂಪರ್ ಲಾಟರಿಗಳು:
• Win-Win, Sthree Sakthi, Fifty-Fifty, Karunya Plus, Nirmal, Karunya, Akshaya ಮತ್ತು ಬಂಪರ್ ಲಾಟರಿಗಳು.

📜 ಅಧಿಕೃತ PDF ಡೌನ್‌ಲೋಡ್:
• ಅಧಿಕೃತ ಸರ್ಕಾರಿ ಗೆಜೆಟ್ PDF ಡೌನ್‌ಲೋಡ್ ಮಾಡಿ.

⚠️ ಹಕ್ಕು ನಿರಾಕರಣೆ (DISCLAIMER):
• ಈ ಅಪ್ಲಿಕೇಶನ್ ಕೇವಲ ಮಾಹಿತಿ ಉದ್ದೇಶಕ್ಕಾಗಿ ಮಾತ್ರ. ಇದು ಕೇರಳ ಸರ್ಕಾರದ ಅಧಿಕೃತ ಅಪ್ಲಿಕೇಶನ್ ಅಲ್ಲ.
• ಈ ಆಪ್ ಯಾವುದೇ ಲಾಟರಿ ಟಿಕೆಟ್ ಮಾರಾಟ ಮಾಡುವುದಿಲ್ಲ.
• 18 ವರ್ಷ ಮೇಲ್ಪಟ್ಟವರಿಗೆ ಮಾತ್ರ.`
  },
  {
    languageCode: 'te-IN',
    title: 'Kerala Lottery Results Today',
    shortDescription: 'లైవ్ 3 PM కేరళ లాటరీ ఫలితాలు, బార్‌కోడ్ స్కానర్ & అధికారిక PDF గెజిట్.',
    fullDescription: `మీ మొబైల్‌లో వేగవంతమైన మరియు ఖచ్చితమైన లైవ్ కేరళ లాటరీ ఫలితాలను పొందండి! Kerala Lottery Results Today యాప్ ద్వారా లైవ్ 3 PM డ్రా అప్‌డేట్‌లు, బార్‌కోడ్ టికెట్ స్కానర్, AI ఎనలిటిక్స్ మరియు అధికారిక PDF గెజిట్ డౌన్‌లోడ్ పొందవచ్చు.

ముఖ్య లక్షణాలు:

⚡ లైవ్ 3:00 PM ఫలితాలు:
• ప్రతిరోజూ మధ್ಯಾహ్నం 3:00 గంటలకు లైవ్ అప్‌డేట్‌లు.
• 1వ బహుమతి నుండి 8వ బహుమతి వరకు పూర్తి ప్రైజ్ వివరాలు.

📷 స్మార్ట్ బార్‌కోడ్ స్కానర్:
• టికెట్ బార్‌కోడ్ స్కాన్ చేసి ఫలితాన్ని వెంటనే చెక్ చేయండి.

🤖 AI లాటరీ ఎనలిటిక్స్:
• గత డ్రా నంబర్ల గణాంకాలు మరియు ట్రెండ్స్.

🗺️ జిల్లా వారీ రికార్డులు:
• ఏ జిల్లాలో ఎక్కువ జాక్‌పాట్‌లు వచ్చాయో చూడండి.

🎙️ AI వాయిస్ అసిస్టెంట్:
• వాయిస్ ద్వారా లాటరీ వివరాలను అడగండి.

📤 వాట్సాప్ షేరింగ్:
• ఫలితాలను సులభంగా వాట్సాప్‌లో షేర్ చేయండి.

⏰ నోటిఫికేషన్‌లు:
• డ్రా ప్రారంభమైనప్పుడు తక్షణ అలర్ట్స్.

📅 వీక్లీ & బంపర్ లాటరీలు:
• Win-Win, Sthree Sakthi, Fifty-Fifty, Karunya Plus, Nirmal, Karunya, Akshaya మరియు బంపర్ ఫలితాలు.

📜 అధికారిక PDF గెజిట్:
• కేరళ ప్రభుత్వ అధికారిక గెజిట్ PDF డౌన్‌లోడ్ చేసుకోండి.

⚠️ నిరాకరణ (DISCLAIMER):
• ఈ యాప్ సమాచార ప్రయోజనాల కోసం మాత్రమే. ఇది కేరళ ప్రభుత్వ అధికారిక యాప్ కాదు.
• ఈ యాప్ లాటరీ టిక్కెట్లను విక్రయించదు.
• 18 సంవత్సరాలు పైబడిన వారికి మాత్రమే.`
  }
];

function escapeCSV(str: string): string {
  if (str.includes('"') || str.includes(',') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

// Generate CSV
const headers = ['Language', 'Title', 'Short description', 'Full description'];
const csvLines: string[] = [headers.map(escapeCSV).join(',')];

for (const t of translations) {
  console.log(`[${t.languageCode}] Title: ${t.title.length}/30 | Short: ${t.shortDescription.length}/80 | Full: ${t.fullDescription.length}/4000`);
  csvLines.push([
    escapeCSV(t.languageCode),
    escapeCSV(t.title),
    escapeCSV(t.shortDescription),
    escapeCSV(t.fullDescription)
  ].join(','));
}

const csvOutput = '\uFEFF' + csvLines.join('\r\n');
const outputPath = path.resolve('d:/work-2/lottry/mobile/play_store_translations.csv');
fs.writeFileSync(outputPath, csvOutput, 'utf8');
console.log(`Successfully generated: ${outputPath}`);
