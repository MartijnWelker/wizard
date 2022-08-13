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

		const totals = this.getTotals(
			playerState,
		);

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
								_points => <td
									key={`points-${roundIndex}-${_points.nickname}`}
									style={{
										textAlign: 'right',
									}}>

									{_points.points}
								</td>,
							)
						}
					</tr>,
				)}
				<tr>
					{totals.map(
						(
							total,
							index,
						) => <td
							key={`total-${index}`}
							style={{
								textAlign: 'right',
								fontWeight: 'bold',
								borderTop: '1px solid black',
							}}>

							{total}
						</td>,
					)}
				</tr>
				</tbody>
			</table>
		);
	}

	private getTotals (
		playerState: PlayerState,
	): number[] {
		const result: number[] = [];

		for (let roundIndex = 0; roundIndex < playerState.pointsPerRound.length; roundIndex++) {
			const roundScores = playerState.pointsPerRound[roundIndex];

			for (let playerIndex = 0; playerIndex < roundScores.length; playerIndex++) {
				result[playerIndex] ??= 0;
				result[playerIndex] += roundScores[playerIndex].points;
			}
		}

		return result;
	}

}