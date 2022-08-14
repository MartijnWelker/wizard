import { Card, Color, PlayedCard, SpecialType, UserId } from '../api/types';
import { InternalState } from './impl';

export function formatCard (
	card: Card,
): string {
	// @ts-ignore
	return `${Color[card.color] ?? SpecialType[card.specialType]}-${card.value}`;
}

export function findHand (
	state: InternalState,
	userId: UserId,
): Card[] {
	return state.hands.find(
		hand => hand.userId === userId,
	)?.cards ?? [];
}

export function getHighestPlayedCard (
	state: InternalState,
): PlayedCard {
	let highestPlayedCard: PlayedCard = state.playedCards[0];
	const trump = state.trump[state.trump.length - 1];

	if (highestPlayedCard.card.specialType !== SpecialType.WIZARD) {
		for (let i = 1; i < state.playedCards.length; i++) {
			const playedCard = state.playedCards[i];
			const formattedCard = formatCard(
				playedCard.card,
			);

			if (playedCard.card.specialType === SpecialType.JOKER) {
				console.log(
					`Card ${formattedCard} played by ${playedCard.nickname} is a Joker, skipping`,
				);

				continue;
			}

			if (playedCard.card.specialType === SpecialType.WIZARD) {
				console.log(
					`Card ${formattedCard} played by ${playedCard.nickname} is a Wizard, breaking out`,
				);

				highestPlayedCard = playedCard;

				break;
			}

			if (
				highestPlayedCard.card.specialType === SpecialType.JOKER
				|| (
					// If the user has played a higher card of the same color as the earlier card
					playedCard.card.color === highestPlayedCard.card.color
					&& playedCard.card.value > highestPlayedCard.card.value
				)
				|| (
					trump !== undefined
					// Or the user has played a trump card
					&& playedCard.card.color === trump.color
					&& (
						highestPlayedCard.card.color !== trump.color
						|| playedCard.card.value > highestPlayedCard.card.value
					)
				)
			) {
				const oldFormattedCard = formatCard(
					highestPlayedCard.card,
				);

				console.log(
					`Highest card went from ${oldFormattedCard} to ${formattedCard}`,
				);

				highestPlayedCard = playedCard;
			}
		}
	}

	return highestPlayedCard;
}

export function countPoints (
	state: InternalState,
): void {
	const pointsThisRound: Record<UserId, number> = state.pointsPerRound[state.round - 1] = {};

	for (const hand of state.hands) {
		const userId = hand.userId as UserId;
		const nickname = state.nicknames.get(
			userId,
		)!;

		const guessed = state.guesses[userId];
		const won = state.winsThisRound[nickname] ?? 0;

		if (guessed === won) {
			const pointsDelta = 20 + (guessed * 10);

			console.log(
				`User ${userId} wins ${pointsDelta} points! Guessed ${guessed}`,
			);
			// 20 base points + 10 per correct guess
			pointsThisRound[userId] = 20 + (guessed * 10);
		} else {
			// Lose 10 points per wrong guess
			const wrongGuessCount = Math.abs(guessed - won);
			const pointsDelta = 0 - (wrongGuessCount * 10);

			console.log(
				`User ${userId} is losing ${pointsDelta} points! Guessed ${guessed} but won ${won}`,
			);

			pointsThisRound[userId] = pointsDelta;
		}

		state.totalPoints[userId] ??= 0;

		const oldPoints = state.totalPoints[userId];

		state.totalPoints[userId] += pointsThisRound[userId];

		console.log(
			`${userId} went from ${oldPoints} to ${state.totalPoints[userId]} points`,
		);
	}
}

const _deck = _createDeck();

export const amountOfCards = _deck.length;

export function createDeck (): Card[] {
	return _deck.slice();
}

function _createDeck (): Card[] {
	const deck: Card[] = [];

	for (let i = 1; i <= 13; i++) {
		deck.push({
			value: i,
			color: Color.BLUE,
		});
		deck.push({
			value: i,
			color: Color.RED,
		});
		deck.push({
			value: i,
			color: Color.GREEN,
		});
		deck.push({
			value: i,
			color: Color.YELLOW,
		});
	}

	for (let i = 0; i < 4; i++) {
		deck.push({
			value: i,
			specialType: SpecialType.WIZARD,
		});

		deck.push({
			value: i,
			specialType: SpecialType.JOKER,
		});
	}

	return deck;
}
