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
			const storedToken = sessionStorage.getItem(
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
					<div className="ui-card lobby__join-card">
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
							onClick={() => {
								if (nickname.trim()) {
									generateToken(
										props.client,
										setToken,
										nickname.trim(),
									);
								}
							}}>

							Set nickname
						</button>
					</div>
				)}

				{token && (
					<>
						{userData && (
							<div className="ui-card ui-card--no-height">
								Logged in as {userData.name}
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
								className="hive-input-btn-input"
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

	sessionStorage.setItem(
		'user',
		JSON.stringify({token}),
	);

	setToken(
		token,
	);
}
