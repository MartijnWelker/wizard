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

		return (
			<div className={'ingame'}>
				<div className={'ingame__header'}>
					<div className={'ingame__header-round'}>
						Round: {playerState.round}/{this.getTotalRounds(playerState.players.length)}
					</div>
					<div className={'ingame__header-guess'}>
						Total guessed: {this.getTotalGuessed(playerState.guesses)}/{playerState.round}
						<br/>
						<ul>
							{playerState.guesses.map(
								guess => <li
									key={`guess-${guess.nickname}`}
									className={
										guess.nickname === currentPlayerInfo.nickname
											? 'ingame__header-current-player-guess'
											: ''
									}>

									{guess.nickname}: {guess.guess}
								</li>,
							)}
						</ul>
					</div>
				</div>

				<div className={'ingame__trump-cards'}>
					{playerState.trump.length > 0
						? (
							<>
								<div>
									Trump cards (only last one counts)
								</div>

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
							Played cards:

							<Cards
								active={false}
								client={client}
								cards={playerState.playedCards.map(
									playedCard => playedCard.card,
								)}
								sort={true}/>
						</div>
					)
				}

				{playerState.hand.length > 0 && (
					<div className={'ingame__your-cards'}>
						Your cards:

						<Cards
							active={playerState.gameState === GameState.PLAY && activePlayerInfo.id === currentPlayerInfo.id}
							cards={playerState.hand}
							client={client}
							sort={true}/>
					</div>
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

				<div className={'ingame__score-board'}>
					<ScoreBoard
						playerState={playerState}/>
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

}