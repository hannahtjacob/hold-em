import { useCallback, useEffect, useRef, useState } from 'react';
import { Table } from 'poker-ts';

export type PokerAction = 'fold' | 'check' | 'call' | 'bet' | 'raise';

export type PlayingCard = {
  rank: '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | 'T' | 'J' | 'Q' | 'K' | 'A';
  suit: 'clubs' | 'diamonds' | 'hearts' | 'spades';
};

type SeatState = {
  betSize: number;
  stack: number;
  totalChips: number;
} | null;

export type PokerSnapshot = {
  button: number;
  communityCards: PlayingCard[];
  currentPlayer: number | null;
  handInProgress: boolean;
  holeCards: (PlayingCard[] | null)[];
  legalActions: PokerAction[];
  maximumBet: number | null;
  minimumBet: number | null;
  pot: number;
  result: string | null;
  revision: number;
  round: 'preflop' | 'flop' | 'turn' | 'river' | 'showdown';
  seats: SeatState[];
};

const HUMAN_SEAT = 0;
const STARTING_CHIPS = 1000;
const PLAYER_NAMES = ['You', 'Mina', 'Theo', 'Ivy', 'Max'];

type PokerTable = InstanceType<typeof Table>;

function createTable() {
  const table = new Table({ smallBlind: 10, bigBlind: 20 }, PLAYER_NAMES.length);
  PLAYER_NAMES.forEach((_, seat) => table.sitDown(seat, STARTING_CHIPS));
  table.startHand(0);
  return table;
}

function createSnapshot(
  table: PokerTable,
  revision: number,
  result: string | null,
  settledPot = 0,
  settledCommunityCards: PlayingCard[] = [],
  settledHoleCards: (PlayingCard[] | null)[] = [],
): PokerSnapshot {
  const handInProgress = table.isHandInProgress();
  const betting = handInProgress && table.isBettingRoundInProgress();
  const legal = betting ? table.legalActions() : null;
  const seats = (handInProgress ? table.handPlayers() : table.seats()) as SeatState[];

  return {
    button: handInProgress ? table.button() : -1,
    communityCards: handInProgress
      ? (table.communityCards() as PlayingCard[])
      : settledCommunityCards,
    currentPlayer: betting ? table.playerToAct() : null,
    handInProgress,
    holeCards: handInProgress
      ? (table.holeCards() as (PlayingCard[] | null)[])
      : settledHoleCards,
    legalActions: (legal?.actions ?? []) as PokerAction[],
    maximumBet: legal?.chipRange?.max ?? null,
    minimumBet: legal?.chipRange?.min ?? null,
    pot: handInProgress
      ? table.pots().reduce((total, pot) => total + pot.size, 0) +
        seats.reduce((total, seat) => total + (seat?.betSize ?? 0), 0)
      : settledPot,
    result,
    revision,
    round: handInProgress ? table.roundOfBetting() : 'showdown',
    seats,
  };
}

