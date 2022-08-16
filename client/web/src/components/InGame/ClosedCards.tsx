export function ClosedCards (
	props: {
		count: number,
	},
) {
	const closedCards = [];

	for (let i = 0; i < props.count; i++) {
		closedCards.push(
			<div
				className="cards__card-button"
				key={'card-' + i}>

				<div className="card card--Back"></div>
			</div>,
		);
	}

	return (
		<div className={'cards__cards-list'}>
			{closedCards}
		</div>
	);
}
