export type TourReviewQueueItem = {
  id: string;
  operatorName: string;
  tourName: string;
  submittedTime: string;
  price: string;
  duration: string;
};

export const adminTourQueue: TourReviewQueueItem[] = [
  {
    id: 'demo',
    operatorName: 'Hanoi Heritage Travel',
    tourName: 'Hanoi Old Quarter Cycling Tour',
    submittedTime: '2 giờ trước',
    price: '899.000đ',
    duration: '3.5 giờ',
  },
  {
    id: 'fansipan-demo',
    operatorName: 'Sapa Trekking Co.',
    tourName: 'Fansipan Peak Climbing Adventure',
    submittedTime: '4 giờ trước',
    price: '2.450.000đ',
    duration: '2N1Đ',
  },
  {
    id: 'hue-demo',
    operatorName: 'An Nam Discovery',
    tourName: 'Hue Imperial City Heritage Walk',
    submittedTime: 'Hôm qua',
    price: '550.000đ',
    duration: '4 giờ',
  },
];
