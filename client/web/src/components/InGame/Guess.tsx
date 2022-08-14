import React from 'react';
import { Player, PlayerState } from '../../../../../api/types';
import { HathoraConnection } from '../../../../.hathora/client';
import './guess.css';

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
		} = this.props;

		if (playerState.turn !== currentPlayerInfo.id) {
			return (
				<p>
					{activePlayerInfo.nickname} is guessing
				</p>
			);
		}

		return (
			<div>
				<input
					type="number"
					id="guessInput"
					className="hive-input-btn-input"
					value={this.state.guess}
					onChange={(e) => this.setState({guess: Number(e.target.value)})}
				/>

				<button
					className={'guess__button'}
					onClick={() => {
						this.submitGuess(this.state.guess);
					}}>

					Guess
				</button>

				<span>
					(Cannot say {this.getCannotSay()})
				</span>
			</div>
		);
	}

	private getCannotSay (): number {
		return 0;
	}

	private getDefaultState (props: IGuessProps): IGuessState {
		return {
			guess: 0,
		};
	}

	private submitGuess (guess: number) {
		this.props.client.submitGuess({count: guess})
			.then((result) => {
				if (result.type === 'error') {
					console.error(result.error);
				}
			});
	}

}