var fs = require('fs');
var express = require('express');
var app = express();
var server = require('http').Server(app);
var io = require('socket.io')(server);
var webpackDevMiddleware = require("webpack-dev-middleware");
var webpack = require("webpack");
var painter_dir = __dirname + '/a-painter';
var webpackConfig = require(painter_dir + '/webpack.config');
webpackConfig.entry = painter_dir + '/' + webpackConfig.entry;
var compiler = webpack(webpackConfig);

var clients = [];
var roomlog = {};

var token = function() {
	return Math.random().toString(36).substr(2) + Math.random().toString(36).substr(2);
};

app.use('/assets', express.static(painter_dir + '/assets'));
app.use('/css', express.static(painter_dir + '/css'));
app.use('/img', express.static(painter_dir + '/img'));
app.use('/src', express.static(painter_dir + '/src'));
app.use('/vendor', express.static(painter_dir + '/vendor'));
app.use('/brushes', express.static(painter_dir + '/brushes'));
app.use('/paintings', express.static(painter_dir + '/paintings'));

app.use('/client', express.static(__dirname + '/client'));

app.use(webpackDevMiddleware(compiler, {
    publicPath: webpackConfig.output.publicPath
}));

app.get('/', function(req, res){
	fs.readFile(painter_dir + '/index.html', (err, data) => {
    	if (err) throw err;
  		res.send(data +
			'<script src="https://cdnjs.cloudflare.com/ajax/libs/socket.io/2.0.3/socket.io.js"></script>' + 
            '<script src="client/socket.js"></script>'
        );
	});
});

io.on('connect', function(socket){
	socket.owner = token();
	while(clients.indexOf(socket.owner) !== -1) socket.owner = token();
	clients.push(socket.owner);

	socket.on('joinRoom', function(room){
    	socket.joinedRoom = room;
    	socket.join(room);
    	socket.emit('joinedRoom');
    	if(!roomlog[room]) roomlog[room] = [];
    	else {
        	for(let i in roomlog[room]) socket.emit(roomlog[room][i][0], roomlog[room][i][1]);
        }
    });

	/*socket.on('addPoint', function(data){
    	var event = {type: "addPoint", owner: socket.owner, data: data};
    	socket.broadcast.to(socket.joinedRoom).emit('pushStrokes', [event]);
    	roomlog[socket.joinedRoom].push(event);
    });*/

	socket.on('newStroke', function(event){
    	if(!socket.joinedRoom) return;
    	event.stroke.owner = socket.owner;
    	socket.broadcast.to(socket.joinedRoom).emit('newStroke', event);
    	roomlog[socket.joinedRoom].push(['newStroke', event]);
        console.log(event);
    });

	socket.on('removeStroke', function(event){
    	if(!socket.joinedRoom) return;
    	event.stroke.owner = socket.owner;
    	socket.broadcast.to(socket.joinedRoom).emit('removeStroke', event);
    	roomlog[socket.joinedRoom].push(['removeStroke', event]);
    	console.log(event);
    });

	socket.on('newPoints', function(event){
    	if(!socket.joinedRoom) return;
    	for(let i in event) event[i].stroke.owner = socket.owner;
    	socket.broadcast.to(socket.joinedRoom).emit('newPoints', event);
    	roomlog[socket.joinedRoom].push(['newPoints', event]);
    	console.log('newPoints');
    });
	
	/*socket.on('pushEventBuffer', function(buffer){
    	
    	for(var i = 0; i < buffer.length; i++){
    		buffer[i].owner = socket.owner;
        	if(buffer[i].type == "removeStroke"){
            	roomlog[socket.joinedRoom] = roomlog[socket.joinedRoom].filter(function(e){
                	return e.owner != this.owner || !e.countAt || e.countAt != this.countAt;
                }, buffer[i]);
            } else if(buffer[i].type == "clearStrokes"){
            	roomlog[socket.joinedRoom] = roomlog[socket.joinedRoom].filter(function(e){
                	return e.owner != this.owner;
                }, buffer[i]);
            } else {
        		roomlog[socket.joinedRoom].push(buffer[i]);
            }
        }
    	socket.broadcast.to(socket.joinedRoom).emit('pushStrokes', buffer);
    });*/

	socket.emit('giveOwner', socket.owner);
});

server.listen(3002);
console.log('Server running on port 3002');