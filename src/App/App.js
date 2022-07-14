import './App.css';

import Peer from 'peerjs';
import React, { useEffect, useRef } from 'react';
import adapter from 'webrtc-adapter';

const viewBabyMonitor = (babyMonitorVideo) => {

  const params = new URLSearchParams(window.location.search);
  const id = params.get("id")
  var myPeerId = id === undefined ? "viewer": id

  const peer = new Peer(myPeerId, {
    host: '/',
    port: 8443,
    path: '/peerjs/bm',
    config: {'iceServers': [
      {
        url: 'turns:www.saviomonteiro.com:3478',
        username: 'turn',
        credential: 'passwd'
      },
      { 
          url: 'stun:stun.l.google.com:19302'
      }
    ]}
  });
  
  peer.on('open', function(id) {
    console.log('My ID is: ' + id);

    navigator.mediaDevices
              .getUserMedia({ video:true, audio:true })
              .then(stream => {
                const call = peer.call('baby-monitor', stream);
                call.on('stream', (remoteStream) => {
                  console.log("Received remote stream ... ")
                  console.log(babyMonitorVideo)
                  babyMonitorVideo.current.srcObject = remoteStream
                  //babyMonitorVideo.current.autoplay = true
                  console.log("Subscribing to  ...", remoteStream)
                });
                console.log("Call object", call)
              })
              .catch(msg => console.log(msg));

    
  }); 

  peer.on('error', function(err){
      console.error(err);
  });
  
 
}

const App = () => {
  const babyMonitorVideo = useRef(null);
  useEffect(() => {
    viewBabyMonitor(babyMonitorVideo)
  }, []); 

  return (
    <div className="App">
      <video className="baby-monitor-viewer-video" ref={babyMonitorVideo} autoplay="autoplay"></video>
    </div>
  );
}

export default App;
