import { Response } from '../api/base';
import { Card, Color, GameState, IAutoPlayRequest, IInitializeRequest, IJoinGameRequest, INextRoundRequest, IPlayCardRequest, ISetTrumpColorRequest, IStartGameRequest, ISubmitGuessRequest, Nickname, PlayedCard, PlayerState, RoundPoints, TotalPoints, UserId } from '../api/types';
import { Context, Methods } from './.hathora/methods';
import { transitionTo } from './GameStateMachine';
import { amountOfCards, findHand, formatCard } from './util';

export type InternalState = {
	deck: Card[],
	hands: {
		userId: UserId,
		cards: Card[],
	}[],
	guesses: Record<UserId, number>,
	gameState: GameState,
	turnIdx: number,
	round: number,
	trump: {
		card: Card,
		trumpColor: Color | undefined,
	} | undefined,
	playedCards: PlayedCard[],
	pointsPerRound: Record<Nickname, number>[],
	totalPoints: Record<Nickname, number>,
	winsThisRound: Record<Nickname, number>,
	started: boolean,
	nicknames: Map<UserId, Nickname>;
	highestPlayedCard: PlayedCard | undefined,
};

export class Impl
	implements Methods<InternalState> {

	public initialize (
		ctx: Context,
		request: IInitializeRequest,
	): InternalState {
		return {
			deck: [],
			hands: [],
			playedCards: [],
			turnIdx: 0,
			round: 1,
			pointsPerRound: [],
			totalPoints: {},
			guesses: {},
			gameState: GameState.LOBBY,
			winsThisRound: {},
			started: false,
			trump: undefined,
			nicknames: new Map<UserId, Nickname>(),
			highestPlayedCard: undefined,
		};
	}

	public joinGame (
		state: InternalState,
		userId: UserId,
		ctx: Context,
		request: IJoinGameRequest,
	): Response {
		if (state.started) {
			return Response.error(
				'Game has already started!',
			);
		}

		if (state.hands.length === 6) {
			return Response.error(
				'A maximum of 6 players is allowed',
			);
		}

		state.nicknames.set(
			userId,
			request.nickname,
		);

		state.hands.push({
			userId,
			cards: [],
		});

		return Response.ok();
	}

	public startGame (
		state: InternalState,
		userId: UserId,
		ctx: Context,
		request: IStartGameRequest,
	): Response {
		if (state.started) {
			return Response.error(
				'Game has already started!',
			);
		}

		if (state.hands.length < 3) {
			return Response.error(
				'A minimum of 3 players is required',
			);
		}

		return transitionTo(
			GameState.GUESS,
			state,
			ctx,
			userId,
		);
	}

	public setTrumpColor (
		state: InternalState,
		userId: UserId,
		ctx: Context,
		request: ISetTrumpColorRequest,
	): Response {
		if (state.gameState !== GameState.ASK_TRUMP) {
			return Response.error(
				'Game is not in ASK_TRUMP state',
			);
		}

		if (state.trump === undefined) {
			return Response.error(
				'Tried to set trump color but there\'s no trump',
			);
		}

		state.trump.trumpColor = request.color;

		return transitionTo(
			GameState.GUESS,
			state,
			ctx,
			userId,
		);
	}

	public submitGuess (
		state: InternalState,
		userId: UserId,
		ctx: Context,
		request: ISubmitGuessRequest,
	): Response {
		if (state.gameState !== GameState.GUESS) {
			return Response.error(
				'Cannot submit a guess while in PLAY game state',
			);
		}

		if (request.count < 0) {
			return Response.error(
				'Guess has to be 0 or higher',
			);
		}

		const hand = findHand(
			state,
			userId,
		);

		if (request.count > hand.length) {
			return Response.error(
				'Cannot guess more than you have cards',
			);
		}

		if (
			// If the last user is guessing there's a special rule called the "Plus/minus 1 rule"
			Object.keys(
				state.guesses,
			).length == state.hands.length - 1
		) {
			let guessedSoFar = 0;

			for (const userId in state.guesses) {
				guessedSoFar += state.guesses[userId];
			}

			if (guessedSoFar + request.count === hand.length) {
				return Response.error(
					'Last user cannot end with the total amount of cards making everyone "happy"',
				);
			}
		}

		console.log(
			`${userId} guessed ${request.count}`,
		);

		state.guesses[userId] = request.count;
		state.turnIdx = (state.turnIdx + 1) % state.hands.length;

		if (
			!state.hands.every(
				hand => state.guesses[hand.userId] !== undefined,
			)
		) {
			return Response.ok();
		}

		return transitionTo(
			GameState.PLAY,
			state,
			ctx,
			userId,
		);
	}

	public playCard (
		state: InternalState,
		userId: UserId,
		ctx: Context,
		request: IPlayCardRequest,
	): Response {
		if (state.gameState !== GameState.PLAY) {
			return Response.error(
				'Cannot play a care while in GUESS game state',
			);
		}

		const turnData = state.hands[state.turnIdx];
		const cards = turnData.cards;
		const handUserId = turnData.userId;

		if (userId !== handUserId) {
			return Response.error(
				`It's not your turn! Your ID ${userId}, turn ID ${handUserId}`,
			);
		}

		const cardIdx = cards.findIndex(
			card => {
				if (card.value !== request.card.value) {
					return false;
				}

				if (request.card.specialType) {
					return card.specialType !== undefined
						&& card.specialType === request.card.specialType;
				}

				return card.color == request.card.color;
			},
		);

		if (cardIdx < 0) {
			const formattedHand = cards
				.map(
					card => formatCard(
						card,
					),
				)
				.join(
					', ',
				);

			const formattedCard = formatCard(
				request.card,
			);

			return Response.error(
				`Card not in hand. Got: ${formattedCard}, but hand has ${formattedHand}`,
			);
		}

		const firstPlayedNonSpecial = state.playedCards.find(
			card => card.card.specialType === undefined,
		);

		if (
			// If there was already a card played
			firstPlayedNonSpecial !== undefined
			// And the player is not playing a special card
			&& request.card.specialType === undefined
		) {
			// Then we validate if the color matches
			if (request.card.color !== firstPlayedNonSpecial.card.color) {
				const hasRequiredCardInHand = turnData.cards.some(
					card => card.color === firstPlayedNonSpecial.card.color,
				);

				if (hasRequiredCardInHand) {
					return Response.error(
						'You must play the same color card as the first played one, or a special type card.',
					);
				}
			}
		}

		cards.splice(
			cardIdx,
			1,
		);

		state.playedCards.push(
			{
				nickname: state.nicknames.get(
					userId,
				)!,
				card: request.card,
			},
		);

		// Turns are independent of rounds because the user who wins the round gets to play
		state.turnIdx = (state.turnIdx + 1) % state.hands.length;

		const formattedCard = formatCard(
			request.card,
		);

		console.log(
			`Card ${formattedCard} played by ${userId},`,
		);

		console.log(
			`${state.playedCards.length}/${state.hands.length} cards played`,
		);

		if (state.playedCards.length === state.hands.length) {
			return transitionTo(
				GameState.BATTLE_DONE,
				state,
				ctx,
				userId,
			);
		}

		return Response.ok();
	}

	public nextRound (
		state: InternalState,
		userId: UserId,
		ctx: Context,
		request: INextRoundRequest,
	): Response {
		if (state.gameState === GameState.BATTLE_DONE) {
			return transitionTo(
				GameState.PLAY,
				state,
				ctx,
				userId,
			);
		}

		if (state.gameState === GameState.ROUND_DONE) {
			const cardsNeededForNextRound = ((state.round + 1) * state.hands.length);

			if (cardsNeededForNextRound > amountOfCards) {
				return transitionTo(
					GameState.WINNER,
					state,
					ctx,
					userId,
				);
			}

			console.log(
				'Starting next round',
			);

			state.round++;
			// Dealer moves to the next person
			state.turnIdx = state.round % state.hands.length;

			return transitionTo(
				GameState.GUESS,
				state,
				ctx,
				userId,
			);
		}

		return Response.error(
			'Round is not done yet',
		);
	}

	public autoPlay (
		state: InternalState,
		userId: UserId,
		ctx: Context,
		request: IAutoPlayRequest,
	): Response {
		userId = state.hands[state.turnIdx].userId;

		if (state.gameState === GameState.ASK_TRUMP) {
			return this.setTrumpColor(
				state,
				userId,
				ctx,
				{
					color: Color.RED,
				},
			);
		}

		if (
			state.gameState === GameState.ROUND_DONE
			|| state.gameState === GameState.BATTLE_DONE
		) {
			return this.nextRound(
				state,
				userId,
				ctx,
				{},
			);
		}

		if (state.gameState === GameState.GUESS) {
			return this.submitGuess(
				state,
				userId,
				ctx,
				{
					count: state.round,
				},
			);
		}

		const hand = state.hands[state.turnIdx];
		let card: Card | undefined = undefined;

		if (state.playedCards.length === 0) {
			card = hand.cards[0];
		} else {
			const firstPlayedNonSpecialCard = state.playedCards.find(
				_card => _card.card.specialType === undefined,
			);

			console.log(
				'Autopicking card',
			);

			for (const _card of hand.cards) {
				console.log(
					`comparing ${formatCard(_card)} to ${formatCard(state.playedCards[0].card)}`,
				);

				if (_card.specialType) {
					card = _card;

					break;
				}

				if (
					firstPlayedNonSpecialCard === undefined
					|| _card.color === firstPlayedNonSpecialCard.card.color
				) {
					card = _card;

					break;
				}
			}

			if (card === undefined) {
				card = hand.cards[0];
			}
		}

		return this.playCard(
			state,
			userId,
			ctx,
			{
				card: card!,
			},
		);
	}

	public getUserState (
		state: InternalState,
		userId: UserId,
	): PlayerState {
		const totalPoints: TotalPoints[] = [];
		const pointsPerRound: RoundPoints[][] = [];

		for (const pointsInRound of state.pointsPerRound) {
			const res: RoundPoints[] = [];

			for (const userId in pointsInRound) {
				res.push(
					{
						nickname: state.nicknames.get(
							userId,
						)!,
						points: pointsInRound[userId] ?? 0,
					},
				);
			}

			pointsPerRound.push(
				res,
			);
		}

		for (const userId in state.totalPoints) {
			totalPoints.push(
				{
					nickname: state.nicknames.get(
						userId,
					)!,
					points: state.totalPoints[userId] ?? 0,
				},
			);
		}

		return {
			// Current users' hand
			hand: findHand(
				state,
				userId,
			),
			// All players
			players: state.hands.map(
				hand => ({
					id: hand.userId,
					nickname: state.nicknames.get(
						hand.userId,
					) ?? 'No nickname',
				}),
			),
			// Who's turn it is
			turn: state.hands[state.turnIdx]?.userId,
			winners: this.getWinners(
				state,
			),
			trump: state.trump,
			playedCards: state.playedCards,
			gameState: state.gameState,
			totalPoints,
			pointsPerRound,
			round: state.round,
			guesses: Object
				.entries(
					state.guesses,
				)
				.map(
					guess => ({
						nickname: state.nicknames.get(
							guess[0],
						)!,
						guess: guess[1],
					}),
				),
			winsThisRound: Object
				.entries(
					state.winsThisRound,
				)
				.map(
					win => ({
						nickname: win[0],
						points: win[1],
					}),
				),
			nickname: state.nicknames.get(
				userId,
			) ?? 'No nickname',
			highestPlayedCard: state.highestPlayedCard ?? undefined,
		};
	}

	private getWinners (
		state: InternalState,
	): string[] {
		if (state.gameState !== GameState.WINNER) {
			return [];
		}

		const highestPoints: {
			id: UserId,
			points: number,
		}[] = [];

		for (const userId in state.totalPoints) {
			if (
				highestPoints.length === 0
				|| highestPoints[0].points <= state.totalPoints[userId]
			) {
				highestPoints.push(
					{
						id: userId,
						points: state.totalPoints[userId],
					},
				);
			}
		}

		return highestPoints.map(
			obj => state.nicknames.get(
				obj.id,
			)!,
		);
	}

}
