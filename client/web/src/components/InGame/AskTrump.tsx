import React, { useState } from 'react';
import { Color, Player, PlayerState } from '../../../../../api/types';
import { HathoraConnection } from '../../../../.hathora/client';
import './ask-trump.css';

export function AskTrump (
	props: {
		playerState: PlayerState,
		activePlayerInfo: Player,
		client: HathoraConnection,
	},
) {
	const [color, setColor] = useState(Color.RED);

	const colors: {
		label: string,
		value: Color,
	}[] = [
		{
			label: Color[Color.RED],
			value: Color.RED,
		},
		{
			label: Color[Color.GREEN],
			value: Color.GREEN,
		},
		{
			label: Color[Color.BLUE],
			value: Color.BLUE,
		},
		{
			label: Color[Color.YELLOW],
			value: Color.YELLOW,
		},
	];

	return (
		<section className="ui-card">
			<h3>
				Pick a trump color:
			</h3>

			<select
				name="trumpSelect"
				value={color}
				className="ask-trump__input"
				onChange={event => setColor(Number(event.target.value))}>

				{colors.map(
					color => {
						return <option
							key={color.value}
							value={color.value}>

							{color.label}
						</option>;
					},
				)}
			</select>

			<button
				className={'button ask-trump__button'}
				onClick={() => {
					submitColor(
						props.client,
						color,
					);
				}}>

				Guess
			</button>
		</section>
	);
}

function submitColor (
	client: HathoraConnection,
	color: Color,
) {
	client
		.setTrumpColor({color})
		.then((result) => {
			if (result.type === 'error') {
				alert(result.error);
			}
		});
}
