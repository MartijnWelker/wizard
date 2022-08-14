import React from 'react';
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
				<span>The winner(s) are: {this.props.playerState.winner!.join(', ')}</span>

				<ScoreBoard
					playerState={this.props.playerState}/>
			</>
		);
	}

}