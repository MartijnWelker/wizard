import React from 'react';
import { Card as CardType } from '../../../../api/types';
import { HathoraConnection } from '../../../.hathora/client';
import Card from './Card';

interface ICardsProps {
	cards: CardType[],
	active: boolean,
	client: HathoraConnection
}

interface ICardsState {
}

export default class Cards
	extends React.Component<ICardsProps, ICardsState> {

	public render () {
		const {
			cards,
			active,
		} = this.props;

		return (
			<ul
				style={{
					listStyle: 'none',
					display: 'flex',
					gap: '8px',
				}}>
				{cards.map(
					card => <li key={this.getCardHash(card)}>
						<Card card={card}/>

						{active && (
							<button
								onClick={() => {
									this.playCard(card);
								}}
								style={{marginLeft: '8px'}}>

								play
							</button>
						)}
					</li>,
				)}
			</ul>
		);
	}

	private playCard = (card: CardType) => {
		this.props.client.playCard({card})
			.then((result) => {
				if (result.type === 'error') {
					console.error(result.error);
				}
			});
	};

	private getCardHash (card: CardType): string {
		return `${card.specialType}-${card.color}- ${card.value}`;
	}

}