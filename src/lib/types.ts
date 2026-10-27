export type Category = 'casual' | 'party' | 'cheeky' | 'dirty' | 'framtid';
export type CardKind = 'vem' | 'direkt' | 'trivia' | 'utmaning' | 'minigame' | 'bild';

/** Ett kort som det ligger i databasen (tabellen cards). */
export interface CardRow {
  id: number | string;
  kind: CardKind;
  text: string;
  title?: string | null;
  category?: Category | null;
  difficulty?: number | null;
  answer?: string | null;
  wrong_answers?: string[] | null;
  players?: number | null;
}

/** Ett kort i en blandad kortlek. */
export interface DeckCard {
  id: string;
  kind: CardKind;
  text: string;
  title?: string;
  /** Trivia: index för rätt svar i options. */
  answerIndex?: number;
  options?: string[];
  /** 0 = grupp, 1 = solo, 2 = X och Y, 3 = lag */
  players: number;
  /** Tidigaste del kortet får dyka upp i. */
  level: number;
  custom?: boolean;
}

export type Choice = 'drink' | 'save' | 'challenge' | 'answered';

export interface Player {
  id: string;
  name: string;
  selfie: string | null;
  joinedAt: number;
  /** Har gått igenom stör ej, regler och selfie. */
  ready: boolean;
  saved: number;
  drank: number;
  votesReceived: number;
  challenges: number;
  turns: number;
}

export type Phase = 'play' | 'upload' | 'voting' | 'result';

export interface Current {
  seq: number;
  card: DeckCard;
  /** Texten med namn och klunkar ifyllda. */
  text: string;
  turnId: string;
  targetIds: string[];
  teams?: [string[], string[]];
  sips: number;
  phase: Phase;
  votes: Record<string, string>;
  losers: string[];
  choices: Record<string, Choice>;
  photoUrl?: string | null;
  photoSkipped?: boolean;
  triviaPick?: number | null;
}

export interface Overlay {
  text: string;
  /** Dras ur utmaningskortet i stället för att dricka på ett solo-kort. */
  advancesCard: boolean;
}

export interface CustomCard {
  id: string;
  kind: 'vem' | 'utmaning';
  text: string;
  by: string;
}

export type Status = 'lobby' | 'intro' | 'playing' | 'partEnd' | 'finished' | 'ended';

export interface GameState {
  status: Status;
  hostId: string;
  players: Player[];
  part: number;
  cardIndex: number;
  deck: DeckCard[][];
  challengePool: DeckCard[];
  current: Current | null;
  overlays: Record<string, Overlay>;
  customCards: CustomCard[];
  lastTurnId: string | null;
  seq: number;
}

/** Det klienterna får se: framtida kort skickas aldrig ut. */
export type PublicState = Omit<GameState, 'deck' | 'challengePool'> & {
  cardsInPart: number;
};

export interface GameView {
  code: string;
  version: number;
  state: PublicState;
  active: string[];
}

export type Action =
  | { type: 'start_intro' }
  | { type: 'ready' }
  | { type: 'set_selfie'; url: string }
  | { type: 'add_custom'; kind: 'vem' | 'utmaning'; text: string }
  | { type: 'remove_custom'; id: string }
  | { type: 'start_game' }
  | { type: 'vote'; targetId: string }
  | { type: 'close_vote' }
  | { type: 'choose'; choice: Choice }
  | { type: 'trivia_answer'; index: number }
  | { type: 'dismiss_overlay' }
  | { type: 'drink_saved' }
  | { type: 'upload_photo'; url: string }
  | { type: 'skip_photo' }
  | { type: 'next' }
  | { type: 'continue' }
  | { type: 'end' }
  | { type: 'restart' };