export function usePokerGame() {
  const tableRef = useRef<PokerTable>(createTable());
  const resultRef = useRef<string | null>(null);
  const settledPotRef = useRef(0);
  const settledCommunityCardsRef = useRef<PlayingCard[]>([]);
  const settledHoleCardsRef = useRef<(PlayingCard[] | null)[]>([]);
  const revisionRef = useRef(0);
  const [snapshot, setSnapshot] = useState(() =>
    createSnapshot(tableRef.current, 0, null),
  );

  const refresh = useCallback(() => {
    revisionRef.current += 1;
    setSnapshot(
      createSnapshot(
        tableRef.current,
        revisionRef.current,
        resultRef.current,
        settledPotRef.current,
        settledCommunityCardsRef.current,
        settledHoleCardsRef.current,
      ),
    );
  }, []);

  const finishOrAdvanceRound = useCallback(() => {
    const table = tableRef.current;

    while (table.isHandInProgress() && !table.isBettingRoundInProgress()) {
      const potsBeforeSettlement = table.pots();
      settledPotRef.current = potsBeforeSettlement.reduce(
        (total, pot) => total + pot.size,
        0,
      );

      table.endBettingRound();

      if (table.areBettingRoundsCompleted()) {
        const settlementPots = table.pots();
        const eligibleAtSettlement = settlementPots.flatMap(
          (pot) => pot.eligiblePlayers,
        );
        const potSize = settlementPots.reduce((total, pot) => total + pot.size, 0);
        settledPotRef.current = potSize;
        settledCommunityCardsRef.current = table.communityCards() as PlayingCard[];
        settledHoleCardsRef.current = table.holeCards() as (PlayingCard[] | null)[];
        table.showdown();
        const winningSeats = Array.from(
          new Set(table.winners().flatMap((pot) => pot.map(([seat]) => seat))),
        );
        const fallbackWinner = eligibleAtSettlement[0];
        const winners = winningSeats.length ? winningSeats : [fallbackWinner];
        const names = winners
          .filter((seat): seat is number => typeof seat === 'number')
          .map((seat) => PLAYER_NAMES[seat]);
        resultRef.current = names.length
          ? `${names.join(' & ')} ${names.length > 1 ? 'split' : 'won'} the pot`
          : 'Hand complete';
      }
    }

    refresh();
  }, [refresh]);

  const takeAction = useCallback(
    (action: PokerAction, amount?: number) => {
      const table = tableRef.current;
      if (!table.isHandInProgress() || !table.isBettingRoundInProgress()) return;

      table.actionTaken(action, amount);
      finishOrAdvanceRound();
    },
    [finishOrAdvanceRound],
  );

  useEffect(() => {
    if (
      !snapshot.handInProgress ||
      snapshot.currentPlayer === null ||
      snapshot.currentPlayer === HUMAN_SEAT
    ) {
      return;
    }

    const timer = setTimeout(() => {
      const table = tableRef.current;
      if (!table.isBettingRoundInProgress()) return;

      const { actions, chipRange } = table.legalActions();
      const roll = Math.random();

      if (actions.includes('check') && (roll < 0.72 || !actions.includes('bet'))) {
        takeAction('check');
      } else if (actions.includes('call') && roll < 0.78) {
        takeAction('call');
      } else if (actions.includes('fold') && roll < 0.9) {
        takeAction('fold');
      } else if (actions.includes('bet')) {
        takeAction('bet', chooseBotBet(chipRange?.min, chipRange?.max));
      } else if (actions.includes('raise')) {
        takeAction('raise', chooseBotBet(chipRange?.min, chipRange?.max));
      } else if (actions.includes('check')) {
        takeAction('check');
      } else if (actions.includes('call')) {
        takeAction('call');
      } else {
        takeAction('fold');
      }
    }, 650);

    return () => clearTimeout(timer);
  }, [snapshot, takeAction]);

  const startNextHand = useCallback(() => {
    const table = tableRef.current;
    const occupiedSeats = table.seats().filter(Boolean).length;

    if (occupiedSeats < 2 || !table.seats()[HUMAN_SEAT]) {
      tableRef.current = createTable();
    } else {
      table.startHand();
    }

    resultRef.current = null;
    settledPotRef.current = 0;
    settledCommunityCardsRef.current = [];
    settledHoleCardsRef.current = [];
    refresh();
  }, [refresh]);

  const resetGame = useCallback(() => {
    tableRef.current = createTable();
    resultRef.current = null;
    settledPotRef.current = 0;
    settledCommunityCardsRef.current = [];
    settledHoleCardsRef.current = [];
    refresh();
  }, [refresh]);

  return {
    humanSeat: HUMAN_SEAT,
    playerNames: PLAYER_NAMES,
    resetGame,
    snapshot,
    startNextHand,
    takeAction,
  };
}

function chooseBotBet(minimum?: number, maximum?: number) {
  if (minimum === undefined || maximum === undefined) return undefined;
  const target = minimum + Math.floor((maximum - minimum) * 0.12);
  return Math.max(minimum, Math.min(maximum, target));
}
