import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import {
  PlayingCard,
  PokerAction,
  usePokerGame,
} from '../poker/usePokerGame';

const SUIT_SYMBOLS: Record<PlayingCard['suit'], string> = {
  clubs: '♣',
  diamonds: '♦',
  hearts: '♥',
  spades: '♠',
};

export function ProfileScreen() {
  const {
    humanSeat,
    playerNames,
    resetGame,
    snapshot,
    startNextHand,
    takeAction,
  } = usePokerGame();
  const isHumanTurn = snapshot.currentPlayer === humanSeat;
  const raiseAction = snapshot.legalActions.includes('bet') ? 'bet' : 'raise';
  const canRaise = snapshot.legalActions.includes(raiseAction);

  return (
    <ScrollView
      contentContainerStyle={styles.content}
      style={styles.container}
    >
      <View style={styles.header}>
        <View>
          <Text style={styles.eyebrow}>NO-LIMIT HOLD&apos;EM</Text>
          <Text style={styles.title}>Bot table</Text>
        </View>
        <Pressable accessibilityLabel="Reset game" onPress={resetGame} style={styles.reset}>
          <MaterialCommunityIcons color="#a8bdb4" name="refresh" size={24} />
        </Pressable>
      </View>

      <View style={styles.table}>
        <View style={styles.botRow}>
          <PlayerSeat
            active={snapshot.currentPlayer === 1}
            cards={snapshot.holeCards[1]}
            dealer={snapshot.button === 1}
            name={playerNames[1]}
            player={snapshot.seats[1]}
            reveal={!snapshot.handInProgress}
          />
          <PlayerSeat
            active={snapshot.currentPlayer === 2}
            cards={snapshot.holeCards[2]}
            dealer={snapshot.button === 2}
            name={playerNames[2]}
            player={snapshot.seats[2]}
            reveal={!snapshot.handInProgress}
          />
        </View>

        <View style={styles.center}>
          <Text style={styles.round}>{snapshot.round.toUpperCase()}</Text>
          <Text style={styles.pot}>Pot · {snapshot.pot}</Text>
          <View style={styles.communityCards}>
            {Array.from({ length: 5 }, (_, index) => (
              <Card key={index} card={snapshot.communityCards[index]} compact />
            ))}
          </View>
        </View>

        <PlayerSeat
          active={isHumanTurn}
          cards={snapshot.holeCards[humanSeat]}
          dealer={snapshot.button === humanSeat}
          name={playerNames[humanSeat]}
          player={snapshot.seats[humanSeat]}
          reveal
        />
      </View>

      {snapshot.handInProgress ? (
        <View style={styles.controls}>
          <Text style={styles.turnMessage}>
            {isHumanTurn
              ? 'Your turn'
              : `${snapshot.currentPlayer === null ? 'Table' : playerNames[snapshot.currentPlayer]} is thinking…`}
          </Text>
          <View style={styles.actionRow}>
            <ActionButton
              disabled={!isHumanTurn || !snapshot.legalActions.includes('fold')}
              label="Fold"
              onPress={() => takeAction('fold')}
              tone="muted"
            />
            <ActionButton
              disabled={
                !isHumanTurn ||
                (!snapshot.legalActions.includes('check') &&
                  !snapshot.legalActions.includes('call'))
              }
              label={
                snapshot.legalActions.includes('check')
                  ? 'Check'
                  : snapshot.legalActions.includes('call')
                    ? 'Call'
                    : 'Check'
              }
              onPress={() =>
                takeAction(snapshot.legalActions.includes('check') ? 'check' : 'call')
              }
              tone="light"
            />
            <ActionButton
              disabled={!isHumanTurn || !canRaise}
              label={
                canRaise && snapshot.minimumBet !== null
                  ? `${raiseAction === 'bet' ? 'Bet' : 'Raise'} ${snapshot.minimumBet}`
                  : 'Raise'
              }
              onPress={() =>
                takeAction(raiseAction as PokerAction, snapshot.minimumBet ?? undefined)
              }
              tone="red"
            />
          </View>
        </View>
      ) : (
        <View style={styles.resultCard}>
          <Text style={styles.result}>{snapshot.result ?? 'Hand complete'}</Text>
          <Pressable onPress={startNextHand} style={styles.nextHandButton}>
            <Text style={styles.nextHandText}>Deal next hand</Text>
          </Pressable>
        </View>
      )}
    </ScrollView>
  );
}

type PlayerSeatProps = {
  active: boolean;
  cards: PlayingCard[] | null;
  dealer: boolean;
  name: string;
  player: { betSize: number; stack: number } | null;
  reveal: boolean;
};

function PlayerSeat({ active, cards, dealer, name, player, reveal }: PlayerSeatProps) {
  return (
    <View style={[styles.seat, active && styles.activeSeat, !player && styles.foldedSeat]}>
      <View style={styles.seatNameRow}>
        <Text style={styles.seatName}>{name}</Text>
        {dealer && <Text style={styles.dealer}>D</Text>}
      </View>
      <Text style={styles.stack}>{player ? `${player.stack} chips` : 'Out'}</Text>
      <View style={styles.holeCards}>
        {[0, 1].map((index) => (
          <Card
            card={reveal ? cards?.[index] : undefined}
            faceDown={Boolean(cards) && !reveal}
            key={index}
            compact
          />
        ))}
      </View>
      {player && player.betSize > 0 && <Text style={styles.bet}>Bet {player.betSize}</Text>}
    </View>
  );
}

