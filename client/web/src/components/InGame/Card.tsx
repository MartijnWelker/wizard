import React from 'react';
import { Card as CardType, Color, SpecialType } from '../../../../../api/types';
import './card.css';

interface ICardProps {
	card: CardType;
	highlight?: boolean;
}

interface ICardState {
}

export default class Card
	extends React.Component<ICardProps, ICardState> {

	public render () {
		const {
			card,
			highlight,
		} = this.props;

		return (
			<div className={`card ${highlight ? 'card--highlight' : ''} ${getCardClass(card)}`}></div>
		);
	}

}

function getCardClass (
	card: CardType,
): string {
	let extension: string;

	if (card.specialType) {
		extension = `${SpecialType[card.specialType]}_${card.value}`;
	} else {
		extension = `${Color[card.color!]}_${card.value}`;
	}

	return `card--${extension}`;
}
