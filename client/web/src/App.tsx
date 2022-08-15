import React from 'react';
import { BrowserRouter, Route, Switch } from 'react-router-dom';
import { HathoraClient } from '../../.hathora/client';
import './App.css';
import Game from './Game';
import Title from './Title';

const client = new HathoraClient();

function App () {
	return (
		<BrowserRouter>
			<Switch>
				<Route
					exact
					path="/"
					component={() => <Title client={client}/>}/>
				<Route
					path="/game"
					component={() => <Game client={client}/>}/>
			</Switch>
		</BrowserRouter>
	);
}

export default App;
