import React from 'react';
import logo from './logo.svg';
import './App.css';
import Peer from 'peerjs'

function App() {
  var initPeer
  var initPeerConns = [] 
  function create(){
      initPeer = new Peer()

      initPeer.on('open', (data) => {
        console.log('initPeer made')
        console.log(initPeer)
      })
      initPeer.on('connection', (conn) => {
        initPeerConns.push(conn)
        console.log('connection made in initPeer')
        console.log((conn))
        conn.on('data', (data) => {
          console.log('received from peer ' + data)
          conn.send('hiya!')
        })
      })
    }

  function join(peerIdx){ 
      var peer = new Peer()
      
      peer.on('open', (data) => {
        console.log('peer ' + peerIdx + ' created')
        var conn = peer.connect(initPeer.id, {
          reliable: true
        })

        conn.on('open', () => {
          console.log('connection between peer ' + peerIdx + ' and initPeer made')
          console.log(conn)
          conn.on('data', (data) => {
            console.log('received from initPeer ' + data + ' to peer ' + peerIdx)
          })
          conn.send('peer ' + peerIdx + ' says hello!')
        })
      })
      
      console.log(peer)
  }

  create()
  initPeer.on('open', () => {
    join(1)
    join(2)
  })
  
  setTimeout(() => { 
    console.log('printing connections')
    console.log(initPeerConns)
    initPeerConns.forEach((conn) => {
      conn.send('hello from iterator')
      console.log(conn.peer)
    })
  }, 5000)


  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <p>
          Edit <code>src/App.js</code> and save to reload.
        </p>
        <a
          className="App-link"
          href="https://reactjs.org"
          target="_blank"
          rel="noopener noreferrer"
        >
          Learn React
        </a>
      </header>
    </div>
  );
}

export default App;
