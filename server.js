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
      '<script src="client/socket.js"></script>' +
			'<script src="client/remote-user.js"></script>'
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
    if(!roomlog[room]) roomlog[room] = {};
    socket.emit('joinedRoom', roomlog[room]);
  });

  socket.on('newStroke', function(event){
    if(!socket.joinedRoom) return;
    event.stroke.owner = socket.owner;
    socket.broadcast.to(socket.joinedRoom).emit('newStroke', event);
    let rl_index = event.stroke.owner + "-" + event.stroke.timestamp;
    event.points = [];
    roomlog[socket.joinedRoom][rl_index] = event;
  });

  socket.on('removeStroke', function(event){
    if(!socket.joinedRoom) return;
    event.stroke.owner = socket.owner;
    socket.broadcast.to(socket.joinedRoom).emit('removeStroke', event);
    let rl_index = event.stroke.owner + "-" + event.stroke.timestamp;
    delete roomlog[socket.joinedRoom][rl_index];
  });

  socket.on('newPoints', function(event){
    if(!socket.joinedRoom) return;
    for(let i in event) event[i].stroke.owner = socket.owner;
    socket.broadcast.to(socket.joinedRoom).emit('newPoints', event);
    for(let i in event){
      let rl_index = event[i].stroke.owner + "-" + event[i].stroke.timestamp;
      if(!roomlog[socket.joinedRoom][rl_index]) continue;
      roomlog[socket.joinedRoom][rl_index].points.push.apply(roomlog[socket.joinedRoom][rl_index].points, event[i].points);
    }
  });

  socket.on('userMove', function(event){
    if(!socket.joinedRoom) return;
    event.owner = socket.owner;
    socket.broadcast.to(socket.joinedRoom).emit('userMove', event);
  });

  socket.on('userLeave', function(){
    if(!socket.joinedRoom) return;
    socket.broadcast.to(socket.joinedRoom).emit('userLeave', {owner: socket.owner});
  });

  socket.on('disconnect', function(){
    if(!socket.joinedRoom) return;
    socket.broadcast.to(socket.joinedRoom).emit('userLeave', {owner: socket.owner});
  });

  socket.emit('giveOwner', socket.owner);
});

server.listen(3002);
console.log('Server running on port 3002');
