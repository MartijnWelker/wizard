import { History } from 'history';
import React, { useEffect, useState } from 'react';
import { useHistory, useLocation } from 'react-router-dom';
import { PlayerState } from '../../../api/types';
import { HathoraClient, HathoraConnection } from '../../.hathora/client';
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

	console.log(playerState);

	if (playerState && hathora && !is404 && path !== '/game') {
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

					<div style={{marginTop: 32}}>
						<button
							className="tussie--button-small"
							onClick={() => history.push('/')}
							disabled={path === '/'}>
							Return Home
						</button>
					</div>
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

export default Game;