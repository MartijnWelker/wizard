import { Response } from '../api/base';
import { GameState, SpecialType, UserId } from '../api/types';
import { Context } from './.hathora/methods';
import { InternalState } from './impl';
import { countPoints, createDeck, formatCard, getHighestPlayedCard, getNextInt } from './util';

type TransitionFn<T> = (
	state: InternalState,
	ctx: Context,
	userId: UserId,
) => T;

type State = {
	nextStates: GameState[],
	onEnter: (
		state: InternalState,
		ctx: Context,
		userId: UserId,
		previousState: GameState,
	) => Response,
	onExit: (
		state: InternalState,
		nextState: GameState,
		ctx: Context,
		userId: UserId,
	) => any,
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
			console.log(
				'-------------- NEW GAME ----------------',
			);

			const dealerIndex = state.hands.findIndex(
				hand => hand.userId === state.dealerUserId,
			);

			state.turnIdx = (dealerIndex + 1) % state.hands.length;
		},
	},
	[GameState.GUESS]: {
		nextStates: [
			GameState.ASK_TRUMP,
			GameState.PLAY,
		],
		onEnter: (
			state: InternalState,
			ctx: Context,
			userId: UserId,
			previousState: GameState,
		) => {
			state.winsThisRound = {};
			state.playedCards = [];
			state.guesses = {};

			if (previousState !== GameState.ASK_TRUMP) {
				state.deck = ctx.chance.shuffle(
					createDeck(),
				);

				const dealerIndex = state.hands.findIndex(
					hand => hand.userId === state.dealerUserId!,
				);

				state.turnIdx = getNextInt(
					dealerIndex,
					state.hands.length,
				);
				
				for (let i = 0; i < state.round; i++) {
					for (let i = 0; i < state.hands.length; i++) {
						// Always start with the hand next to the dealer
						const hand = state.hands[(dealerIndex + 1 + i) % state.hands.length];

						hand.cards.push(
							state.deck.pop()!,
						);
					}
				}

				const trumpThisRound = state.deck.pop();

				if (trumpThisRound !== undefined) {
					state.trump = {
						card: trumpThisRound,
						trumpColor: trumpThisRound.color,
					};

					// If the card turned up is a Joker, it is turned down and there is no trump for that round.
					if (trumpThisRound.specialType === SpecialType.WIZARD) {
						// If the card turned up is a Wizard, the dealer chooses one of the four suits as the trump suit.
						return transitionTo(
							GameState.ASK_TRUMP,
							state,
							ctx,
							userId,
						);
					}
				} else {
					// On the last round of each game all cards are dealt out so there is no trump.
					state.trump = undefined;
				}
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

			state.winsThisRound[highestPlayedCard.userId] ??= 0;
			state.winsThisRound[highestPlayedCard.userId] += 1;

			const formattedCard = formatCard(
				highestPlayedCard.card,
			);

			const winsByUser = state.winsThisRound[highestPlayedCard.userId];

			console.log(
				`The highest played card was ${formattedCard} by user ${highestPlayedCard.userId}. He now has ${winsByUser} wins`,
			);

			state.turnIdx = state.hands.findIndex(
				hand => hand.userId === highestPlayedCard.userId,
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

			console.log(
				'Starting next round',
			);

			state.round++;

			const nextDealerIndex = getNextInt(
				state.hands.findIndex(
					hand => hand.userId === state.dealerUserId,
				),
				state.hands.length,
			);

			state.dealerUserId = state.hands[nextDealerIndex].userId;

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
	[GameState.ASK_TRUMP]: {
		nextStates: [
			GameState.GUESS,
		],
		onEnter: () => Response.ok(),
		onExit: (
			state: InternalState,
		) => {
			if (state.trump !== undefined && state.trump.trumpColor === undefined) {
				return Response.error(
					'Tried to leave "ASK_TRUMP" state but no trump color is set',
				);
			}

			return Response.ok();
		},
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
		nextState,
		ctx,
		userId,
	);

	state.gameState = nextState;

	return nextStateObj.onEnter(
		state,
		ctx,
		userId,
		currentState,
	);

}
