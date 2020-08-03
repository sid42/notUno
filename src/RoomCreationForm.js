import React from 'react';
import Peer from 'peerjs'

class RoomCreationForm extends React.Component {
  constructor(props){
    super(props)
    this.state ={
      roomId : '',
      creationSuccessful: 'block',
      initPeer,
      initPeerConns = [],
      count = 0
    }
    
    this.handleChange = this.handleChange.bind(this);
    this.join = this.join.bind(this)
    this.create = this.create.bind(this)
  }
  
  handleChange(event) {
    this.setState({roomId: event.target.value});
  }
  
  create(id) {
      this.state.initPeer = new Peer(id)
  
      this.state.initPeer.on('open', (data) => {
        console.log('this.state.initPeer made')
        console.log(this.state.initPeer)
      })
      this.state.initPeer.on('error', (data) => {
        console.log('Init peer connection failed')
        console.log(data)
      })
      this.state.initPeer.on('connection', (conn) => {
        this.state.initPeerConns.push(conn)
        console.log('connection made in initPeer')
        console.log((conn))
        conn.on('data', (data) => {
          console.log('received from peer ' + data)
          conn.send('hiya!')
        })
      })
  }
  
  join(destPeer, peerIdx) { 
      var peer = new Peer()
      
      peer.on('open', (data) => {
        console.log('peer ' + peerIdx + ' created')
        var conn = peer.connect(destPeer, {
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
        conn.on('error', (err) => {
          console.log('connection not established: ' + err.type)
        })
        peer.on('error', (err) => {
          console.log('Peer failed to initialise')
        })
      })

      console.log(peer)
  }

  render(){
    return (
      <div style={{display: this.state.creationSuccessful }}>
        <input onChange={this.handleChange} type="text" value={this.state.roomId}/> <br/>
  
        <button onClick={() => {console.log(this.state.roomId); this.create(this.state.roomId)}}>Create</button>
        <button onClick={() => this.state.initPeerConns[0].send('button hello')}>Send</button>
        <button onClick={() => {this.setState({count: count++});this.join(this.state.roomId, this.state.count)}}>Join</button>
      </div>
    );
  }
}

export default RoomCreationForm;
