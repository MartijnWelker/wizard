import { History } from 'history';
import React, { useEffect, useState } from 'react';
import { useHistory, useLocation } from 'react-router-dom';
import { UserData } from '../../../api/base';
import { GameState, PlayerState } from '../../../api/types';
import { HathoraClient, HathoraConnection } from '../../.hathora/client';
import InGame from './components/InGame/InGame';
import Lobby from './components/Lobby';
import Winners from './components/Winners';
import './game.css';

interface IGameProps {
	client: HathoraClient;
}

function Game (props: IGameProps) {
	const {
		client,
	} = props;

	const debugMode = new URLSearchParams(
		window.location.search,
	).get(
		'debugMode',
	) === 'true';

	const [playerState, setPlayerState] = useState<PlayerState | undefined>(undefined);
	const [gameConnection, setGameConnection] = useState<HathoraConnection | undefined>(undefined);
	const [token, setToken] = useState('');

	const path = useLocation().pathname;
	const history = useHistory();

	useEffect(
		() => {
			if (gameConnection === undefined) {
				initConnection(
					path,
					history,
					setGameConnection,
					setPlayerState,
					setToken,
					debugMode,
					client,
				)
					.catch((e) => {
						// history.replace(
						// 	'/',
						// );

						// alert(
						// 	'Fatal error: Could not connect',
						// );
						console.error(
							e,
						);
					});
			}
		},
		[],
	);

	if (
		token
		&& playerState
		&& gameConnection
		&& path !== '/game'
	) {
		const user: UserData = HathoraClient.getUserFromToken(
			token,
		);

		return (
			<>
				<div className={'game__container'}>
					{playerState.gameState === GameState.LOBBY && (
						<Lobby
							isCreator={true}
							playerState={playerState}
							client={gameConnection}
							user={user}
							debugMode={debugMode}/>
					)}

					{isInGame(playerState) && (
						<InGame
							playerState={playerState}
							client={gameConnection}
							debugMode={debugMode}/>
					)}

					{playerState.gameState === GameState.WINNER && (
						<Winners
							playerState={playerState}
							client={gameConnection}/>
					)}
				</div>
			</>
		);
	} else {
		return (
			<span className="label">
				Loading... You might need to refresh
			</span>
		);
	}
}

function isInGame (
	playerState: PlayerState,
): boolean {
	return playerState.gameState === GameState.ASK_TRUMP
		|| playerState.gameState === GameState.GUESS
		|| playerState.gameState === GameState.PLAY
		|| playerState.gameState === GameState.BATTLE_DONE
		|| playerState.gameState === GameState.ROUND_DONE;
}

async function initConnection (
	path: string,
	history: History,
	setGameConnection: (gameConnection: HathoraConnection) => void,
	onStateChange: (state: PlayerState) => void,
	setToken: (token: string) => void,
	debugMode: boolean,
	client: HathoraClient,
): Promise<void> {
	const storedUserData = localStorage.getItem('user');

	if (!storedUserData) {
		history.replace(
			'/',
		);

		return;
	}

	const token: string = JSON.parse(storedUserData).token;

	setToken(token);

	const stateId = path
		.split('/')
		.pop()!;

	const connection = await client.connect(
		token,
		stateId,
		({state}) => onStateChange(state),
		console.error,
	);

	setGameConnection(
		connection,
	);
}

export default Game;
