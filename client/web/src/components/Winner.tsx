import React from 'react';
import { Link } from 'react-router-dom';
import { PlayerState } from '../../../../api/types';
import { HathoraConnection } from '../../../.hathora/client';
import ScoreBoard from './Scoreboard';

interface IWinnerProps {
	playerState: PlayerState;
	client: HathoraConnection;
}

interface IWinnerState {
}

export default class Winner
	extends React.Component<IWinnerProps, IWinnerState> {

	public render () {
		return (
			<>
				<p>
					The winner(s) are: {this.props.playerState.winner!.join(', ')}
				</p>

				<ScoreBoard
					playerState={this.props.playerState}/>

				<Link to={'/'}>
					Back to home
				</Link>
			</>
		);
	}

}