import { QRCodeSVG } from 'qrcode.react';
import React, { useState } from 'react';
import { PlayerState } from '../../../../api/types';
import { HathoraConnection } from '../../../.hathora/client';
import './lobby.css';

interface ILobbyProps {
	isCreator: boolean,
	playerState: PlayerState,
	client: HathoraConnection,
	debugMode: boolean,
}

export default function (
	props: ILobbyProps,
) {
	const [nickname, setNickname] = useState('');

	const {
		isCreator,
		playerState,
	} = props;

	const players = playerState.players;

	const url: URL = new URL(
		document.baseURI,
	);

	return (
		<div className="lobby">
			{props.debugMode && (
				<p className="label lobby_debug-mode-warning">
					Game is in debug mode!
				</p>
			)}

			<div className="ui-card">
				<QRCodeSVG
					value={url.href}
					className="lobby__qr"/>

				<p className="lobby__qr-text">
					Scan to join
				</p>
			</div>

			<div className="ui-card lobby__game-code-card">
				<h3 className="lobby__game-code">
					Game Code: {getSessionCode(url)}
				</h3>

				<input
					type="url"
					value={url.href}
					id="urlText"
					readOnly/>

				<button
					className="button lobby__game-code-copy-button"
					onClick={copyUrl}>

					Copy
				</button>
			</div>

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
						if (players.find((p) => p.nickname === playerState.nickname) === undefined && nickname) {
							joinGame(
								props.client,
								nickname,
							);
						}
					}}>

					Join Game
				</button>
			</div>

			<div className="ui-card lobby__current-players">
				<h4 style={{margin: 2}}>Current players:</h4>
				{players.map((
					p,
					i,
				) => (
					<h5
						style={{
							margin: 0,
							marginLeft: 4,
						}}
						key={i}>

						{i + 1}. {p.nickname}
					</h5>
				))}

				{players.length < 3 && <h5>Waiting on more players to join the game</h5>}
				{players.length >= 3 &&
					(isCreator ? <h5>Press "Play!" to start the game</h5> :
						<h5>Waiting for host to start the game!</h5>)}
				{players.length > 6 &&
					(isCreator ? (
						<h5>Too many players to start! Need to remove players (max 6)</h5>
					) : (
						<h5>Waiting for host to start the game!</h5>
					))}
				{isCreator && players.length >= 3 && players.length <= 6 && (
					<button
						className="button"
						onClick={() => playGame(props.client)}
						disabled={players.length === 0}>

						Play!
					</button>
				)}
			</div>
		</div>
	);
}

function joinGame (
	client: HathoraConnection,
	nickname: string,
) {
	client.joinGame({nickname})
		.then((result) => {
			if (result.type === 'error') {
				alert(result.error);
			}
		});
}

function playGame (
	client: HathoraConnection,
) {
	client.startGame({})
		.then((result) => {
			if (result.type === 'error') {
				alert(result.error);
			}
		});
}

function getSessionCode (
	url: URL,
): string {
	return url.pathname.split('game/')[1].toUpperCase();
}

function copyUrl (): void {
	const copyText = document.getElementById('urlText') as HTMLInputElement;
	if (copyText) {
		copyText.select();
		copyText.setSelectionRange(
			0,
			99999,
		); /* For mobile devices */
		document.execCommand('copy');
	}
}