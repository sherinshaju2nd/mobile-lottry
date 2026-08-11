export interface LotteryMeta {
  day: string;
  name: string;
  code: string;
  drawTime: string;
}

export const WEEKLY_LOTTERIES: LotteryMeta[] = [
  { day: "Monday", name: "Bhagyathara", code: "BT", drawTime: "3:00 PM" },
  { day: "Tuesday", name: "Sthree Sakthi", code: "SS", drawTime: "3:00 PM" },
  { day: "Wednesday", name: "Dhanalekshmi", code: "DL", drawTime: "3:00 PM" },
  { day: "Thursday", name: "Karunya Plus", code: "KN", drawTime: "3:00 PM" },
  { day: "Friday", name: "Suvarna Keralam", code: "SK", drawTime: "3:00 PM" },
  { day: "Saturday", name: "Karunya", code: "KR", drawTime: "3:00 PM" },
  { day: "Sunday", name: "Samrudhi", code: "SM", drawTime: "3:00 PM" },
];
