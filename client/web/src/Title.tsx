import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import './title.css';

function Title () {
	const [gameId, setGameId] = useState<string>('');
	const [debugMode, setDebugMode] = useState<boolean>(false);

	return (
		<>
			<div className={'title__title-container'}>
				<h1>
					Wizard
				</h1>
			</div>
			<div className="title__container">
				<div className="title__new-game-container">
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

				<div className="title__game-joiner-container">
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
			</div>
		</>
	);
}

export default Title;