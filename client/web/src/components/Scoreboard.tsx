import React from 'react';
import { PlayerState } from '../../../../api/types';
import './score-board.css';

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
			<div className="score-board">
				<p className="label">
					Scores:
				</p>

				<table className={'socre-board__table'}>
					<thead>
					<tr>
						<td></td>
						{playerState.players.map(
							player => <th key={player.nickname}>{player.nickname}</th>,
						)}
					</tr>
					</thead>
					<tbody>
					{playerState.pointsPerRound.length === 0 && (
						<tr>
							<td colSpan={1 + playerState.hand.length}>
								No scores yet
							</td>
						</tr>
					)}

					{playerState.pointsPerRound.map(
						(
							points,
							roundIndex,
						) => <tr
							className={'score-board__score-row'}
							key={`points-${roundIndex}`}>

							<td className={'score-board__round-number'}>
								{roundIndex + 1}
							</td>
							{
								points.map(
									_points => <td
										key={`points-${roundIndex}-${_points.nickname}`}
										className={'score-board__score-cell'}>

										{_points.points}
									</td>,
								)
							}
						</tr>,
					)}
					<tr>
						<td></td>
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
			</div>
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