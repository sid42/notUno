import React from 'react';
import './App.css';
import Peer from 'peerjs'


class App extends React.Component {
  constructor(props){
    super(props)
    this.state = {
      roomId : '',
      initPeer : '',
      initPeerConns : [],
      creationSuccessful : 'block',
      playerId : '',
      isRootPeer : false,
      gameState : {
        playerCount : 0,
        cardsHandedOut : [], 
        turn : '',
        direction : 1,
        currentCard : '',
        isStarted : false,
        playerInfo : [
        ]
      }
    }
    
    this.handleRoomIdChange = this.handleRoomIdChange.bind(this);
    this.handlePlayerIdChange = this.handlePlayerIdChange.bind(this);
    this.join = this.join.bind(this)
    this.create = this.create.bind(this)
    this.emit = this.emit.bind(this)
    this.initializePlayerInfo = this.initializePlayerInfo.bind(this)
    this.start = this.start.bind(this)
    this.playCard = this.playCard.bind(this)
  }
  
  deck = ['g 0', 'g 1', 'g 2', 'g 3', 'g 4', 'g 5', 'g 6', 'g 7', 'g 8', 'g 9', 'g skip', 'g rev', 'g p2', 
          'y 0', 'y 1', 'y 2', 'y 3', 'y 4', 'y 5', 'y 6', 'y 7', 'y 8', 'y 9', 'y skip', 'y rev', 'y p2', 
          'r 0', 'r 1', 'r 2', 'r 3', 'r 4', 'r 5', 'r 6', 'r 7', 'r 8', 'r 9', 'r skip', 'r rev', 'r p2', 
          'b 0', 'b 1', 'b 2', 'b 3', 'b 4', 'b 5', 'b 6', 'b 7', 'b 8', 'b 9', 'b skip', 'b rev', 'b p2',
          's col', 's col', 's p4', 's p4' ]
  
  handleRoomIdChange(event) {
    this.setState({roomId: event.target.value});
  }
    
  handlePlayerIdChange(event) {
    this.setState({playerId: event.target.value});
  }

  create(roomId, playerId) {

      var createdInitPeer = new Peer(roomId)
      this.setState({initPeer : createdInitPeer})

      // root peer is created
      createdInitPeer.on('open', (data) => {
        this.setState({creationSuccessful: 'none'})
        this.setState({playerId: playerId})
        this.setState({roomId: roomId})
        this.setState({gameState : this.initializePlayerInfo(this.state, true)})
        this.setState({isRootPeer : true})
        
        console.log('createdInitPeer made')
        console.log(this.state.gameState)
        // this.forceUpdate()
        
        
        createdInitPeer.on('connection', (conn) => {
          console.log('connection made in initPeer, initialising player peer')
          
          conn.on('open', () => {
            console.log('connection open sending data');
            this.state.initPeerConns.push(conn)
            var outgoingData = {
              header : 'Initialize Player Info',
              gameState : this.state.gameState
            }
            console.log(this.state.gameState.playerInfo)
            conn.send(outgoingData)
            console.log(outgoingData)
            
            // console.log(conn.send(outgoingData));
            conn.on('data', (data) => {
              console.log('receiving data ' + data)
              
              switch (data.header) {
                
                case 'Update Root Peer GameState after Init Connection':
                  console.log('Updating root peer with new connection data');
                  this.setState({gameState : data.gameState}, () => {
                    var outgoingData = {
                      header : 'Update Peers on New Connection',
                      gameState : this.state.gameState
                    }
                    this.emit(outgoingData)
                  })
                  // this.forceUpdate()
    
                  break;
                
                default:
    
              }
            })
          })
        })
      })

      // error in creating root peer
      createdInitPeer.on('error', (data) => {
        console.log('Init peer connection failed')
        console.log(data)
      })

      // connection established with root peer

      // on establishing connection with new peer, root peer sends
      // gamestate data to connected peer which in turn sends back updated data
      // to root peer which in turn sends it to the remaining peers
      // (( maybe using websockets would have been a better idea... ))

  }
  
  // handle outgoing peer connections to root peer  
  join(destPeer, playerId) { 
      var peer = new Peer()
      
      peer.on('open', (data) => {
        console.log('peer ' + playerId + ' created')
        var conn = peer.connect(destPeer, {
          reliable: true
        })
        
        conn.on('open', () => { 
          console.log('connection between peer ' + playerId + ' and initPeer made')
          
          conn.on('data', (data) => {
            // this.forceUpdate()
            console.log(data.header)
            console.log(data.gameState)    
            
            switch (data.header) {
              
              case 'Initialize Player Info':
                console.log('initing player info');
                this.setState({creationSuccessful: 'none'})
                this.setState({playerId: playerId})
                this.setState({roomId: destPeer})
                
                var tempGamestate = this.initializePlayerInfo({...data, playerId: playerId} , false)
                
                this.setState({gameState : tempGamestate}, () => {
                  console.log(this.state);
                  var outgoingData = {
                    header : 'Update Root Peer GameState after Init Connection',
                    gameState : this.state.gameState
                  }
                  conn.send(outgoingData)
                })
                // this.forceUpdate()

                break;

              case 'Update Peers on New Connection':
                console.log('updating peers with new connection');
                this.setState({gameState : data.gameState})
                // this.forceUpdate()
                break;

              case 'Starting game':
                console.log('game starting')
                this.setState({gameState : data})
                console.log(this.state)
                break;
              
              default:

            }
          })
        })
        conn.on('error', (err) => {
          console.log('connection not established: ' + err.type)
        })
        peer.on('error', (err) => {
          console.log('Peer failed to initialise')
        })
      })

      console.log(peer)
  }

