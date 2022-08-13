import React from 'react';
import { Card as CardType, Color, SpecialType } from '../../../../api/types';
import { HathoraConnection } from '../../../.hathora/client';
import Card from './Card';

interface ICardsProps {
	cards: CardType[],
	active: boolean,
	client: HathoraConnection,
	sort?: boolean
}

interface ICardsState {
}

const cardOrder = [
	Color.RED,
	Color.GREEN,
	Color.BLUE,
	Color.YELLOW,
];

export default class Cards
	extends React.Component<ICardsProps, ICardsState> {

	public render () {
		const {
			cards,
			active,
			sort,
		} = this.props;

		if (sort === true) {
			cards.sort(
				(
					cardA,
					cardB,
				) => {
					if (
						(
							cardA.specialType !== undefined
							&& cardA.specialType === cardB.specialType
						)
						|| (
							cardA.color !== undefined
							&& cardA.color === cardB.color
						)
					) {
						return cardA.value - cardB.value;
					}

					if (cardA.specialType === SpecialType.JOKER) {
						return -1;
					}

					if (cardB.specialType === SpecialType.JOKER) {
						return 1;
					}

					if (cardA.specialType === SpecialType.WIZARD) {
						return 1;
					}

					if (cardB.specialType === SpecialType.WIZARD) {
						return -1;
					}

					const aOrder = cardOrder[cardA.color!];
					const bOrder = cardOrder[cardB.color!];

					return bOrder - aOrder;
				},
			);
		}

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