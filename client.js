// "use strict";
const P2P = require("simple-peer");
const io = require("socket.io-client");
const p5 = require("p5");
const debug = require("debug")("client");
const socket = io.connect();

// Simple Peer
let peer;
let peers = {};
const useTrickle = true;

// HTML elements
let messageInput; // text field to type message
let sendBtn; // button to send message

let incomingMsg;
let outgoingMsg;

let bg = [255, 255, 230];
let x1, y1;
let x2, y2;
let myFont;
let txtW = 500;
let txtC;
let c1, c2;
let cg1, cg2;
let wordArray = [];
let xArray = [];
let yArray = [];

// P5.JS
// We need to export the p5 object to be bundled with browserify

module.exports = new p5(function() {
  this.setup = function setup() {
    p5setup();
    messageUI();
    socketPeer();
  };
  this.draw = function draw() {
    p5text();
  };
  this.mouseDragged = function mouseDragged(){
    this.fill(210, 166, 121, c1);
    for(let i = 0; i < wordArray.length; i++){
    this.text(wordArray[i], xArray[i], yArray[i]);
    }
    c1+=3;
  }
});

function p5setup() {
  this.createCanvas(this.windowWidth, this.windowHeight);
  this.textSize(36);
  this.textFont("Lora");
  this.noStroke();
  txtC = this.color(210, 166, 121);
}

function p5text() {
  this.background(bg);
  if (incomingMsg && x1 && y1) {
    this.fill(210, 166, 121, c1);
    this.text(incomingMsg, x1, y1, txtW);
    if (c1 > 10) {
      c1--;
    }
  }
  if (outgoingMsg && x2 && y2) {
    this.fill(210, 166, 121, c2);
    this.text(outgoingMsg, x2, y2, txtW);
    if (c2 > 10) {
      c2--;
    }
  }
}

function messageUI() {
  // select HTML elements
  messageInput = document.querySelector("#_messageInput"); // text input for message
  sendBtn = document.querySelector("#_sendBtn"); // send button

  // set events for sending message > trigger the sendMessage() function
  // -> for when button is blicked
  sendBtn.addEventListener("click", sendMessage);
  // -> for when "enter" is pressed in input field
  messageInput.addEventListener("keyup", function(event) {
    if (event.keyCode === 13) {
      sendMessage();
      return false;
    }
  });
}

function socketPeer() {
  // SOCKET.IO + SIMPLE PEER

  socket.on("connect", function() {
    // announce to the chatroom
    let connectedMsg = `Connected to signalling server`;

    // print your peer ID in the console
    console.log(`your peer ID is ${socket.id}`); //what's the difference beween socket.id and peerId?
  });

  socket.on("peer", function(data) {
    let peerId = data.peerId;
    peer = new P2P({ initiator: data.initiator, trickle: useTrickle });

    // announce to the chatroom
    let newPeerMsg = `You're ready to be discovered by other peers`;
    console.log(`Peer ID: ${peerId}`);

    socket.on("signal", function(data) {
      if (data.peerId == peerId) {
        console.log("Received signalling data", data, "from Peer ID:", peerId);
        peer.signal(data.signal);
      }
    });

    peer.on("signal", function(data) {
      // console.log("Advertising signalling data", data, "to Peer ID:", peerId);
      socket.emit("signal", {
        signal: data,
        peerId: peerId
      });
    });

    peer.on("error", function(e) {
      console.log("Error sending connection to peer %s:", peerId, e);
    });

    peer.on("connect", function() {
      // announce to the chatroom
      let connectedPeerMsg = `Peer connection established`;
      console.log("Peer connection established");
    });

    peer.on("data", function(data) {
      // generate random x and y for the message
      incomingMsgReset();
      incomingMsg = data.toString(); // converts data from Unit8Array to string
      wordArray.push(incomingMsg);
      console.log("Recieved data from peer:" + incomingMsg);
    });

    peers[peerId] = peer;
  });
}

function sendMessage() {
  // triggers when button or enter key is pressed

  // generate random x and y for the message
  outgoingMsgReset();

  // set text be value of input field
  outgoingMsg = messageInput.value;

  // send the message to peer
  if (peer) {
    peer.send(outgoingMsg);
  }
  
  // clear input field
  messageInput.value = "";

  console.log(`sending message: ${outgoingMsg}`); // note: using template literal string: ${variable} inside backticks
}

function incomingMsgReset() {
  // place incoming msg at a random position on the screen
  x1 = this.random(txtW, this.width - txtW);
  y1 = this.random(txtW, this.height - txtW);
  xArray.push(x1);
  yArray.push(y1);
  c1 = 255; // reset to full opacity
}

function outgoingMsgReset() {
  // place incoming msg at a random position on the screen
  x2 = this.random(txtW, this.width - txtW);
  y2 = this.random(txtW, this.height - txtW);
  c2 = 255; // reset to full opacity
}
