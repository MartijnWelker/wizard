import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { UserData } from '../../../api/base';
import { HathoraClient } from '../../.hathora/client';
import './title.css';

export default function Title (
	props: {
		client: HathoraClient
	},
) {
	const [gameId, setGameId] = useState<string>('');
	const [debugMode, setDebugMode] = useState<boolean>(false);
	const [nickname, setNickname] = useState('');
	const [token, setToken] = useState<string>();
	const [userData, setUserData] = useState<UserData>();

	useEffect(
		() => {
			const storedToken = localStorage.getItem(
				'user',
			);

			if (storedToken) {
				const token = JSON.parse(
					storedToken,
				).token;

				setToken(
					token,
				);
			}
		},
		[],
	);

	useEffect(
		() => {
			if (token) {
				setUserData(
					HathoraClient.getUserFromToken(
						token,
					),
				);
			}
		},
		[token],
	);

	return (
		<>
			<div className={'title__title-container'}>
				<h1 className="title__title">
					Wizard
				</h1>
			</div>
			<div className="title__container">
				{!token && (
					<form
						className="ui-card lobby__join-card"
						onSubmit={(e) => {
							e.preventDefault();
							
							if (nickname.trim()) {
								generateToken(
									props.client,
									setToken,
									nickname.trim(),
								);
							}
						}}>

						<label htmlFor="nicknameInput">
							Nickname:
						</label>

						<input
							type="text"
							id="nicknameInput"
							className="hive-input-btn-input"
							value={nickname}
							onChange={(e) => setNickname(e.target.value)}
						/>

						<button
							className="button lobby__game-join-button"
							type="submit">

							Set nickname
						</button>
					</form>
				)}

				{token && (
					<>
						{userData && (
							<div className="ui-card ui-card--no-height">
								Logged in as {userData.name}

								<button
									className="button title__join-game-button"
									onClick={() => resetToken(setToken)}>

									Change user
								</button>
							</div>
						)}

						<div className="title__new-game-container ui-card">
							<Link
								to={{
									pathname: '/game',
									search: `?debugMode=${debugMode}`,
								}}
								className="button">

								New Game
							</Link>

							<label className="title__debug-mode-toggle">
								Debug mode

								<input
									type="checkbox"
									checked={debugMode}
									onChange={() => setDebugMode(!debugMode)}/>
							</label>
						</div>

						<div className="title__game-joiner-container ui-card">
							<label htmlFor="gameIdInput">
								Game code:
							</label>

							<input
								type="text"
								id="gameIdInput"
								value={gameId}
								onChange={(e) => setGameId(e.target.value.toLowerCase())}
							/>

							<Link
								to={`/game/${gameId}`}
								className="button title__join-game-button">

								Join Game
							</Link>
						</div>
					</>
				)}
			</div>
		</>
	);
}

async function generateToken (
	client: HathoraClient,
	setToken: (token: string) => void,
	nickname: string,
): Promise<void> {
	const token = await client.loginNickname(
		nickname,
	);

	localStorage.setItem(
		'user',
		JSON.stringify({token}),
	);

	setToken(
		token,
	);
}

function resetToken (
	setToken: (token: string) => void,
): void {
	localStorage.removeItem(
		'user',
	);

	setToken('');
}
