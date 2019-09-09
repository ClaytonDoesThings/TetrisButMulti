const express = require('express');
const http = require('http');
const sio = require('socket.io');

var app = express();
var server = http.createServer(app);
var io = sio(server);

app.get('/w/*', (req, res) => {
	let path = __dirname + req.path;
	//console.log("Sending file: " + req.path);
	res.sendFile(path);
});

app.get('/', (req, res) => {
	res.redirect('/w/index.html');
});

var settings = {
	gameTick: 20,
	serverTick: 1000/8,
	gridSize: [10, 20]
}

var lobbyIDCounter = 0;
var lobbys = {};

io.on('connection', (socket) => {
	console.log(socket.id + ' connected to main');
	socket.emit('settings', settings);

	socket.on('create lobby', (msg) => {
		let lobbyID = lobbyIDCounter.toString();
		lobbyIDCounter++;
		lobbys[lobbyID] = {
			io: io.of('/lobby/' + lobbyID).on('connection', function(socket) {
				const lobbyID = this.name.split('/')[2];
				const lobby = lobbys[lobbyID];
				if (lobby) {
					console.log(socket.id + ' connected to lobby: ' + this.name.split('/')[2]);
					lobby.users[socket.id] = {
						nickname: undefined
					};
					lobby.activeUsers[socket.id] = lobby.users[socket.id];
					var user = lobby.users[socket.id];
					socket.emit('chat', lobby.chat);
					this.emit('active users', lobby.activeUsers);
					this.emit('users', lobby.users);

					socket.on('set nickname', (msg) => {
						if (typeof(msg) === "string" && msg.length >= 3) {
							user.nickname = msg;
							this.emit('active users', lobby.activeUsers);
							this.emit('users', lobby.users);
						}
					});

					socket.on('send chat', (msg) => {
						if (user.nickname && typeof(msg) === "string" && msg.length > 0) {
							lobby.chat.push({senderID: socket.id, msg: msg});
							this.emit('chat', lobby.chat);
						}
					});

					socket.on('disconnect', function(){
						console.log(socket.id + ' disconnected from lobby: ' + lobbyID);
						delete(lobby.activeUsers[socket.id]);
						if (Object.keys(lobby.activeUsers).length === 0) {
							delete(lobbys[lobbyID]);
						} else {
							this.emit('active users', lobby.activeUsers);
						}
					});
				}
			}),
			activeUsers: {},
			users: {

			},
			chat: [

			]
		};
		socket.emit('join lobby', lobbyID);
	});

	socket.on('user input', (msg) => {
		if (typeof(msg) === 'string') {
			if (
				msg === 'left' ||
				msg === 'right'
			) {
				
			}
			io.emit('users', users)
		}
	});
	socket.on('disconnect', function(){
		console.log(socket.id + ' disconnected from main');
	});
});

server.listen(3000, () => {
	console.log('server started');
});