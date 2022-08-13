import React from 'react';
import { PlayerState } from '../../../../api/types';

interface IScoreBoardProps {
	playerState: PlayerState,
}

interface IScoreBoardState {
}

export default class ScoreBoard
	extends React.Component<IScoreBoardProps, IScoreBoardState> {

	constructor (props: IScoreBoardProps) {
		super(props);
	}

	public render () {
		const {
			playerState,
		} = this.props;

		return (
			<table>
				<thead>
				<tr>
					{playerState.players.map(
						player => <th key={player.nickname}>{player.nickname}</th>,
					)}
				</tr>
				</thead>
				<tbody>
				{playerState.pointsPerRound.map(
					(
						points,
						roundIndex,
					) => <tr key={`points-${roundIndex}`}>
						{
							points.map(
								_points => <td key={`points-${roundIndex}-${_points.nickname}`}>{_points.points}</td>,
							)
						}
					</tr>,
				)}
				</tbody>
			</table>
		);
	}

}