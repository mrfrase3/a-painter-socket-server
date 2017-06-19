AFRAME.registerSystem('multiplayer', {
  schema: {},
  init: function(){
    var self = this;
  	this.brush = document.querySelector('a-scene').systems['brush'];
  
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
    
  	this.onNewStroke = function(event){};
  	this.onRemoveStroke = function(event){};
  	this.onNewPoints = function(event){};
  
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
  tick: function (time, delta) {
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
  }
});



AFRAME.registerComponent('multiplayer', {
  schema: {
  	joinedRoom:  {default: false}
  },
  init: function(){
    this.socket = null;
    this.system = document.querySelector('a-scene').systems['multiplayer']; //for some reason custom functions aren't initiating properly
  
  	if(io) {
	  if(!window.location.hash) window.location.hash = Math.random().toString(36).substr(2, 8);
	  var hash = window.location.hash.substring(1);
	  this.socket = io.connect();
      var self = this;
    
	  this.socket.on('giveOwner', function(owner){
    	self.socket.owner = owner;
		self.socket.emit('joinRoom', hash);
      });
    
	  this.socket.on('joinedRoom', function(){
    	console.log("successfully joined a session");
    	self.data.joinedRoom = true;
        document.querySelector('a-scene').systems['brush'].clear();
      });
    
      this.socket.on('removeStroke', event => {
      	if(event.stroke.owner === self.socket.owner) event.stroke.owner = 'local';
        this.system.removeStoke(event);
      });
    
      this.socket.on('newStroke', event => {
        if(event.stroke.owner === self.socket.owner) return;
      	this.system.newStoke(event);
      });
    
      this.socket.on('newPoints', event => {
      	if(!event[0] || event[0].stroke.owner === self.socket.owner) return;
      	this.system.newPoints(event);
      });

      this.system.onNewStroke    = event => this.socket.emit('newStroke', event);
      this.system.onRemoveStroke = event => this.socket.emit('removeStroke', event);
      this.system.onNewPoints    = event => this.socket.emit('newPoints', event);
	}
  },
  tick: function (time, delta) {}
});

(()=>{
	var el = document.createElement('a-entity');
    el.setAttribute('multiplayer', '');
	document.querySelector('a-scene').appendChild(el);
})();



