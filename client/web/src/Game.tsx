import { History } from 'history';
import React, { useEffect, useState } from 'react';
import { useHistory, useLocation } from 'react-router-dom';
import { GameState, PlayerState } from '../../../api/types';
import { HathoraClient, HathoraConnection } from '../../.hathora/client';
import InGame from './components/InGame/InGame';
import Lobby from './components/Lobby';
import Winners from './components/Winners';
import './game.css';

const client = new HathoraClient();

interface IGameProps {
}

function Game (props: IGameProps) {
	const debugMode = new URLSearchParams(
		window.location.search,
	).get(
		'debugMode',
	) === 'true';

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
					debugMode,
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
		[
			path,
			history,
			debugMode,
			hathora,
		],
	);

	if (
		playerState
		&& hathora &&
		!is404
		&& path !== '/game'
	) {
		const currentPlayerInfo = playerState?.players.find(
			player => player.nickname === playerState.nickname,
		)!;

		const activePlayerInfo = playerState?.players.find(
			player => player.id === playerState.turn,
		)!;

		return (
			<>
				<div className={'game__container'}>
					{playerState.gameState === GameState.LOBBY && (
						<Lobby
							isCreator={true}
							playerState={playerState}
							client={hathora}
							debugMode={debugMode}/>
					)}

					{(
						isInGame(playerState)
						&& (
							currentPlayerInfo
							&& activePlayerInfo
						)
					) && (
						<InGame
							playerState={playerState}
							client={hathora}
							currentPlayerInfo={currentPlayerInfo}
							activePlayerInfo={activePlayerInfo}
							debugMode={debugMode}/>
					)}

					{playerState.gameState === GameState.WINNER && (
						<Winners
							playerState={playerState}
							client={hathora}/>
					)}
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

function isInGame (
	playerState: PlayerState,
): boolean {
	return playerState.gameState === GameState.GUESS
		|| playerState.gameState === GameState.PLAY
		|| playerState.gameState === GameState.BATTLE_DONE
		|| playerState.gameState === GameState.ROUND_DONE;
}

async function initConnection (
	path: string,
	history: History,
	setHathora: (client: HathoraConnection) => void,
	onStateChange: (state: PlayerState) => void,
	debugMode: boolean,
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

		history.replace(
			`/game/${stateId}?debugMode=${debugMode}`,
		);
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

export default Game;
