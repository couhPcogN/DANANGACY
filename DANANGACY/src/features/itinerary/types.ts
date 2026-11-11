export type Stop = { placeId: string; start: string; end: string };
export type Trip = {
  id: string;
  title: string;
  date: string;
  duration: number;
  pace: string;
  stops: Stop[];
  saved: boolean;
};
