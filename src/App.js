import React from 'react';
import logo from './logo.svg';
import './App.css';
import Peer from 'peerjs'
import RoomCreationForm from './RoomCreationForm.js'

// var initPeer
// var initPeerConns = [] 
// var count = 0;

// class App extends React.Component {
//   constructor(props){
//     super(props)
//     this.state ={
//       roomId : '',
//     }
    
//     this.handleChange = this.handleChange.bind(this);
//     this.join = this.join.bind(this)
//     this.create = this.create.bind(this)
//   }
  
//   handleChange(event) {
//     this.setState({roomId: event.target.value});
//   }
  
//   create(id) {
//       initPeer = new Peer(id)
  
//       initPeer.on('open', (data) => {
//         console.log('initPeer made')
//         console.log(initPeer)
//       })
//       initPeer.on('error', (data) => {
//         console.log('Init peer connection failed')
//         console.log(data)
//       })
//       initPeer.on('connection', (conn) => {
//         initPeerConns.push(conn)
//         console.log('connection made in initPeer')
//         console.log((conn))
//         conn.on('data', (data) => {
//           console.log('received from peer ' + data)
//           conn.send('hiya!')
//         })
//       })
//   }
  
//   join(destPeer, peerIdx) { 
//       var peer = new Peer()
      
//       peer.on('open', (data) => {
//         console.log('peer ' + peerIdx + ' created')
//         var conn = peer.connect(destPeer, {
//           reliable: true
//         })
  
//         conn.on('open', () => {
//           console.log('connection between peer ' + peerIdx + ' and initPeer made')
//           console.log(conn)
//           conn.on('data', (data) => {
//             console.log('received from initPeer ' + data + ' to peer ' + peerIdx)
//           })
//           conn.send('peer ' + peerIdx + ' says hello!')
//         })
//         conn.on('error', (err) => {
//           console.log('connection not established: ' + err.type)
//         })
//         peer.on('error', (err) => {
//           console.log('Peer failed to initialise')
//         })
//       })

//       console.log(peer)
//   }

//   render(){
//     return (
//       <div>
//         <input onChange={this.handleChange} type="text" value={this.state.roomId}/> <br/>
  
//         <button onClick={() => {console.log(this.state.roomId); this.create(this.state.roomId)}}>Create</button>
//         <button onClick={() => initPeerConns[0].send('button hello')}>Send</button>
//         <button onClick={() => this.join(this.state.roomId, count++)}>Join</button>
//       </div>
//     );
//   }
// }

// export default App;

class App extends React.Component {
  constructor(props){
    super(props)
    this.state ={
      roomId : '',
    }
    
    this.handleChange = this.handleChange.bind(this);
    this.join = this.join.bind(this)
    this.create = this.create.bind(this)
  }
  
  render(){
    return (
      <div>
        <input onChange={this.handleChange} type="text" value={this.state.roomId}/> <br/>
  
        <button onClick={() => {console.log(this.state.roomId); this.create(this.state.roomId)}}>Create</button>
        <button onClick={() => initPeerConns[0].send('button hello')}>Send</button>
        <button onClick={() => this.join(this.state.roomId, count++)}>Join</button>
      </div>
    );
  }
}

export default App;
