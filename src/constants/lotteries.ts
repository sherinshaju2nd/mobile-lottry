export interface LotteryMeta {
  day: string;
  name: string;
  nameMl: string;
  code: string;
  drawTime: string;
}

export const WEEKLY_LOTTERIES: LotteryMeta[] = [
  { day: "Monday", name: "Bhagyathara", nameMl: "ഭാഗ്യതാരാ", code: "BT", drawTime: "3:00 PM" },
  { day: "Tuesday", name: "Sthree Sakthi", nameMl: "സ്ത്രീശക്തി", code: "SS", drawTime: "3:00 PM" },
  { day: "Wednesday", name: "Dhanalekshmi", nameMl: "ധനലക്ഷ്മി", code: "DL", drawTime: "3:00 PM" },
  { day: "Thursday", name: "Karunya Plus", nameMl: "കാരുണ്യ പ്ലസ്", code: "KN", drawTime: "3:00 PM" },
  { day: "Friday", name: "Suvarna Keralam", nameMl: "സുവർണ്ണ കേരളം", code: "SK", drawTime: "3:00 PM" },
  { day: "Saturday", name: "Karunya", nameMl: "കാരുണ്യ", code: "KR", drawTime: "3:00 PM" },
  { day: "Sunday", name: "Samrudhi", nameMl: "സമൃദ്ധി", code: "SM", drawTime: "3:00 PM" },
];
