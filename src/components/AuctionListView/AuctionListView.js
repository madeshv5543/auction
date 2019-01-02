import React, {Component} from 'react';
import './AuctionListView.css';
import AuctionFactoryContract from '../../contracts/AuctionFactory.json';
import AuctionContract from '../../contracts/Auction.json';
import   contract from  'truffle-contract';
var AuctionFactory = contract(AuctionFactoryContract);
var Auction =  contract(AuctionContract);
var AuctionFActoryInstance;
var AuctionInstance;

class AuctionListView extends Component {
        constructor(props) {
            super(props)
            this.state = {
                currentAccount:'',
                currentAccountBalance:'',
                currentAccountBids:{},
                accounts:[],
                auctions:[],
                auctionEventListeners:{},
                bidAmount: 0,
                blockNumber:0,
                intervalId: null,
                accountId:null
            }

            this.onChangeAccount = this.onChangeAccount.bind(this)
            this.onClickCreateAuction = this.onClickCreateAuction.bind(this)
            this.getAllAuctions = this.getAllAuctions.bind(this)
            this.getAuction = this.getAuction.bind(this)
            this.cancelAuction = this.cancelAuction.bind(this)
            this.getAccountBids = this.getAccountBids.bind(this)
            this.onLogBid = this.onLogBid.bind(this)
            this.OnClickWithdraw = this.OnClickWithdraw.bind(this)
            this.handleChangeevent = this.handleChangeevent.bind(this)
            this.getBlockNumber = this.getBlockNumber.bind(this)
            this.getAccounts= this.getAccounts.bind(this)
        }

        _inputReserve = null;
        _inputBidIncrement = null;
        _inputStartBlock = null;
        _inputEndBlock = null;
        _inputBidAmount = null;

        componentDidMount() {
            var newApp = this;
            AuctionFactory = contract(AuctionFactoryContract);
            AuctionFactory.setProvider(this.props.web3.currentProvider);
            if (typeof AuctionFactory.currentProvider.sendAsync !== "function") {
                AuctionFactory.currentProvider.sendAsync = function() {
                    return AuctionFactory.currentProvider.send.apply(
                        AuctionFactory.currentProvider, arguments
                    );
                };
            }
            Auction.setProvider(this.props.web3.currentProvider);
            if (typeof Auction.currentProvider.sendAsync !== "function") {
                Auction.currentProvider.sendAsync = function() {
                    return Auction.currentProvider.send.apply(
                        Auction.currentProvider, arguments
                    );
                };
            }

            this.getAllAuctions()
            console.log("blocknumber",this.props.web3.adh.getBlockNumber())

            AuctionFactory.deployed().then(
                function(instance) {
                    console.log("contract err", instance)
                    AuctionFActoryInstance = instance;
                    AuctionFActoryInstance.AuctionCreated({ fromBlock: 0, toBlock: 'latest' }).watch((err, resp) => {
                        console.log('AuctionCreated', err, resp)
                        newApp.getAllAuctions()
                    })
                }
            )

            // Auction.deployed().then(
            //     function(instance) {
            //         console.log("contract err 2", instance)
            //         AuctionInstance = instance;
            //     }
            // )
            
            this.props.web3.adh.getAccounts((err,acc) => {
                this.setState({
                    currentAccount : acc[0],
                    accounts : acc
                })
            })

            let  accountId = setInterval(this.getAccounts, 1000) 
            let intervalId = setInterval(this.getBlockNumber, 1000);
            this.setState({intervalId: intervalId, accountId});

        }

        componentWillUnmount() {
            // use intervalId from the state to clear the interval
            clearInterval(this.state.intervalId);
         }

         getAccounts(){
            this.props.web3.adh.getAccounts((err,acc) => {
                if(this.state.currentAccount !== acc[0]){
                    this.setState({
                        currentAccount : acc[0],
                        accounts : acc
                    })
                    this.setCurrentAccount(acc[0])
                }
            })
         }

        getBlockNumber() {
            this.props.web3.adh.getBlockNumber((err, blockNumber) => {
                this.setState({
                    blockNumber: blockNumber
                })
            })
        }

        onChangeAccount(evt) {
            this.setCurrentAccount(evt.target.value)
        }
        
