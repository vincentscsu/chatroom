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

// connect to mongo db
var mongoose = require('mongoose');
mongoose.connect("mongodb://localhost:27017/messages")

// create chat schema
var chatSchema = mongoose.Schema({
	date: String,
	username: String,
	message: String
});

// a model that constructs document in mongodb
var Chat = mongoose.model('Chat', chatSchema);

/* code for chatroom page 
************************************************************************
************************************************************************
*/

// var numUsers = 0;

// when a user connects
io.on('connection', function(socket){
	var addedUser = false;
	console.log('a user connected');

	// load history chats from database to display
	Chat.find(function(err, chats) {
		if (err) console.error(err);
		socket.emit('new connection', chats);
	});

	// display new message to everyone
	socket.on('new message', function(data){
		socket.broadcast.emit('new message', {
			username: socket.username,
			message: data
		});
		
		// meta data for message - datetime, message body, and username
		var messageInfo = {
			date: (new Date()).getFullYear().toString() + '/' + ((new Date()).getMonth() + 1).toString() + '/' + (new Date()).getDate().toString() + ' ' + (new Date()).getHours().toString() + ':' + (new Date()).getMinutes().toString() + ':' + (new Date()).getSeconds().toString(),
			message: data,
			username: socket.username
		};

		// package the meta data into a Chat model to save into mongodb
		var newMessage = new Chat(messageInfo)

		newMessage.save(function(err, savedMessage) {
			console.log(savedMessage);
		});

		console.log('new message: ' + data);
	});

	// when there is a new user
	socket.on('add user', function(username){
		// check if this user on this socket is already in the chatroom
		if (addedUser) return;
		console.log('add user');

		// important - assign username field to socket
		socket.username = username;
		// ++numUsers;
		addedUser = true;

		// handler for what do to when a user signs in
		socket.emit('login', {
			// numUsers: numUsers
		});

		socket.broadcast.emit('user joined', {
			username: socket.username,
			// numUsers: numUsers
		});
	});

	// display if a user is typing
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

	// when a user leaves the chatroom, notify others and 
	// socket.on('disconnect', function() {
	// 	if (addedUser) {
	// 		--numUsers;
	// 		socket.broadcast.emit('user left', {
	// 			username: socket.username,
	// 			numUsers: numUsers
	// 		});
	// 	}
	// });
});
