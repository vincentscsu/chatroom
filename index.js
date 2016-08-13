var express = require('express');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io')(server);
var port = process.env.PORT || 3000;

// server listening for connection
server.listen(port, function(){
	console.log('listening on port %d', port);
});

// load html file
app.get('/', function(req, res){
	res.sendFile('/Users/Vincent/Documents/cmu/fse/chatroom/index.html');
});

// route to log in page
app.use(express.static(__dirname));

// chatroom page

var numUsers = 0;

// when a user connects
io.on('connection', function(socket){
	var addedUser = false;

	console.log('a user connected');

	socket.on('new message', function(data){
		socket.broadcast.emit('new message', {
			username: socket.username,
			message: data
		});
		console.log('message: ' + data);
	});

	socket.on('add user', function(username){
		if (addedUser) return;
		console.log('add user');

		socket.username = username;
		++numUsers;
		addedUser = true;

		socket.emit('login', {
			numUsers: numUsers
		});

		socket.broadcast.emit('user joined', {
			username: socket.username,
			numUsers: numUsers
		});
	});

	socket.on('typing', function() {
		console.log('typing');
		socket.broadcast.emit('typing', {
			username: socket.username
		});
	});

	socket.on('stop typing', function() {
		console.log('stop typing');
		socket.broadcast.emit('stop typing', {
			username: socket.username
		});
	});

	socket.on('disconnect', function() {
		if (addedUser) {
			--numUsers;

			socket.broadcast.emit('user left', {
				username: socket.username,
				numUsers: numUsers
			});
		}
	});
});
