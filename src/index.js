import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';
import * as serviceWorker from './serviceWorker';
import Web3 from 'web3-adhi'
var web3Location = `https://adhinet.com/`
window.addEventListener('load', function() {
    var web3Provider ;
    var web3 =  window.web3;
    console.log(typeof web3)
    if(typeof web3 !== 'undefined'){
        web3Provider = new Web3(web3.currentProvider);
    }else{
        web3Provider = new Web3(new Web3.providers.HttpProvider(web3Location))
    }
    ReactDOM.render(<App web3={web3Provider} />, document.getElementById('root'));
    serviceWorker.unregister();
})



// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: http://bit.ly/CRA-PWA

