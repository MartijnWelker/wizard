import React from 'react';
import { UserData } from '../../../../../api/base';
import { Color, GameState, Player, PlayerState, UserId } from '../../../../../api/types';
import { HathoraConnection } from '../../../../.hathora/client';
import ScoreBoard from '../Scoreboard';
import { AskTrump } from './AskTrump';
import Cards from './Cards';
import { ClosedCards } from './ClosedCards';
import Guess from './Guess';
import './ingame.css';

interface IInGameProps {
	playerState: PlayerState,
	client: HathoraConnection,
	debugMode: boolean,
	user: UserData,
}

interface IInGameState {
}

export default class InGame
	extends React.Component<IInGameProps, IInGameState> {

	public render () {
		const {
			client,
			playerState,
			user,
		} = this.props;

		// There's no current player when you're spectating
		let currentPlayerInfo: Player | undefined = undefined;
		let activePlayerInfo!: Player;
		let currentPlayerIndex: number = 0;
		let otherPlayers: Player[] = [];

		const nicknameMap: Record<UserId, string> = {};

		for (let i = 0; i < playerState.players.length; i++) {
			const player = playerState.players[i];

			nicknameMap[player.id] = player.nickname;

			if (player.id === user.id) {
				currentPlayerInfo = player;
				currentPlayerIndex = i;
			}
		}

		for (let i = 0; i < playerState.players.length; i++) {
			const player = playerState.players[(i + currentPlayerIndex) % playerState.players.length];

			if (player.id === playerState.turn) {
				activePlayerInfo = player;
			}

			if (currentPlayerInfo && player.id === currentPlayerInfo.id) {
				continue;
			}

			otherPlayers.push(
				player,
			);
		}

		const isYourTurn = currentPlayerInfo !== undefined && activePlayerInfo.id === currentPlayerInfo.id;
		const canPlay = playerState.gameState === GameState.PLAY && isYourTurn;
		const isRoomCreator = currentPlayerInfo !== undefined && playerState.roomCreatorUserId === currentPlayerInfo.id;

		console.log(
			'Current player',
			currentPlayerInfo,
		);

		console.log(
			'Player state',
			playerState,
		);

		return (
			<div
				className={`ingame ${
					playerState.players.length <= 3
						? 'ingame--low-players'
						: ''
				}`}>

				<div className="ingame__container">
					{!currentPlayerInfo && (
						<div className="label ingame__spectator-warning">
							You are currently spectating...
						</div>
					)}

					<div className={'ingame__stats-container'}>
						{playerState.trump !== undefined
							? (
								<>
									<div className="ingame__trump-card-card">
										<span className="label ingame__trump-card-card-label">
											Trump card:
										</span>

										<Cards
											active={false}
											client={client}
											cards={[playerState.trump.card!]}/>
									</div>

									<div className="ingame__trump-card-color">
										{
											playerState.trump.card &&
											playerState.trump.trumpColor !== undefined
												? playerState.trump.card.specialType !== undefined && (

												<span className="label">
													Trump color: <span className="ingame__trump-card-color-label">{Color[playerState.trump.trumpColor]}</span>
												</span>
											)
												: (
													<span className="label ingame__trump-color">
														No trump color this round
													</span>
												)
										}
									</div>
								</>
							)
							: (
								<span className="label">
									No trump card this round
								</span>
							)
						}
					</div>

					{playerState.playedCards.length > 0 && (
						<div className={'ingame__played-cards'}>
							<div className="ingame__played-cards-list">
								<Cards
									active={false}
									rotate={true}
									client={client}
									cards={playerState.playedCards}
									sort={false}
									showName={true}
									highlight={playerState.highestPlayedCard?.card}/>
							</div>
						</div>
					)}

					{otherPlayers.map(
						(
							otherPlayer,
							index,
						) => {
							const isDealer = otherPlayer.id === playerState.dealerUserId;
							const isCurrentlyPlaying = otherPlayer.id === activePlayerInfo.id;

							return <div
								key={'player-' + index}
								className={`ingame__player ingame__player--${index + 2}`}>

								<div className="ingame__player-hand">
									<ClosedCards
										count={otherPlayer.cardCount}/>
								</div>

								<span className="label ingame__player-nickname">
									{otherPlayer.nickname}

									{isDealer && (
										<span className="ingame__player-dealer-label"> (Dealer)</span>
									)}

									{isCurrentlyPlaying && (
										<span className="ingame__player-currently-playing-label"> (Currently playing)</span>
									)}
								</span>
							</div>;
						},
					)}

					{playerState.hand.length > 0 && (
						<div className={`ingame__your-cards ${canPlay ? 'ingame__your-cards--can-play' : ''}`}>
							<span className="label ingame__your-cards-label">
								Your hand

								{currentPlayerInfo && playerState.dealerUserId === currentPlayerInfo.id && (
									<span> (You are the dealer)</span>
								)}

								{canPlay && (
									<p className="ingame__your-cards-tap-to-play-label">tap to play...</p>
								)}
							</span>

							<Cards
								active={canPlay}
								cards={playerState.hand}
								client={client}
								sort={true}/>
						</div>
					)}

					<div className={`ingame__score-board-container`}>
						<div className={'ingame__round-container'}>
							<span className="label">
								Round: {playerState.round}/{this.getTotalRounds(playerState.players.length)}
							</span>
						</div>
						<div className={'ingame__guesses-container'}>
							<span className="label ingame__header-total-guessed">
								Total guessed: {this.getTotalGuessed(playerState.guesses)}/{playerState.round}
							</span>
							<ul className={'ingame__guess-list'}>
								{playerState.guesses.map(
									guess => <li
										key={`guess-${guess.userId}`}
										className={
											guess.userId === currentPlayerInfo?.id
												? 'ingame__header-guess label ingame__header-guess--current-player'
												: 'ingame__header-guess label'
										}>

										{nicknameMap[guess.userId]}: {guess.guess} {currentPlayerInfo && guess.userId === currentPlayerInfo.id && ('(you)')}
									</li>,
								)}
							</ul>
						</div>

						<span className="ingame__score-board-button label">
							Hover for scores
						</span>

						<div className="ingame__score-board">
							<ScoreBoard
								playerState={playerState}/>
						</div>
					</div>
				</div>

				{this.props.debugMode && (
					<button
						onClick={() => this.autoPlay()}
						className={'ingame__autoplay-button'}>

						Autoplay
					</button>
				)}

				{playerState.gameState === GameState.GUESS &&
					currentPlayerInfo && (
						<div className="ingame__modal">
							<div className={'ingame__guess'}>
								{isYourTurn
									? (
										<Guess
											playerState={playerState}
											currentPlayerInfo={currentPlayerInfo}
											activePlayerInfo={activePlayerInfo}
											client={client}
											nicknameMap={nicknameMap}/>
									)
									: (
										<div className="ui-card ui-card--no-height">
											{activePlayerInfo.nickname} is guessing
										</div>
									)}
							</div>
						</div>
					)}

				{
					playerState.gameState === GameState.ASK_TRUMP &&
					currentPlayerInfo &&
					activePlayerInfo.id === currentPlayerInfo.id && (
						<div className="ingame__modal">
							<div className={'ingame__guess'}>
								<AskTrump
									playerState={playerState}
									client={client}/>
							</div>
						</div>
					)}

				{(playerState.gameState === GameState.BATTLE_DONE || playerState.gameState === GameState.ROUND_DONE) &&
					currentPlayerInfo && (
						<div className="ingame__modal">
							<div className={'ui-card'}>
								<span className="label">
									Battle is done. Winner is <b>{playerState.highestPlayedCard?.nickname}</b>
								</span>

								{
									isRoomCreator
										? (
											<button
												className="ingame__next-round-button button"
												onClick={() => this.startNextRound()}>

												Next round
											</button>
										)
										: (
											<span>
												Waiting for host...
											</span>
										)
								}
							</div>
						</div>
					)}
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
