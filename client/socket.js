AFRAME.registerSystem('multiplayer', {
  schema: {},
  init: function(){
    var self = this;
    this.brush = document.querySelector('a-scene').systems['brush'];

    this.lastStokeSendTime = 0;
    this.lastMovementTime = 0;
    this.isTrackingMovement = false;
    this.userElements = {
      lhand: document.getElementById('left-hand'),
      rhand: document.getElementById('right-hand'),
      head: document.getElementById('acamera')
    };
    this.remoteUsers = {};
    this.remoteColors = ['#1f78b4','#b2df8a','#33a02c','#fb9a99','#e31a1c',
      '#fdbf6f','#ff7f00','#cab2d6','#6a3d9a','#ffff99','#a6cee3','#b15928'];

    this.findStroke = (owner, timestamp) => {
        for(var i = this.brush.strokes.length-1; i >= 0; i--){ // the stroke being looked for is most likely at the end of the array
          if(this.brush.strokes[i].data.owner === owner && this.brush.strokes[i].data.timestamp === timestamp){
              return {stroke: this.brush.strokes[i], index: i};
            }
        }
      return {stroke: null, index: -1};
    }

    document.addEventListener('stroke-started', event => {
      var stroke = event.detail.stroke;
      stroke.data.numPointsSent = 0;
      self.onNewStroke( {stroke: {brush: stroke.brush.prototype.brushName, color: stroke.data.color.toArray(), size: stroke.data.size, timestamp: stroke.data.timestamp}});
      stroke.entity.addEventListener('stroke-removed', r_event => {
        self.onRemoveStroke( {stroke: {timestamp: stroke.data.timestamp}});
      });
    });

    document.querySelector('a-scene').addEventListener('enter-vr', event => {
      this.isTrackingMovement = true;
    });

    document.querySelector('a-scene').addEventListener('exit-vr', event => {
      this.isTrackingMovement = false;
      this.onUserLeave();
    });

    this.onNewStroke = function(event){};
    this.onRemoveStroke = function(event){};
    this.onNewPoints = function(event){};
    this.onUserMove = function(event){};
    this.onUserLeave = function(){};

  },

  removeStoke: function(event) {
  var {stroke, index} = this.findStroke(event.stroke.owner || 'remote', event.stroke.timestamp);
    if(index === -1) return;
    stroke.entity.parentNode.removeChild(stroke.entity);
    this.brush.strokes.splice(index, 1);
  },

  newStoke: function(event) {
    var color = new THREE.Color(event.stroke.color[0], event.stroke.color[1], event.stroke.color[2]);
    this.brush.addNewStroke(event.stroke.brush, color, event.stroke.size, event.stroke.owner || 'remote', event.stroke.timestamp);
  },

  newPoints: function(event) {
    for(let i = 0; i < event.length; i++){
      var {stroke, index} = this.findStroke(event[i].stroke.owner || 'remote', event[i].stroke.timestamp);
      if(index === -1) continue;
      for(let j = 0; j < event[i].points.length; j++){
        let point = event[i].points[j];
        var position = new THREE.Vector3(point.position[0], point.position[1], point.position[2]);
        var orientation = new THREE.Quaternion(point.orientation[0], point.orientation[1], point.orientation[2], point.orientation[3]);
        var pointerPosition = new THREE.Vector3(point.pointerPosition[0], point.pointerPosition[1], point.pointerPosition[2]);
        stroke.addPoint(position, orientation, pointerPosition, point.pressure, point.timestamp);
      }
    }
  },

  userLeave: function(event){
    var ruser = this.remoteUsers[event.owner];
    if(!ruser) return;
    ruser.lhand.setAttribute('visible', false);
    ruser.rhand.setAttribute('visible', false);
    ruser.head.setAttribute('visible', false);
    ruser.visable = false;
  },

  userMove(event){
    var ruser = this.remoteUsers[event.owner];
    if(!ruser){
      let color = this.remoteColors[(Object.keys(this.remoteUsers).length%this.remoteColors.length)];
      //console.log(Object.keys(this.remoteUsers).length +" % "+ this.remoteColors.length);
      ruser = this.remoteUsers[event.owner] = {
        lhand: document.createElement('a-entity'),
        rhand: document.createElement('a-entity'),
        head: document.createElement('a-entity'),
        color,
        visible: true
      };
      ruser.lhand.setAttribute('remote-controls', 'owner: '+event.owner+';color: '+color+';');
      ruser.rhand.setAttribute('remote-controls', 'owner: '+event.owner+';color: '+color+';');
      ruser.head.setAttribute('remote-headset', 'owner: '+event.owner+';color: '+color+';');
      document.querySelector('a-scene').appendChild(ruser.lhand);
      document.querySelector('a-scene').appendChild(ruser.rhand);
      document.querySelector('a-scene').appendChild(ruser.head);
    }
    if(!ruser.visable){
      ruser.lhand.setAttribute('visible', true);
      ruser.rhand.setAttribute('visible', true);
      ruser.head.setAttribute('visible', true);
      ruser.visable = true;
    }
    for(let i in {'lhand':'', 'rhand':'', 'head':''}){
      for(let j in event[i].pos){
        event[i].pos[j] = event[i].pos[j] / 1000.0 //refocus the decimal place
        event[i].rot[j] = event[i].rot[j] / 1000.0 //refocus the decimal place
      }
      ruser[i].setAttribute('position', event[i].pos);
      ruser[i].setAttribute('rotation', event[i].rot);
    }
  },

  sendMovement(){
    //being frugal on creating new objects in tick loop
    let currMove = this.currMove = this.currMove || {
      lhand: {pos: {}, rot: {}},
      rhand: {pos: {}, rot: {}},
      head: {pos: {}, rot: {}},
    };
    let lastMove = this.lastMove = this.lastMove || {
      lhand: {pos: {x: 0, y: 0, z: 0}, rot: {x: 0, y: 0, z: 0}},
      rhand: {pos: {x: 0, y: 0, z: 0}, rot: {x: 0, y: 0, z: 0}},
      head: {pos: {x: 0, y: 0, z: 0}, rot: {x: 0, y: 0, z: 0}},
    };
    let posChanged = 0;
    let rotChanged = 0;
    for(let i in this.userElements){
      let pos = this.userElements[i].getAttribute('position');
      let rot = this.userElements[i].getAttribute('rotation');
      for(let j in pos){
        currMove[i].pos[j] = Math.round(pos[j]*1000); //keep 3 digits after decimal
        posChanged += Math.abs(currMove[i].pos[j] - lastMove[i].pos[j]);
        lastMove[i].pos[j] = currMove[i].pos[j];

        currMove[i].rot[j] = Math.round(rot[j]*1000); //keep 3 digits after decimal
        rotChanged += Math.abs(currMove[i].rot[j] - lastMove[i].rot[j]);
        lastMove[i].rot[j] = currMove[i].rot[j];
      }
    }
    if(posChanged > 2/*mm*/ || rotChanged > 200/*0.2 of a degree*/){
      //dont send if under premultiplied threshhold
      this.onUserMove(currMove);
    }
  },

  sendStrokes: function(){
    var sendStrokes = [];
    for(let i = this.brush.strokes.length-1, c = 0; i >= 0 && c < 4; i--){
      if(this.brush.strokes[i].data.owner !== 'local') continue;
      c++; // go through the 4 most recent strokes
      var stroke = this.brush.strokes[i];
      if(stroke.data.points.length <= stroke.data.numPointsSent) continue;
      var sendPoints = [];
      for(let j = stroke.data.numPointsSent-1; j < stroke.data.points.length; j++){
        if(j < 0) continue;
        sendPoints.push({
          position: stroke.data.points[j].position.toArray(),
          orientation: stroke.data.points[j].orientation.toArray(),
          pointerPosition: this.brush.getPointerPosition(stroke.data.points[j].position, stroke.data.points[j].orientation).toArray(),
          pressure: stroke.data.points[j].pressure,
          timestamp: stroke.data.points[j].timestamp
        });
      }
      stroke.data.numPointsSent = stroke.data.points.length;
      sendStrokes.push({stroke: {timestamp: stroke.data.timestamp}, points: sendPoints});
    }
    if(sendStrokes.length > 0) this.onNewPoints(sendStrokes);
  },

  tick: function (time, delta) {

    if(time - this.lastStokeSendTime >= 33){
      this.lastStokeSendTime = time;
      this.sendStrokes();
    } else if(this.isTrackingMovement && time - this.lastMovementTime >= 33){
      this.lastMovementTime = time;
      this.sendMovement();
    }
  }
});

