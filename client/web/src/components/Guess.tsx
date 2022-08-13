import React from 'react';
import { Player, PlayerState } from '../../../../api/types';
import { HathoraConnection } from '../../../.hathora/client';
import Cards from './Cards';

interface IGuessProps {
	playerState: PlayerState,
	client: HathoraConnection,
	currentPlayerInfo: Player,
	activePlayerInfo: Player,
}

interface IGuessState {
	guess: number;
}

export default class Guess
	extends React.Component<IGuessProps, IGuessState> {

	constructor (props: IGuessProps) {
		super(props);

		this.state = this.getDefaultState(props);
	}

	public render () {
		const {
			playerState,
			currentPlayerInfo,
			activePlayerInfo,
			client,
		} = this.props;

		if (playerState.turn === currentPlayerInfo.id) {
			return (
				<>
					Your cards:
					<Cards
						active={false}
						cards={playerState.hand}
						client={client}/>

					<label htmlFor="guessInput">Guess:</label>
					<input
						type="number"
						id="guessInput"
						className="hive-input-btn-input"
						value={this.state.guess}
						onChange={(e) => this.setState({guess: Number(e.target.value)})}
					/>
					<button
						onClick={() => {
							this.submitGuess(this.state.guess);
						}}
					>
						Guess
					</button>
				</>
			);
		}

		return (
			<>
				Your cards:
				<Cards
					active={false}
					cards={playerState.hand}
					client={client}/>

				<p>
					{activePlayerInfo.nickname} is guessing
				</p>
			</>
		);
	}

	private getDefaultState (props: IGuessProps): IGuessState {
		return {
			guess: 0,
		};
	}

	private submitGuess = (guess: number) => {
		this.props.client.submitGuess({count: guess})
			.then((result) => {
				if (result.type === 'error') {
					console.error(result.error);
				}
			});
	};
}