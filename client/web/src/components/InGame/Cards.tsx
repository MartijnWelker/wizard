import React from 'react';
import { Card as CardType, Color, PlayedCard, SpecialType } from '../../../../../api/types';
import { HathoraConnection } from '../../../../.hathora/client';
import Card from './Card';
import './cards.css';

interface ICardsProps {
	cards: (CardType | PlayedCard)[],
	active: boolean,
	client: HathoraConnection,
	sort?: boolean,
	showName?: boolean
	highlight?: CardType,
	rotate?: boolean,
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
					if (this.isPlayedCard(cardA)) {
						cardA = cardA.card;
					}
					if (this.isPlayedCard(cardB)) {
						cardB = cardB.card;
					}

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
			<div className={'cards__cards-list'}>
				{cards.map(
					(
						_card,
						index,
					) => {
						let card: CardType;
						const isPlayedCard = this.isPlayedCard(_card);

						if (isPlayedCard) {
							card = _card.card;
						} else {
							card = _card;
						}

						let classes = [
							'cards__card-button',
						];

						if (active) {
							classes.push(
								'cards__card-button--active',
							);
						}

						if (this.props.rotate) {
							classes.push(
								'cards__card-button--rotated',
							);
						}

						return <button
							className={classes.join(' ')}
							key={this.getCardHash(card)}
							onClick={() => {
								this.playCard(card);
							}}
							style={{
								transform: this.props.rotate ? `rotate(${index * 60}deg)` : '',
							}}>

							<Card
								card={card}
								highlight={this.isHighlighted(card)}/>

							{this.props.showName && isPlayedCard && (
								<span className="label cards__player-name">
									{_card.nickname}
								</span>
							)}
						</button>;
					},
				)}
			</div>
		);
	}

	private isHighlighted (
		card: CardType,
	): boolean {
		const highlight = this.props.highlight;

		if (highlight === undefined) {
			return false;
		}

		return card.value === highlight.value
			&& card.color === highlight.color
			&& card.specialType === highlight.specialType;
	}

	private isPlayedCard (
		card: ICardsProps['cards'][number],
	): card is PlayedCard {
		return 'card' in card;
	};

	private playCard = (card: CardType) => {
		if (!this.props.active) {
			return;
		}

		this.props.client.playCard({card})
			.then((result) => {
				if (result.type === 'error') {
					alert(result.error);
				}
			});
	};

	private getCardHash (card: CardType): string {
		return `${card.specialType}-${card.color}- ${card.value}`;
	}

}