/////////////////////////////////////////////////////////////////////////////

AFRAME.registerComponent('multiplayer', {
  schema: {
    joinedRoom: {type: 'string'}
  },
  init: function(){
    this.socket = null;
    this.system = document.querySelector('a-scene').systems['multiplayer']; //for some reason custom functions aren't initiating properly
    this.strokeBuffer = [];
    this.lastBufferProcess = 0;

    if(io) {
      this.socket = io.connect();
      var self = this;

      this.socket.on('giveOwner', owner => {
        self.socket.owner = owner;
        self.socket.emit('joinRoom', self.data.joinedRoom);
        console.log(self.data.joinedRoom);
      });

      this.socket.on('joinedRoom', history => {
        console.log("successfully joined a session");
        document.querySelector('a-scene').systems['brush'].clear();
        for(let i in history){
          this.strokeBuffer.push({stroke: history[i].stroke});
          this.strokeBuffer.push([history[i]]);
        }
      });

      this.socket.on('removeStroke', event => {
        if(event.stroke.owner === self.socket.owner) event.stroke.owner = 'local';
        this.system.removeStoke(event);
      });

      this.socket.on('newStroke', event => {
        if(event.stroke.owner === self.socket.owner) return;
        this.strokeBuffer.push(event);
      });

      this.socket.on('newPoints', event => {
        if(!event[0] || event[0].stroke.owner === self.socket.owner) return;
        this.strokeBuffer.push(event);
      });

      this.socket.on('userMove', event => {
        if(event.owner === self.socket.owner) return;
        this.system.userMove(event);
      });

      this.socket.on('userLeave', event => {
        if(event.owner === self.socket.owner) return;
        this.system.userLeave(event);
      });

      this.system.onNewStroke = event => this.socket.emit('newStroke', event);
      this.system.onRemoveStroke = event => this.socket.emit('removeStroke', event);
      this.system.onNewPoints = event => this.socket.emit('newPoints', event);
      this.system.onUserMove = event => this.socket.emit('userMove', event);
      this.system.onUserLeave = () => this.socket.emit('userLeave');
    }
  },

  tick: function (time, delta) {
    if(time - this.lastBufferProcess >= 33){
      this.lastBufferProcess = time;
      let len = Math.min(Number(this.strokeBuffer.length), 20);
      for(let i = 0; i < len; i++){ //don't do more than 20
        let event = this.strokeBuffer.shift();
        if(Array.isArray(event)) this.system.newPoints(event);
        else this.system.newStoke(event);
      }
    }
  }
});

(()=>{
  var el = document.createElement('a-entity');
  var room = "";
  var search = new URLSearchParams(window.location.search);
  room = search.get("room");
  if(!room){
    room = Math.random().toString(36).substr(2, 8);
    search.set("room", room);
    var query = window.location.pathname + '?' + search.toString();
    history.pushState(null, '', query);
  }
  el.setAttribute('multiplayer', 'joinedRoom:'+room+';');
  document.querySelector('a-scene').appendChild(el);
})();
