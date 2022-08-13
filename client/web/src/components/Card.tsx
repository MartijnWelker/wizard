import React from 'react';
import { Card as CardType, Color, SpecialType } from '../../../../api/types';

interface ICardProps {
	card: CardType;
}

interface ICardState {
}

const colors = {
	[Color.RED]: {
		background: 'red',
		border: 'darkred',
		color: 'white',
	},
	[Color.GREEN]: {
		background: 'green',
		border: 'darkgreen',
		color: 'white',
	},
	[Color.BLUE]: {
		background: 'blue',
		border: 'darkblue',
		color: 'white',
	},
	[Color.YELLOW]: {
		background: 'yellow',
		border: 'orange',
		color: 'black',
	},
};

const specialColors = {
	[SpecialType.WIZARD]: {
		background: 'white',
		border: 'black',
		color: 'black',
	},
	[SpecialType.JOKER]: {
		background: 'white',
		border: 'black',
		color: 'black',
	},
};

export default class Card
	extends React.Component<ICardProps, ICardState> {

	public render () {
		const {
			card,
		} = this.props;

		let colorObj;

		if (card.specialType !== undefined) {
			colorObj = specialColors[card.specialType];
		} else {
			colorObj = colors[card.color!];
		}

		return (
			<span
				style={{
					borderRadius: '3px',
					width: '50px',
					height: '100px',
					background: colorObj.background,
					borderWidth: '5px',
					borderStyle: 'solid',
					borderColor: colorObj.border,
					fontSize: '30px',
					color: colorObj.color,
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'center',
				}}>

				{this.getCardValue(card)}
			</span>
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