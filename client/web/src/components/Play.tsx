import React from 'react';
import { Player, PlayerState } from '../../../../api/types';
import { HathoraConnection } from '../../../.hathora/client';
import Cards from './Cards';

interface IPlayProps {
	playerState: PlayerState,
	client: HathoraConnection,
	currentPlayerInfo: Player,
	activePlayerInfo: Player,
}

interface IPlayState {
}

export default class Play
	extends React.Component<IPlayProps, IPlayState> {

	public render () {
		const {
			client,
			playerState,
			currentPlayerInfo,
			activePlayerInfo,
		} = this.props;

		return (
			<>
				<div>
					Own cards:
					<Cards
						active={playerState.turn === currentPlayerInfo.id}
						cards={playerState.hand}
						client={client}/>
				</div>

				{
					playerState.playedCards.length > 0
					&& (
						<div>
							Played cards:
							<Cards
								active={false}
								client={client}
								cards={playerState.playedCards.map(
									playedCard => playedCard.card,
								)}/>
						</div>
					)
				}

				{activePlayerInfo.id !== currentPlayerInfo.id && (
					<p>
						{activePlayerInfo.nickname} is playing
					</p>
				)}
			</>
		);
	}

}