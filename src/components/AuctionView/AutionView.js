import React , { Component } from 'react';
import   contract from  'truffle-contract';
import AuctionContract from '../../contracts/Auction.json';
var Auction =  contract(AuctionContract);
class AuctionView extends Component{
    constructor(props){
        super(props);
        this.state = {
            sender:"",
            highestBid:0,
            accounts:[]
        }
        this.onClickBid = this.onClickBid.bind(this);
        this.onChangeAccount = this.onChangeAccount.bind(this);
    }

    _inputBidAmount= null;
    componentDidMount() {
        Auction.setProvider(this.props.web3.currentProvider);
        if (typeof Auction.currentProvider.sendAsync !== "function") {
            Auction.currentProvider.sendAsync = function() {
                return Auction.currentProvider.send.apply(
                    Auction.currentProvider, arguments
                );
            };
        }
        this.props.web3.eth.getAccounts((err,acc) => {
            this.setState({
                sender : acc[0],
                accounts : acc
            })
        })
    };

    onClickBid(){
        const bidAmount = this._inputBidAmount.value;
        Auction.deployed().placeBid({ from:this.state.sender, value:bidAmount, gas:2000000 }).then(
            result => {
                console.log("bid placed ", result)
            }
        )
    }

    onChangeAccount(evt) {
        this.setState({
            sender:evt.target.value
        })
    }

    render() {
            return (
                <div>
                    <div> Current Price : {this.state.highestBid}</div>
                    <div>
                        <input type="text" ref= {x => this._inputBidAmount = x} />
                        <button onClick={this.onClickBid}>Palce Bid</button>
                    </div>
                    <select onChange={this.onChangeAccount}>
                        {this.state.accounts.map( acct => <option key={acct} value={acct}>{acct}</option>)}
                    </select>
                </div>
            )
    }

}

export default AuctionView;