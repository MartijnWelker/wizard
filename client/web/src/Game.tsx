import { History } from 'history';
import React, { useEffect, useState } from 'react';
import { useHistory, useLocation } from 'react-router-dom';
import { GameState, PlayerState } from '../../../api/types';
import { HathoraClient, HathoraConnection } from '../../.hathora/client';
import Cards from './components/Cards';
import Guess from './components/Guess';
import Lobby from './components/Lobby';
import Play from './components/Play';
import ScoreBoard from './components/Scoreboard';
import Winner from './components/Winner';
import './game.css';

const client = new HathoraClient();

interface IGameProps {
}

function Game (props: IGameProps) {
	const [playerState, setPlayerState] = useState<PlayerState | undefined>(undefined);
	const [hathora, setHathora] = useState<HathoraConnection | undefined>(undefined);
	const [is404, setIs404] = useState<boolean>(false);
	const path = useLocation().pathname;
	const history = useHistory();

	useEffect(
		() => {
			if (hathora === undefined) {
				initConnection(
					path,
					history,
					setHathora,
					setPlayerState,
				)
					.catch((e) => {
						console.error(
							'Error connecting',
							e,
						);
						setIs404(true);
					});
			}
		},
		[path],
	);

	console.log(
		playerState,
	);

	if (playerState && hathora && !is404 && path !== '/game') {
		const currentPlayerInfo = playerState.players.find(
			player => player.nickname === playerState.nickname,
		)!;

		const activePlayerInfo = playerState.players.find(
			player => player.id === playerState.turn,
		)!;

		console.log(
			'Current player',
			currentPlayerInfo,
		);

		console.log(
			'Active player',
			activePlayerInfo,
		);

		return (
			<>
				<div
					className={'tussie--title-header'}
					style={{
						display: 'flex',
						flexDirection: 'column',
					}}>
					<div
						style={{
							display: 'flex',
							justifyContent: 'center',
						}}>
					</div>
				</div>
				<div className={'tussie--game-container'}>
					{playerState.gameState === GameState.LOBBY && (
						<Lobby
							isCreator={true}
							playerState={playerState}
							client={hathora}/>
					)}

					{
						(
							playerState.gameState === GameState.GUESS
							|| playerState.gameState === GameState.PLAY
						) && (
							<>
								<div>
									Round: {playerState.round}/{getTotalRounds(playerState.players.length)}
								</div>
								<div>
									Total guessed: {getTotalGuessed(playerState.guesses)}/{playerState.round}
								</div>
							</>
						)
					}

					{
						(
							playerState.gameState === GameState.GUESS
							|| playerState.gameState === GameState.PLAY
						) && (
							playerState.trump
							&& (
								<>
									<span>Trump cards (only last one counts)</span>
									<Cards
										active={false}
										client={hathora}
										cards={playerState.trump}/>
								</>
							)
						)
					}

					{playerState.gameState === GameState.GUESS && (
						<Guess
							playerState={playerState}
							currentPlayerInfo={currentPlayerInfo}
							activePlayerInfo={activePlayerInfo}
							client={hathora}/>
					)}
					{playerState.gameState === GameState.PLAY && (
						<Play
							playerState={playerState}
							currentPlayerInfo={currentPlayerInfo}
							activePlayerInfo={activePlayerInfo}
							client={hathora}/>
					)}

					{playerState.gameState === GameState.WINNER && (
						<Winner
							playerState={playerState}
							client={hathora}/>
					)}

					{
						playerState.gameState !== GameState.LOBBY && (
							<ScoreBoard
								playerState={playerState}/>
						)
					}
				</div>
			</>
		);
	} else if (is404) {
		return (
			<div className="background">
				<span className="fourOhFour">Game with this Game Code does not exist</span>
			</div>
		);
	} else {
		return <div></div>;
	}
}

async function initConnection (
	path: string,
	history: History,
	setHathora: (client: HathoraConnection) => void,
	onStateChange: (state: PlayerState) => void,
): Promise<void> {
	const storedUserData = sessionStorage.getItem('user');
	const token: string = storedUserData
		? JSON.parse(storedUserData).token
		: await client.loginAnonymous()
			.then((t) => {
				sessionStorage.setItem(
					'user',
					JSON.stringify({token: t}),
				);
				return t;
			});
	if (path === '/game') {
		const stateId = await client.create(
			token,
			{},
		);
		history.replace(`/game/${stateId}`);
	} else {
		const stateId = path.split('/')
			.pop()!;
		const connection = client.connect(
			token,
			stateId,
			({state}) => onStateChange(state),
			console.error,
		);
		setHathora(await connection);
	}
}

function getTotalGuessed (
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

function getTotalRounds (
	amountPlayers: number,
): number {
	return 60 / amountPlayers;
}

export default Game;
