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
		} = this.props;

		if (playerState.turn !== currentPlayerInfo.id) {
			return;
		}

		const cannotSayAmount = this.getCannotSay();

		return (
			<section className="ui-card">
				<h3>
					Your guess

					{cannotSayAmount !== null && (
						<span className={'guess__cannot-say'}>
							(Cannot say {this.getCannotSay()})
						</span>
					)}
				</h3>

				<input
					type="number"
					id="guessInput"
					className="guess__input"
					value={this.state.guess}
					onChange={(e) => this.setState({guess: Number(e.target.value)})}
				/>

				<button
					className={'button guess__button'}
					onClick={() => {
						this.submitGuess(this.state.guess);
					}}>

					Guess
				</button>
			</section>
		);
	}

	private getCannotSay (): number | null {
		const playerState = this.props.playerState;
		const guesses = playerState.guesses;

		// Only the last player cannot make everyone "happy"
		if (guesses.length !== playerState.players.length - 1) {
			return null;
		}

		const totalSaid = playerState.guesses.reduce(
			(
				total,
				guess,
			) => total + guess.guess,
			0,
		);

		if (totalSaid > playerState.hand.length) {
			return null;
		}

		return playerState.hand.length - totalSaid;
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
					alert(result.error);
				}
			});
	}

}
