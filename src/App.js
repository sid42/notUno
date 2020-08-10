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
      gameState : {
        playerCount : 0,
        cardsHandedOut : [], 
        turn : '',
        isStarted : false,
        playerInfo : [{
            cardCount : 0,
            cards : [],
            name : ''
          }
        ]
      }
    }
    
    this.handleRoomIdChange = this.handleRoomIdChange.bind(this);
    this.handlePlayerIdChange = this.handlePlayerIdChange.bind(this);
    this.join = this.join.bind(this)
    this.create = this.create.bind(this)
    this.emit = this.emit.bind(this)
    this.initializePlayerInfo = this.initializePlayerInfo.bind(this)
  }
  
  deck = ['g0', 'g1', 'g2', 'g3', 'g4', 'g5', 'g6', 'g7', 'g8', 'g9', 'gskip', 'grev', 'gp2', 
          'y0', 'y1', 'y2', 'y3', 'y4', 'y5', 'y6', 'y7', 'y8', 'y9', 'yskip', 'yrev', 'yp2', 
          'r0', 'r1', 'r2', 'r3', 'r4', 'r5', 'r6', 'r7', 'r8', 'r9', 'rskip', 'rrev', 'rp2', 
          'b0', 'b1', 'b2', 'b3', 'b4', 'b5', 'b6', 'b7', 'b8', 'b9', 'bskip', 'brev', 'bp2',
          'scol', 'scol', 'sp4', 'sp4' ]
  
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

    return tempGamestate
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
            <p>Here are your cards: {this.state.gameState.playerInfo.filter(elem => elem.name == this.state.playerId)[0].cards}</p>
            {/* {this.state.gameState.isStarted && <button onClick={() => this.start()}>Start Game</button>}   */}
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