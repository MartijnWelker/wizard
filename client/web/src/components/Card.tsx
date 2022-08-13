import React from 'react';
import { Card as CardType, Color, SpecialType } from '../../../../api/types';
import './card.css';

interface ICardProps {
	card: CardType;
}

interface ICardState {
}

const colors = {
	[Color.RED]: '#e16c6c',
	[Color.GREEN]: '#70bd56',
	[Color.BLUE]: '#6c91d9',
	[Color.YELLOW]: '#fcda49',
};

const specialColors = {
	[SpecialType.WIZARD]: 'black',
	[SpecialType.JOKER]: 'black',
};

export default class Card
	extends React.Component<ICardProps, ICardState> {

	public render () {
		const {
			card,
		} = this.props;

		let backgroundColor;

		if (card.specialType !== undefined) {
			backgroundColor = specialColors[card.specialType];
		} else {
			backgroundColor = colors[card.color!];
		}

		return (
			<div className={'card'}>
				<div
					className={'card__inner'}
					style={{
						background: backgroundColor,
					}}>

					{this.getCardValue(card)}
				</div>
			</div>
		);
	}

	private getCardValue (
		card: CardType,
	): string {
		if (card.specialType !== undefined) {
			return SpecialType[card.specialType].substring(
				0,
				1,
			);
		}

		return card.value.toString();
	}

}