type CardProps = {
  card?: PlayingCard;
  compact?: boolean;
  faceDown?: boolean;
};

function Card({ card, compact, faceDown }: CardProps) {
  if (faceDown) {
    return <View style={[styles.card, compact && styles.compactCard, styles.cardBack]} />;
  }

  if (!card) {
    return <View style={[styles.card, compact && styles.compactCard, styles.emptyCard]} />;
  }

  const isRed = card.suit === 'diamonds' || card.suit === 'hearts';
  return (
    <View style={[styles.card, compact && styles.compactCard]}>
      <Text style={[styles.cardText, isRed && styles.redCard]}>
        {card.rank}
        {SUIT_SYMBOLS[card.suit]}
      </Text>
    </View>
  );
}

type ActionButtonProps = {
  disabled: boolean;
  label: string;
  onPress: () => void;
  tone: 'light' | 'muted' | 'red';
};

function ActionButton({ disabled, label, onPress, tone }: ActionButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.actionButton,
        tone === 'light' && styles.lightButton,
        tone === 'muted' && styles.mutedButton,
        tone === 'red' && styles.redButton,
        disabled && styles.disabled,
        pressed && styles.pressed,
      ]}
    >
      <Text style={[styles.actionText, tone === 'light' && styles.darkActionText]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#081c15',
    flex: 1,
  },
  content: {
    padding: 18,
    paddingBottom: 30,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  eyebrow: {
    color: '#74c69d',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.7,
  },
  title: {
    color: '#f7f3e8',
    fontSize: 30,
    fontWeight: '800',
    marginTop: 3,
  },
  reset: {
    padding: 9,
  },
  table: {
    backgroundColor: '#146b4b',
    borderColor: '#bd8c4b',
    borderRadius: 110,
    borderWidth: 7,
    minHeight: 470,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { height: 8, width: 0 },
    shadowOpacity: 0.28,
    shadowRadius: 14,
  },
  botRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  center: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    minHeight: 150,
  },
  round: {
    color: '#b5d8c9',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.4,
  },
  pot: {
    color: '#fff8e8',
    fontSize: 17,
    fontWeight: '800',
    marginTop: 3,
  },
  communityCards: {
    flexDirection: 'row',
    gap: 4,
    marginTop: 11,
  },
  seat: {
    alignItems: 'center',
    backgroundColor: '#0d2b21',
    borderColor: 'transparent',
    borderRadius: 14,
    borderWidth: 2,
    minWidth: 114,
    padding: 9,
  },
  activeSeat: {
    borderColor: '#f5c451',
  },
  foldedSeat: {
    opacity: 0.45,
  },
  seatNameRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 5,
  },
  seatName: {
    color: '#f7f3e8',
    fontSize: 13,
    fontWeight: '800',
  },
  dealer: {
    backgroundColor: '#f7f3e8',
    borderRadius: 8,
    color: '#081c15',
    fontSize: 9,
    fontWeight: '900',
    overflow: 'hidden',
    paddingHorizontal: 4,
    paddingVertical: 1,
  },
  stack: {
    color: '#a8bdb4',
    fontSize: 11,
    marginTop: 2,
  },
  holeCards: {
    flexDirection: 'row',
    gap: 3,
    marginTop: 6,
  },
  bet: {
    color: '#f5c451',
    fontSize: 10,
    fontWeight: '700',
    marginTop: 4,
  },
  card: {
    alignItems: 'center',
    backgroundColor: '#fff',
    borderColor: '#ddd7c9',
    borderRadius: 6,
    borderWidth: 1,
    height: 62,
    justifyContent: 'center',
    width: 43,
  },
  compactCard: {
    height: 45,
    width: 31,
  },
  cardText: {
    color: '#101b17',
    fontSize: 14,
    fontWeight: '800',
  },
  redCard: {
    color: '#d62828',
  },
  cardBack: {
    backgroundColor: '#b51f2e',
    borderColor: '#f1c8c8',
    borderWidth: 2,
  },
  emptyCard: {
    backgroundColor: 'rgba(8, 28, 21, 0.22)',
    borderColor: 'rgba(255, 255, 255, 0.18)',
  },
  controls: {
    marginTop: 17,
  },
  turnMessage: {
    color: '#a8bdb4',
    fontSize: 13,
    marginBottom: 9,
    textAlign: 'center',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    alignItems: 'center',
    borderRadius: 12,
    flex: 1,
    justifyContent: 'center',
    minHeight: 49,
    paddingHorizontal: 7,
  },
  lightButton: {
    backgroundColor: '#f7f3e8',
  },
  mutedButton: {
    backgroundColor: '#40534a',
  },
  redButton: {
    backgroundColor: '#d62828',
  },
  actionText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '800',
  },
  darkActionText: {
    color: '#081c15',
  },
  disabled: {
    opacity: 0.35,
  },
  pressed: {
    opacity: 0.75,
  },
  resultCard: {
    alignItems: 'center',
    backgroundColor: '#123c2e',
    borderRadius: 16,
    marginTop: 17,
    padding: 16,
  },
  result: {
    color: '#f7f3e8',
    fontSize: 17,
    fontWeight: '800',
  },
  nextHandButton: {
    backgroundColor: '#d62828',
    borderRadius: 11,
    marginTop: 12,
    paddingHorizontal: 22,
    paddingVertical: 12,
  },
  nextHandText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '800',
  },
});