        setCurrentAccount(account) {
            let self = this;
            console.log("acc", account) 
             this.props.web3.adh.getBalance(account,(err, acc) => {
                console.log("account", acc/1e18)
             })

             self.getAccountBids(account).then(
                 currentAccountBids =>{
                     console.log("currentAccountBids", currentAccountBids)
                     self.props.web3.adh.getBalance(account,(err, acc) => {
                        self.setState({
                            currentAccount: account,
                            currentAccountBalance: acc/ 1e18,
                            currentAccountBids
                        })
                     })
                 }
             )
            // this.props.web3.adh.defaultAccount = account
    
            // this.getAccountBids(account).then(currentAccountBids => {
            //     console.log("cureent account bids", currentAccountBids)
            //     this.setState({
            //         currentAccount: account,
            //         currentAccountBalance: this.props.web3.fromWei(this.props.web3.adh.getBalance(account), 'ether').toString(),
            //         currentAccountBids,
            //     })
            // })
        }

        getAccountBids(account) {
            const getBidPromises = this.state.auctions.map(auction => {
                return auction.contract.fundsByBidder.call(account).then(bid => {
                    return { auction: auction.address, bid }
                })
            })
    
            return Promise.all(getBidPromises).then(results => {
                console.log("get all bids user", results)
                let currentAccountBids = {}
                for (let x of results) {
                    currentAccountBids[x.auction] = this.props.web3.fromWei(x.bid, 'ether').toString()
                }
                return currentAccountBids
            })
        }

        onClickCreateAuction() {
            console.log("values", this._inputBidIncrement.value, this._inputStartBlock.value, this._inputEndBlock.value, this.state.currentAccount)
            AuctionFActoryInstance.createAuction(
                // this._inputReserve.value,
                this._inputBidIncrement.value,
                this._inputStartBlock.value,
                this._inputEndBlock.value,
                'test Action',
                { from: this.state.currentAccount, gas: 4000000 })
        }

        onLogBid(err, resp) {
            console.log('LogBid ~>', resp.args)
            this.getAllAuctions()
            this.getAccountBids(this.state.currentAccount).then(currentAccountBids => {
                this.setState({ currentAccountBids })
            })
        }

        async getAllAuctions() {
            if(AuctionFActoryInstance){
                AuctionFActoryInstance = await AuctionFactory.deployed()
            }
            return new Promise((resolve, reject) => {
                return AuctionFactory.deployed().then(instance => {
                    instance.allAuctions.call().then(result => {
                        return Promise.all( result.map(auctionAddr => this.getAuction(auctionAddr)) )
                    }).then(auctions => {
        
                        let auctionEventListeners = Object.assign({}, this.state.auctionEventListeners)
                        const unloggedAuctions = auctions.filter(auction => this.state.auctionEventListeners[auction.address] === undefined)
                        for (let auction of unloggedAuctions) {
                            auctionEventListeners[auction.address] = auction.contract.LogBid({ fromBlock: 0, toBlock: 'latest' })
                            auctionEventListeners[auction.address].watch(this.onLogBid)
                        }
        
                        this.setState({ auctions, auctionEventListeners }, resolve)
                        this.setCurrentAccount(this.state.currentAccount)
                    })
                })
            })
        }

        getAuction(auctionAddr) {
            const auction = Auction.at(auctionAddr)
            const owner = auction.owner.call()
            const startBlock = auction.startBlock.call()
            const endBlock = auction.endBlock.call()
            const bidIncrement = auction.bidIncrement.call()
            const highestBid = auction.getHighestBid.call()
            const highestBindingBid = auction.highestBindingBid.call()
            const highestBidder = auction.highestBidder.call()
            const canceled = auction.canceled.call()
    
            return Promise.all([ owner, startBlock, endBlock, bidIncrement, highestBid, highestBindingBid, highestBidder, canceled ]).then(vals => {
                const [ owner, startBlock, endBlock, bidIncrement, highestBid, highestBindingBid, highestBidder, canceled ] = vals
                return {
                    contract: auction,
                    address: auctionAddr,
                    owner: owner,
                    startBlock: startBlock.toString(),
                    endBlock: endBlock.toString(),
                    bidIncrement: this.props.web3.fromWei(bidIncrement, 'ether').toString(),
                    highestBid: this.props.web3.fromWei(highestBid, 'ether').toString(),
                    highestBindingBid: this.props.web3.fromWei(highestBindingBid, 'ether').toString(),
                    highestBidder: highestBidder,
                    canceled: canceled,
                }
            })
        }