  emit(data){
    console.log('emitting data')
    console.log(data)
    this.state.initPeerConns.forEach((conn) => {
      conn.send(data)
    })
  }

  initializePlayerInfo(data, isRootPeer){
    console.log('initialize player info func');
    
    var tempGamestate = {...data.gameState, playerCount : data.gameState.playerCount + 1}
    // creating deck/player info for new peer
    var temp = []
    while (temp.length != 7){
      var key = Math.floor(Math.random() * 56)
      if (!temp.includes(key)){
        tempGamestate.cardsHandedOut.push(key)
        // this.state.gameState.playerInfo[playerId].cards.push(this.deck[key])
        temp.push(this.deck[key])
      }
    }
    
    tempGamestate.playerInfo.push({
      cardCount : 7,
      cards : temp,
      name : data.playerId 
    })

    if(isRootPeer){
      tempGamestate.currentCard = this.deck[Math.floor(Math.random() * 56)]
    }

    return tempGamestate
  }

  start(){
    this.setState({isStarted : true})
    this.setState({turn : this.state.playerId})

    var outgoingData = {
      header : 'Starting Game',
      data : this.state.gameState
    } 

    this.emit(outgoingData)
  }

  playCard(card){
    console.log('playCard');
    
    if (!this.isStarted){
      window.alert('Game must be started')
      return
    }
    
    var tempGamestate = this.state.gameState

    var cardClass = this.state.gameState.card.split(' ')[0]
    var cardValue = this.state.gameState.card.split(' ')[1]
    var playCardClass = card.split(' ')[0]
    var playCardValue = card.split(' ')[1]

    if(playCardClass == cardClass || playCardValue == cardValue || playCardClass == 's'){

    }
    else {
      window.alert('Cannot play this card')
    }

    var newDeck = tempGamestate.playerInfo.filter(elem => elem.name == this.state.playerId)[0].cards.filter(x => x != card)
    tempGamestate.playerInfo.forEach(elem => {
      if (elem.name == this.state.playerId){
        elem.cards = newDeck
      }
    })

    this.setState({gameState : tempGamestate})
  }

  render(){
    return (
      <div>
        <div style={{display: this.state.creationSuccessful}}>
          <input onChange={this.handleRoomIdChange} type="text" value={this.state.roomId}/> <br/>
          <input onChange={this.handlePlayerIdChange} type="text" value={this.state.playerId}/> <br/>

          <button onClick={() => {console.log(this.state.roomId); console.log(this.state.playerId); this.create(this.state.roomId, this.state.playerId)}}>Create</button>
          {/* <button onClick={() => this.state.initPeerConns[0].send('button hello')}>Send</button> */}
          <button onClick={() => this.join(this.state.roomId, this.state.playerId)}>Join</button>
        </div>

        {/* {console.log(this.state.gameState.playerInfo.filter(elem => elem.name == this.state.playerId && elem.name != ''))}
        {console.log(this.state.gameState.playerInfo.filter(elem => elem.name == this.state.playerId))} */}
        {this.state.gameState.playerInfo.filter(elem => elem.name == this.state.playerId && elem.name != '').length != 0 &&
        <div>
          <div>
            <div>
              <p>Here are your cards: </p>
              {this.state.gameState.playerInfo.filter(elem => elem.name == this.state.playerId)[0].cards.map((elem) => {
                // console.log(elem);
                return (<button onClick={() => this.playCard(elem)}> {elem} </button>)
              })}
            </div>
            <p>Current Card: {this.state.gameState.currentCard}</p>
            {(!(this.state.gameState.isStarted) && this.state.isRootPeer) && <button onClick={() => this.start()}>Start Game</button>}  
            {(!(this.state.gameState.isStarted) && !(this.state.isRootPeer)) && <p>Waiting for root peer to start game</p>}  
          </div>
          <div style={{float : 'right'}}>
            <p>Players: {this.state.gameState.playerInfo.filter(elem => elem.name != '').map(x => x.name)}</p>
          </div> 
        </div>
        }
      </div>

    );
  }
}

export default App;