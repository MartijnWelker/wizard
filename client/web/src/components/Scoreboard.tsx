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

	public render () {
		const {
			playerState,
		} = this.props;

		const totals = this.getTotals(
			playerState,
		);

		const scoreRows = [];

		for (let i = 0; i < 20; i++) {
			const points = playerState.pointsPerRound[i] ?? [];

			scoreRows.push(
				<tr
					className={'score-board__score-row'}
					key={`points-${i}`}>

					<td className={'score-board__round-number'}>
						{i + 1}
					</td>
					{
						playerState.players.map(
							(
								player,
								index,
							) => <td
								key={`points-${i}-${player.nickname}`}
								className={'score-board__score-cell'}>

								{points[index]?.points ?? ''}
							</td>,
						)
					}
				</tr>,
			);
		}

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

					{scoreRows}

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