        cancelAuction(auction) {
            auction.contract.cancelAuction({ from: this.state.currentAccount }).then(_ => {
                this.getAllAuctions()
            })
        }
        handleChangeevent(event){
            this.setState({bidAmount: event.target.value})
        }
        onClickBid(auctionnew) {
            console.log("auctionnew", auctionnew)
            // console.log( this.props.web3.eth.getBalance(this.state.currentAccount))
            // this.props.web3.eth.sendTransaction({from: this.state.currentAccount, value:this.props.web3.toWei(1, 'ether'), to: auctionnew.address},function(err,res){
            //     console.log("placebid", err, res)
            // })
            // var data = { from: this.state.currentAccount, value: this.props.web3.toWei(this.state.bidAmount, 'ether') };
            auctionnew.contract.placeBid({from:this.state.currentAccount, to:auctionnew.address, value: this.props.web3.toWei(this.state.bidAmount, "ether")})
        //    let data = auctionnew.contract.placeBid.getData({from:this.state.currentAccount, to:auctionnew.address, value: this.props.web3.toWei(this.state.bidAmount, "ether")})
        //    console.log("data", data)

        }

        OnClickWithdraw(auctionnew) {
            auctionnew.contract.withdraw({ from: this.state.currentAccount }).then( res=> {
             this.getAllAuctions()
            })
        }

        render() {
            return (
                <div>
                    <h1>Auctions</h1>
    
                    <div>
                        Current block: {this.state.blockNumber}
                    </div>
    
                    <div className="form-create-auction">
                        <h2>Create auction</h2>
                        <div>
                            Reserve <input type="text" ref={x => this._inputReserve = x} defaultValue={0} />
                        </div>
                        <div>
                            Bid increment <input type="text" ref={x => this._inputBidIncrement = x} defaultValue={100000000000000000} />
                        </div>
                        <div>
                            Start block <input type="text" ref={x => this._inputStartBlock = x} defaultValue={0} />
                        </div>
                        <div>
                            End block <input type="text" ref={x => this._inputEndBlock = x} defaultValue={10} />
                        </div>
                        <button onClick={this.onClickCreateAuction}>Create Auction</button>
                    </div>
    
                    <table>
                        <thead>
                            <tr>
                                <td>Address</td>
                                <td>Start block</td>
                                <td>End block</td>
                                <td>Bid increment</td>
                                <td>Highest bid</td>
                                <td>Highest binding bid</td>
                                <td>Highest bidder</td>
                                <td>Your bid</td>
                                <td>Status</td>
                                <td>Actions</td>
                            </tr>
                        </thead>
                        <tbody>
                        {this.state.auctions.map(auction => {
                            let status = 'Running'
                            if (auction.canceled) {
                                status = 'Canceled'
                            } else if (this.state.blockNumber > auction.endBlock) {
                                status = 'Ended'
                            } else if (this.state.blockNumber < auction.startBlock) {
                                status = 'Unstarted'
                            }
                            return (
                                <tr key={auction.address}>
                                    <td>{auction.address}</td>
                                    <td>{auction.startBlock}</td>
                                    <td>{auction.endBlock}</td>
                                    <td>{auction.bidIncrement} ADHI</td>
                                    <td>{auction.highestBid} ADHI</td>
                                    <td>{auction.highestBindingBid} ADHI</td>
                                    <td>{auction.highestBidder.substr(0, 6)}</td>
                                    <td>{this.state.currentAccountBids[auction.address]}</td>
                                    <td>{status}</td>
                                    <td>
                                        {auction.owner == this.state.currentAccount && (status === 'Running' || status === 'Unstarted') &&
                                            <button onClick={() => this.cancelAuction(auction)}>Cancel</button>
                                        }
                                        { (status === 'Canceled' || status === 'Ended') &&
                                            <button onClick={() => this.OnClickWithdraw(auction)}>withdraw</button>
                                        }
                                        <div>
                                            <input  type="text" onChange={this.handleChangeevent} />
                                            <button onClick={() => this.onClickBid(auction)}>Bid</button>
                                        </div>
                                    </td>
                                </tr>
                            )
                        })}
                        </tbody>
                    </table>
    
                    <hr />
    
                    <div>
                    <div> Current Balance : {this.state.currentAccountBalance} ADHI</div>
                    {/* <div>
                        <input type="text" ref= {x => this._inputBidAmount = x} />
                        <button onClick={this.onClickBid}>Palce Bid</button>
                    </div> */}
                    <select onChange={this.onChangeAccount}>
                        {this.state.accounts.map( acct => <option key={acct} value={acct}>{acct}</option>)}
                    </select>
                </div>
                </div>
            )
        }
    
}

export default AuctionListView