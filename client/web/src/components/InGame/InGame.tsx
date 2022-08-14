import React from 'react';
import { GameState, Player, PlayerState } from '../../../../../api/types';
import { HathoraConnection } from '../../../../.hathora/client';
import ScoreBoard from '../Scoreboard';
import Cards from './Cards';
import Guess from './Guess';
import './ingame.css';

interface IInGameProps {
	playerState: PlayerState,
	client: HathoraConnection,
	currentPlayerInfo: Player,
	activePlayerInfo: Player,
	debugMode: boolean,
}

interface IInGameState {
}

export default class InGame
	extends React.Component<IInGameProps, IInGameState> {

	public render () {
		const {
			client,
			playerState,
			currentPlayerInfo,
			activePlayerInfo,
		} = this.props;

		playerState.guesses.sort(
			(
				a,
				b,
			) => a.nickname.localeCompare(
				b.nickname,
			),
		);

		const isYourTurn = activePlayerInfo.id === currentPlayerInfo.id;

		console.log(
			playerState,
		);

		console.log(
			`Game state is ${GameState[playerState.gameState]}`,
		);

		return (
			<div className={'ingame'}>
				<div className="ingame__container">
					<div className={'ingame__header'}>
						<div className={'ingame__header-round'}>
							<span className="label">
								Round: {playerState.round}/{this.getTotalRounds(playerState.players.length)}
							</span>
						</div>
						<div className={'ingame__header-guesses'}>
							<span className="label">
								Total guessed: {this.getTotalGuessed(playerState.guesses)}/{playerState.round}
							</span>
							<br/>
							<ul className={'ingame__guess-list'}>
								{playerState.guesses.map(
									guess => <li
										key={`guess-${guess.nickname}`}
										className={
											guess.nickname === currentPlayerInfo.nickname
												? 'ingame__header-guess label ingame__header-guess--current-player'
												: 'ingame__header-guess label'
										}>

										{guess.nickname}: {guess.guess} {guess.nickname === currentPlayerInfo.nickname && ('(you)')}
									</li>,
								)}
							</ul>
						</div>
					</div>

					<div className={'ingame__trump-cards'}>
						{playerState.trump.length > 0
							? (
								<>
									<span className="label">
										Trump cards (only last one counts)
									</span>

									<Cards
										active={false}
										client={client}
										cards={playerState.trump}/>
								</>
							)
							: (
								<div>
									No trump card this round
								</div>
							)
						}
					</div>

					{
						playerState.playedCards.length > 0
						&& (
							<div className={'ingame__played-cards'}>
								<span className="label">
									Played cards:
								</span>

								<Cards
									active={false}
									client={client}
									cards={playerState.playedCards}
									sort={false}
									showName={true}
									highlight={playerState.highestPlayedCard?.card}/>
							</div>
						)
					}

					{playerState.hand.length > 0 && (
						<div className={'ingame__your-cards'}>
							<span className="label">
								Your cards:
							</span>

							<Cards
								active={playerState.gameState === GameState.PLAY && activePlayerInfo.id === currentPlayerInfo.id}
								cards={playerState.hand}
								client={client}
								sort={true}/>
						</div>
					)}

					{this.props.debugMode && (
						<button
							onClick={() => this.autoPlay()}
							className={'ingame__autoplay-button'}>

							Autoplay
						</button>
					)}

					{playerState.gameState === GameState.GUESS && (
						<div className={'ingame__guess'}>
							<Guess
								playerState={playerState}
								currentPlayerInfo={currentPlayerInfo}
								activePlayerInfo={activePlayerInfo}
								client={client}/>
						</div>
					)}

					{playerState.gameState === GameState.BATTLE_DONE && (
						<div className={'ingame__round-done'}>
							<span className="label">
								Battle is done. Winner is <b>{playerState.highestPlayedCard?.nickname}</b>
							</span>

							<button
								className="ingame__next-round-button button"
								onClick={() => this.startNextRound()}>

								Next battle
							</button>
						</div>
					)}

					{playerState.gameState === GameState.ROUND_DONE && (
						<div className={'ingame__round-done'}>
							<span className="label">
								Round is done.
							</span>

							<button
								className="ingame__next-round-button button"
								onClick={() => this.startNextRound()}>

								Next round
							</button>
						</div>
					)}

					{(
						playerState.gameState === GameState.GUESS
						|| playerState.gameState === GameState.PLAY
					) && (
						<div className={`ingame__current-player ${isYourTurn ? 'ingame__current-player--you' : ''}`}>
							{isYourTurn
								? (
									<p>
										It's your turn!
									</p>
								) : (
									<p>
										Player <b>{activePlayerInfo.nickname}</b> is playing...
									</p>
								)}
						</div>
					)}
				</div>

				<div className={'ingame__score-board-container'}>
					<div className="ingame__score-board">
						<ScoreBoard
							playerState={playerState}/>
					</div>
				</div>
			</div>
		);
	}

	private getTotalGuessed (
		guesses: PlayerState['guesses'],
	): number {
		return guesses.reduce(
			(
				total,
				guess,
			) => total + guess.guess,
			0,
		);
	}

	private getTotalRounds (
		amountPlayers: number,
	): number {
		return 60 / amountPlayers;
	}

	private startNextRound (): void {
		this.props.client.nextRound({})
			.then(
				response => response.type === 'error' && alert(response.error),
			);
	}

	private autoPlay (): void {
		this.props.client.autoPlay({})
			.then(
				response => response.type === 'error' && alert(response.error),
			);
	}

}