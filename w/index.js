var socket = io();

var activeUsers;

var users;
var me;

var lobby;

var caps = false;

var chat;

var chatBox = "";
var chatBoxActive = false;

var settings;

var nickname = "";

var mouseDownLastFrame = false;

socket.on('settings', (msg) => {
	settings = msg;
});

function joinLobby(id) {
	activeUsers, users, lobby, chat = undefined;
	nickname = "";
	lobby = io.connect(window.location.host + '/lobby/' + id);
	
	lobby.on('active users', (msg) => {
		activeUsers = msg;
		me = activeUsers[lobby.id];
	});

	lobby.on('users', (msg) => {
		users = msg;
	});

	lobby.on('chat', (msg) => {
		chat = msg;
		console.log(chat);
	});
}

socket.on('join lobby', (msg) => {
	joinLobby(msg);
});

function setup() {
	let s = 40;
	createCanvas(16*s, 9*s);
}

function sendInput(keyCode) {
	if (
		lobby &&
		(keyCode === LEFT_ARROW ||
		keyCode === RIGHT_ARROW)
	) {
		lobby.emit('user input', keyCode === LEFT_ARROW ? 'left' : 'right');
	}
}

function keyCodeToCharacter(keyCode) {
	return (
		(keyCode >= 65 && keyCode <= 90) ||
		(keyCode >= 48 && keyCode <= 57) ?
		key :
		(keyCode === 32 ?
			" " :
			""
		)
	);
}

function keyPressed() {
	if (lobby && activeUsers && users && settings) {
		if (!me.nickname) {
			if (keyCode === 13 && nickname.length >= 3) {
				lobby.emit('set nickname', nickname);
			} else if (keyCode === 8 && nickname.length > 0) {
				nickname = nickname.substr(0, nickname.length-1);
			} else {
				nickname += keyCodeToCharacter(keyCode);
			}
		} else if (chatBoxActive) {
			if (keyCode === 13 && chatBox.length > 0) {
				lobby.emit('send chat', chatBox);
				chatBox = "";
			} else if (keyCode === 27) {
				chatBoxActive = false;
			} else if (keyCode === 8 && chatBox.length > 0) {
				chatBox = chatBox.substr(0, chatBox.length-1);
			} else {
				chatBox += keyCodeToCharacter(keyCode);
			}
		}
	}
}

function draw() {
	var mouseClicked = mouseIsPressed && !mouseDownLastFrame;

	background(255*0.9);
	if (!lobby) {
		push();
		if (mouseX <= 100 && mouseY <= 40) {
			fill(0, 255, 0);
			if (mouseClicked) {
				socket.emit('create lobby', '');
			}
		} else {
			fill(80, 255, 80);
		}
		rect(0, 0, 100, 40);
		pop();
	} else if (lobby && activeUsers && users && settings) {
		if (me.nickname === undefined) {
			push();
			textAlign(CENTER, CENTER);
			text((nickname === "" ? "Type nickname" : nickname), width/2, height/2);
			pop();
		} else {
			push();
			textAlign(LEFT, TOP);
			
			let mouseOverChatBox = (
				mouseX >= width*0.8 &&
				mouseX <= width &&
				mouseY >= height*0.1 &&
				mouseY <= height*0.2
			);

			if (mouseClicked) {
				chatBoxActive = mouseOverChatBox;
			}

			fill(chatBoxActive ? 255*0.98 : (mouseOverChatBox ? 255*0.97 : 255));
			rect(width*0.8, height*0.1,width*0.2, height*0.1);
			fill(0);
			textSize(16);
			text(chatBox + (chatBoxActive && Math.floor(millis()/800)%2 ? "|" : ""), width*0.81, height*0.11, width*0.09, height*0.09);

			var s = "";
			for (let i = chat.length-1; i > -1; i--) {
				let c = chat[i];
				s += (users[c.senderID].nickname + ": " + c.msg + "\n");
			}
			
			fill(255);
			rect(width*0.8, height*0.2, width*0.2, height*0.8);
			fill(0);
			textSize(16);
			text(s, width*0.85, height*0.21, width*0.1, height*0.79);
			
			translate(width*0.825, height*0.6);
			textAlign(CENTER, CENTER);
			rotate(-90*PI/180);
			textSize(24);
			text("CHAT", 0, 0);
			pop();
		}
	}
	mouseDownLastFrame = mouseIsPressed;
}