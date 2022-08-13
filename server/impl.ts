import { Response } from '../api/base';
import { Card, Color, GameState, IAutoPlayRequest, IInitializeRequest, IJoinGameRequest, IPlayCardRequest, IStartGameRequest, ISubmitGuessRequest, PlayedCard, PlayerState, RoundPoints, SpecialType, TotalPoints, UserId } from '../api/types';
import { Context, Methods } from './.hathora/methods';

type InternalState = {
	deck: Card[],
	hands: {
		userId: UserId,
		cards: Card[],
	}[],
	guesses: Record<UserId, number>,
	gameState: GameState,
	turnIdx: number,
	round: number,
	trump: Card[],
	playedCards: PlayedCard[],
	pointsPerRound: Record<UserId, number>[],
	totalPoints: Record<UserId, number>,
	winsThisRound: Record<UserId, number>,
	started: boolean,
};

export class Impl
	implements Methods<InternalState> {

	private static createDeck (): Card[] {
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

	initialize (
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
			gameState: GameState.GUESS,
			winsThisRound: {},
			started: false,
			trump: [],
		};
	}

	joinGame (
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

		state.hands.push({
			userId,
			cards: [],
		});

		return Response.ok();
	}

	startGame (
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

		// Played left of the dealer starts first
		state.turnIdx = 1;

		// Skip to last round
		state.round = Impl.createDeck().length / state.hands.length;

		this.prepareDeck(
			state,
			ctx,
		);

		return Response.ok();
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

		const hand = this.findHand(
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
			state.hands.every(
				hand => state.guesses[hand.userId] !== undefined,
			)
		) {
			state.gameState = GameState.PLAY;

			console.log(
				`Everyone guessed! ${state.hands[state.turnIdx].userId} can start`,
			);
		}

		return Response.ok();
	}

	playCard (
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
				`It's not your turn!`,
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
					card => this.formatCard(
						card,
					),
				)
				.join(
					', ',
				);

			const formattedCard = this.formatCard(
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
				id: userId,
				card: request.card,
			},
		);

		// Turns are independent of rounds because the user who wins the round gets to play
		state.turnIdx = (state.turnIdx + 1) % state.hands.length;

		const formattedCard = this.formatCard(
			request.card,
		);

		console.log(
			`Card ${formattedCard} played by ${userId},`,
		);

		console.log(
			`${state.playedCards.length}/${state.hands.length} cards played`,
		);

		// If everyone played a card
		if (state.playedCards.length === state.hands.length) {
			this.determineWinner(
				state,
			);
		}

		if (
			// If everyone is out of cards the round is ended
			state.hands.every(
				hand => hand.cards.length === 0,
			)
		) {
			this.handleRoundEnd(
				state,
				ctx,
			);
		}

		return Response.ok();
	}

	public autoPlay (
		state: InternalState,
		userId: UserId,
		ctx: Context,
		request: IAutoPlayRequest,
	): Response {
		/**
		 * window.setInterval(() => {
		 * var xpath = "//label[text()='autoPlay']";
		 * var matchingElement = document.evaluate(xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
		 * matchingElement.parentElement.querySelector('button').click()
		 * }, 1000);
		 */
		if (userId !== state.hands[state.turnIdx].userId) {
			return Response.ok();
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
			console.log(
				'Autopicking card',
			);

			for (const _card of hand.cards) {
				console.log(
					`comparing ${this.formatCard(_card)} to ${this.formatCard(state.playedCards[0].card)}`,
				);

				if (_card.specialType) {
					card = _card;

					break;
				}

				if (_card.color === state.playedCards[0].card.color) {
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

	getUserState (
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
						id: userId,
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
					id: userId,
					points: state.totalPoints[userId] ?? 0,
				},
			);
		}

		return {
			// Current users' hand
			hand: this.findHand(
				state,
				userId,
			),
			// All players
			players: state.hands.map(
				hand => ({
					id: hand.userId,
				}),
			),
			// Who's turn it is
			turn: state.hands[state.turnIdx]?.userId,
			// todo If there's a winner
			winner: this.getWinners(
				state,
			),
			trump: state.trump,
			playedCards: state.playedCards,
			gameState: state.gameState,
			totalPoints,
			pointsPerRound,
			guesses: Object
				.entries(
					state.guesses,
				)
				.map(
					guess => ({
						id: guess[0],
						guess: guess[1],
					}),
				),
			winsThisRound: Object
				.entries(
					state.winsThisRound,
				)
				.map(
					win => ({
						id: win[0],
						points: win[1],
					}),
				),
		};
	}

	private getWinners (
		state: InternalState,
	): UserId[] | undefined {
		if (state.gameState !== GameState.WINNER) {
			return undefined;
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
			obj => obj.id,
		);
	}

	private findHand (
		state: InternalState,
		userId: UserId,
	): Card[] {
		return state.hands.find(
			hand => hand.userId === userId,
		)?.cards ?? [];
	}

	private prepareDeck (
		state: InternalState,
		ctx: Context,
	): void {
		state.playedCards = [];
		state.guesses = {};

		state.deck = ctx.chance.shuffle(
			Impl.createDeck(),
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

			const formattedCard = this.formatCard(
				nextTrump,
			);

			console.log(
				`Picked trump card ${formattedCard} so picking another one`,
			);
		}

		state.gameState = GameState.GUESS;

		console.log(
			`${state.hands[state.turnIdx].userId} can start with guessing`,
		);
	}

	private handleRoundEnd (
		state: InternalState,
		ctx: Context,
	): void {
		const pointsThisRound: Record<UserId, number> = state.pointsPerRound[state.round - 1] = {};

		for (const hand of state.hands) {
			const userId = hand.userId as UserId;

			const guessed = state.guesses[userId];
			const won = state.winsThisRound[userId] ?? 0;

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

		state.winsThisRound = {};
		state.round++;
		// Dealer moves to the next person
		state.turnIdx = state.round % state.hands.length;

		if (state.round * state.hands.length > Impl.createDeck().length) {
			state.gameState = GameState.WINNER;

			return;
		}

		console.log(
			'-------------- NEXT ROUND ----------------',
		);

		// And reset the table
		this.prepareDeck(
			state,
			ctx,
		);
	}

	private determineWinner (
		state: InternalState,
	): void {
		let highestPlayedCard: PlayedCard = state.playedCards[0];
		const trump = state.trump[state.trump.length - 1];

		if (highestPlayedCard.card.specialType !== SpecialType.WIZARD) {
			for (let i = 1; i < state.playedCards.length; i++) {
				const playedCard = state.playedCards[i];
				const formattedCard = this.formatCard(
					playedCard.card,
				);

				if (playedCard.card.specialType === SpecialType.JOKER) {
					console.log(
						`Card ${formattedCard} played by ${playedCard.id} is a Joker, skipping`,
					);

					continue;
				}

				if (playedCard.card.specialType === SpecialType.WIZARD) {
					console.log(
						`Card ${formattedCard} played by ${playedCard.id} is a Wizard, breaking out`,
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
					const oldFormattedCard = this.formatCard(
						highestPlayedCard.card,
					);

					console.log(
						`Highest card went from ${oldFormattedCard} to ${formattedCard}`,
					);

					highestPlayedCard = playedCard;
				}
			}
		}

		state.winsThisRound[highestPlayedCard.id] ??= 0;
		state.winsThisRound[highestPlayedCard.id] += 1;

		const formattedCard = this.formatCard(
			highestPlayedCard.card,
		);

		const winsByUser = state.winsThisRound[highestPlayedCard.id];

		console.log(
			`The highest played card was ${formattedCard} by user ${highestPlayedCard.id}. He now has ${winsByUser} wins`,
		);

		const winPlayerIndex = state.hands.findIndex(
			hand => hand.userId === highestPlayedCard.id,
		) ?? 0;

		state.turnIdx = winPlayerIndex;
		state.playedCards = [];
	}

	private formatCard (
		card: Card,
	): string {
		// @ts-ignore
		return `${Color[card.color] ?? SpecialType[card.specialType]}-${card.value}`;
	}

}
