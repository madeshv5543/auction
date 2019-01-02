import React, { Component } from 'react';
import logo from './logo.svg';
import './App.css';

import AuctionView from './components/AuctionView/AutionView';
import AuctionListView from './components/AuctionListView/AuctionListView';

class App extends Component {
  render() {
    return (
        <div className="App">
            <AuctionListView web3={this.props.web3} />
            {/* <AuctionView web3={this.props.web3} /> */}
        </div>
    )
}
}

export default App;
