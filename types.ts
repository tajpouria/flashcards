export interface FlashCard {
  front: string;
  back: string;
}

export interface Group {
  name: string;
  cards: FlashCard[];
}
