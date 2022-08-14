import { Response } from '../api/base';
import { GameState, UserId } from '../api/types';
import { Context } from './.hathora/methods';
import { InternalState } from './impl';
import { countPoints, createDeck, formatCard, getHighestPlayedCard } from './util';

type TransitionFn<T> = (
	state: InternalState,
	ctx: Context,
	userId: UserId,
) => T;

type State = {
	nextStates: GameState[],
	onEnter: TransitionFn<Response>,
	onExit: TransitionFn<any>,
}

const noop = () => {
};

const states: Record<GameState, State> = {
	[GameState.LOBBY]: {
		nextStates: [
			GameState.GUESS,
		],
		onEnter: () => Response.ok(),
		onExit: (
			state: InternalState,
		) => {
			// Played left of the dealer starts first
			state.turnIdx = 1;
		},
	},
	[GameState.GUESS]: {
		nextStates: [
			GameState.PLAY,
		],
		onEnter: (
			state: InternalState,
			ctx: Context,
		) => {
			state.winsThisRound = {};
			state.playedCards = [];
			state.guesses = {};

			state.deck = ctx.chance.shuffle(
				createDeck(),
			);

			for (let i = 0; i < state.hands.length; i++) {
				// Every round the first hand shifts 1 position
				const hand = state.hands[(state.turnIdx + i) % state.hands.length];

				for (let i = 0; i < state.round; i++) {
					hand.cards.push(
						state.deck.pop()!,
					);
				}
			}

			state.trump = [];

			// Todo: The rules state that when a JOKER is picked the round is played without a trump card
			// and when a WIZARD is picked the first player gets to decide
			// For now we just programmed it like we usually play
			while (true) {
				const nextTrump = state.deck.pop();

				if (nextTrump === undefined) {
					break;
				}

				state.trump.push(
					nextTrump,
				);

				if (nextTrump.specialType === undefined) {
					break;
				}

				const formattedCard = formatCard(
					nextTrump,
				);

				console.log(
					`Picked trump card ${formattedCard} so picking another one`,
				);
			}

			console.log(
				`${state.hands[state.turnIdx].userId} can start with guessing`,
			);

			return Response.ok();
		},
		onExit: (
			state: InternalState,
		) => {
			console.log(
				`Everyone guessed! ${state.hands[state.turnIdx].userId} can start`,
			);
		},
	},
	[GameState.PLAY]: {
		nextStates: [
			GameState.BATTLE_DONE,
		],
		onEnter: (
			state: InternalState,
		) => {
			console.log(
				'Starting next battle',
			);

			state.playedCards = [];
			state.highestPlayedCard = undefined;

			return Response.ok();
		},
		onExit: noop,
	},
	[GameState.BATTLE_DONE]: {
		nextStates: [
			GameState.PLAY,
			GameState.ROUND_DONE,
		],
		onEnter: (
			state: InternalState,
			ctx: Context,
			userId: UserId,
		) => {
			console.log(
				'Everyone played a card!',
			);

			const highestPlayedCard = getHighestPlayedCard(
				state,
			);

			state.winsThisRound[highestPlayedCard.nickname] ??= 0;
			state.winsThisRound[highestPlayedCard.nickname] += 1;

			const formattedCard = formatCard(
				highestPlayedCard.card,
			);

			const winsByUser = state.winsThisRound[highestPlayedCard.nickname];

			console.log(
				`The highest played card was ${formattedCard} by user ${highestPlayedCard.nickname}. He now has ${winsByUser} wins`,
			);

			state.turnIdx = state.hands.findIndex(
				hand => state.nicknames.get(hand.userId)! === highestPlayedCard.nickname,
			) ?? 0;

			state.highestPlayedCard = highestPlayedCard;

			if (
				!state.hands.every(
					hand => hand.cards.length === 0,
				)
			) {
				return Response.ok();
			}

			return transitionTo(
				GameState.ROUND_DONE,
				state,
				ctx,
				userId,
			);
		},
		onExit: noop,
	},
	[GameState.ROUND_DONE]: {
		nextStates: [
			GameState.GUESS,
			GameState.WINNER,
		],
		onEnter: (
			state: InternalState,
		) => {
			countPoints(
				state,
			);

			return Response.ok();
		},
		onExit: () => {
			console.log(
				'-------------- NEXT ROUND ----------------',
			);
		},
	},
	[GameState.WINNER]: {
		nextStates: [],
		onEnter: () => Response.ok(),
		onExit: noop,
	},
};

export function transitionTo (
	nextState: GameState,
	state: InternalState,
	ctx: Context,
	userId: UserId,
): Response {
	const currentState = state.gameState;
	const currStateObj = states[currentState];

	if (
		!currStateObj.nextStates.includes(
			nextState,
		)
	) {
		throw new Error(
			`Cannot transition from ${GameState[currentState]} to ${GameState[nextState]}`,
		);
	}

	const nextStateObj = states[nextState];

	currStateObj.onExit(
		state,
		ctx,
		userId,
	);

	state.gameState = nextState;

	return nextStateObj.onEnter(
		state,
		ctx,
		userId,
	);

}