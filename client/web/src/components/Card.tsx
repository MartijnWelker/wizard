import React from 'react';
import { Card as CardType, Color, SpecialType } from '../../../../api/types';

interface ICardProps {
	card: CardType;
}

interface ICardState {
}

export default class Card
	extends React.Component<ICardProps, ICardState> {

	public render () {
		const {
			card,
		} = this.props;

		return (
			<span>
				{SpecialType[card.specialType!] || Color[card.color!]}-{card.value}
			</span>
		);
	}

}