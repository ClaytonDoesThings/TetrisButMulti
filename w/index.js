var socket = io();

var activeUsers;

var users;

var lobby;

var chat;

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
	return (keyCode >= 65 && keyCode <= 90 ?
		String.fromCharCode(keyCode+32) :
		(keyCode >= 48 && keyCode <= 57 ?
			String.fromCharCode(keyCode) :
			(keyCode === 32 ?
				" " :
				""
			)
		)
	);
}

function keyPressed() {
	if (lobby && activeUsers && users && settings && !users[lobby.id].nickname) {
		if (keyCode === 13 && nickname.length >= 3) {
			lobby.emit('set nickname', nickname);
		} else {
			nickname += keyCodeToCharacter(keyCode);
		}
	} else {
		sendInput(keyCode);
	}
}

function draw() {
	background(255*0.9);
	if (!lobby) {
		push();
		if (mouseX <= 100 && mouseY <= 40) {
			fill(0, 255, 0);
			if (mouseIsPressed && !mouseDownLastFrame) {
				socket.emit('create lobby', '');
			}
		} else {
			fill(80, 255, 80);
		}
		rect(0, 0, 100, 40);
		pop();
	} else if (lobby && activeUsers && users && settings) {
		if (users[lobby.id].nickname === undefined) {
			push();
			textAlign(CENTER, CENTER);
			text((nickname === "" ? "Type nickname" : nickname), width/2, height/2);
			pop();
		} else {
			push();
			textAlign(LEFT, TOP);
			var s = "";
			for (let i = chat.length-1; i > -1; i--) {
				let c = chat[i];
				s += (users[c.senderID].nickname + ": " + c.msg + "\n");
			}
			fill(255);
			rect(width*0.8, height*0.2, width*0.2, height*0.8);
			fill(0);
			textSize(16);
			text(s, width*0.85, height*0.2, width*0.1, height*0.8);
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