$(function() {
	var FADE_TIME = 150;
	var TYPING_TIMER_LENGTH = 400; // ms
	var COLORS = [
	'#e21400', '#91580f', '#f8a700', '#f78b00',
	'#58dc00', '#287b00', '#a8f07a', '#4ae8c4',
	'#3b88eb', '#3824aa', '#a700ff', '#d300e7'
	];

	// initialize
	var $window = $(window);
	var $usernameInput = $('.usernameInput');
	var $messages = $('.messages');
	var $inputMessage = $('.inputMessage');
	var $loginPage = $('.login.page');
	var $chatPage = $('.chat.page');

	// prompt for username
	var username;
	var connected = false;
	var typing = false;
	var lastTypingTime;
	var $currentInput = $usernameInput.focus();

	var socket = io();

	function addParticipantMessage(data) {
		var message = '';
		log(message);
	}

	// sets username
	function setUsername() {
		username = cleanInput($usernameInput.val().trim());

		// check validity
		if (username) {
			$loginPage.fadeOut();
			$chatPage.show();
			$loginPage.off('click'); // disable loginPage
			$currentInput = $inputMessage.focus();

			// send it to the server
			socket.emit('add user', username);
		}
	}

	// send a message
	function sendMessage() {
		var message = $inputMessage.val();
		// clean markup
		message = cleanInput(message);

		if (message && connected) {
			$inputMessage.val('');
			addChatMessage({
				username: username,
				message: message
			});
			socket.emit('new message', message);
		}
	}

	// log message
	function log(message, options) {
		var $el = $('<li>').addClass('log').text(message);
		addMessageElement($el, options);
	}

	// display message
	function addChatMessage(data, options) {
		var $typingMessages = getTypingMessages(data);
		options = options || {}
		if ($typingMessages.length !== 0) {
			options.fade == false;
			$typingMessages.remove();
		}

		var $usernameDiv = $('<span class="username"/>')
			.text(data.username)
			.css('color', getUsernameColor(data.username));
		var $messageBodyDiv = $('<span class="messageBody">')
			.text(data.message);

		// add time
		var messageTime = (new Date()).getHours().toString() + ':' + (new Date()).getMinutes().toString() + ':' + (new Date()).getSeconds().toString();
		var $messageTimeDiv = $('<span class="messageTime">')
			.text(messageTime);

		var typingClass = data.typing ? 'typing' : '';
		var $messageDiv = $('<li class="message"/>')
			.data('username', data.username)
			.addClass(typingClass)
			.append($usernameDiv, $messageBodyDiv, $messageTimeDiv);

		addMessageElement($messageDiv, options);
	}

	// display typing
	function addChatTyping(data) {
		data.typing = true;
		data.message = 'is typing';
		addChatMessage(data);
	}

	// remove typing
	function removeChatTyping(data) {
		getTypingMessages(data).fadeOut(function() {
			$(this).remove();
		});
	}

	// add an element to the page and scroll to bottom
	function addMessageElement(el, options) {
		var $el = $(el);

		if (!options) {
			options = {};
		}

		if (typeof options.fade === 'undefined') {
			options.fade = false;
		}

		if (typeof options.prepent === 'undefined') {
			options.prepend = false;
		}

		// options
		if (options.fade) {
			$el.hide().fadeIn(FADE_TIME);
		}
		if (options.prepend) {
			$messages.prepent($el);
		} else {
			$messages.append($el);
		}
		$messages[0].scrollTop = $messages[0].scrollHeight;
	}

	// prevent input from having markup
	function cleanInput(input) {
		return $('<div/>').text(input).text();
	}

	// updates typing event
	function updateTyping() {
		if (connected) {
			if (!typing) {
				typing = true;
				socket.emit('typing');
			}
			lastTypingTime = (new Date()).getTime();

			// if user idle
			setTimeout(function() {
				var typingTimer = (new Date()).getTime();
				var timeDiff = typingTimer - lastTypingTime;
				if (timeDiff >= TYPING_TIMER_LENGTH && typing) {
					socket.emit('stop typing');
					typing = false;
				}
			}, TYPING_TIMER_LENGTH);
		}
	}

	// get 'X is typing'
	function getTypingMessages(data) {
		return $('.message.typing').filter(function() {
			return $(this).data('username') === data.username;
		});
	}

	// hash user name color
	function getUsernameColor(username) {
		var hash = 7;
		for (var i = 0; i < username.length; i++) {
			hash = username.charCodeAt(i) + (hash << 5) - hash;
		}
		var index = Math.abs(hash % COLORS.length);
		return COLORS[index];
	}

	// keyboard event
	$window.keydown(function(event) {
		// focus on current input when a key is pressed
		if (!(event.ctrlKey || event.metaKey || event.altKey)) {
			$currentInput.focus();
		}

		// when enter key is hit
		if (event.which === 13) {
			if (username) {
				sendMessage();
				socket.emit('stop typing');
				typing = false;
			} else {
				setUsername();
			}
		}
	});

	$inputMessage.on('input', function() {
		updateTyping();
	});

	// click events
	$loginPage.click(function() {
		$currentInput.focus();
	});

	$inputMessage.click(function() {
		$inputMessage.focus();
	});

	// socket events

	// login
	socket.on('login', function(data) {
		connected = true;

		var message = 'Welcome to FSE Chatroom!';
		log(message, {
			prepend: true
		});
		addParticipantMessage(data);
	});

	// new message
	socket.on('new message', function(data) {
		addChatMessage(data);
	});

	// user joined
	socket.on('user joined', function(data) {
		log(data.username + ' joined');
		addParticipantMessage(data);
	});

	// user left
	socket.on('user left', function(data) {
		log(data.username + ' left');
		addParticipantMessage(data);
		removeChatTyping(data);
	});

	// show typing
	socket.on('typing', function(data) {
		addChatTyping(data);
	});

	// stop typing
	socket.on('stop typing', function(data) {
		removeChatTyping(data);
	});

});

