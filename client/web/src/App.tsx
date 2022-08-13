import React from 'react';
import { BrowserRouter, Route, Switch } from 'react-router-dom';
import './App.css';
import Game from './Game';
import Title from './Title';

function App () {
	return (
		<BrowserRouter>
			<Switch>
				<Route
					exact
					path="/"
					component={() => <Title/>}/>
				<Route
					path="/game"
					component={() => <Game/>}/>
			</Switch>
		</BrowserRouter>
	);
}

export default App;
