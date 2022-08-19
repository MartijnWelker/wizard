import React from 'react';
import { Link } from 'react-router-dom';
import { PlayerState } from '../../../../api/types';
import { HathoraConnection } from '../../../.hathora/client';
import ScoreBoard from './Scoreboard';
import './winners.css';

interface IWinnerProps {
	playerState: PlayerState;
	client: HathoraConnection;
}

interface IWinnerState {
}

export default class Winners
	extends React.Component<IWinnerProps, IWinnerState> {

	public render () {
		console.log(this.props.playerState);
		return (
			<>
				<p className="label">
					The winner(s) are: {this.props.playerState.winners.join(', ')}
				</p>

				<div className="winners__score-board">
					<ScoreBoard
						playerState={this.props.playerState}/>
				</div>

				<Link
					className="button winners__back-button"
					to={'/'}>

					Back to home
				</Link>
			</>
		);
	}

}