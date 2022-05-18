/**********************************/
/* Set up the static file server*/
let static = require("node-static");


/* Set up HTTP server */
let http = require("http");

/* Assume that we are running on Heroku */
let port = process.env.PORT;
let directory = __dirname + '/public';

/* If not on Heroku, then adjust port and directory */
if ((typeof port == "undefined") || (port === null)) {
	port = 8080;
	directory = "./public";
}

/* Set up static file webserver to deliver files from hard drive */
let file = new static.Server(directory);

let app = http.createServer(
	function(request, response) {
		request.addListener("end", 
			function() {
				file.serve(request, response);
			}
		).resume();
	}

).listen(port);

console.log("The server is running"); 




/* Set up websocket webserver */
/* Set up registry of players and their socket IDs */
let players = [];

const {Server} = require("socket.io");
const io = new Server(app);

io.on('connection', (socket) => {
	/*Output a log message on the server and send it to the clients.*/

	function serverLog(...messages){
		io.emit('log', ['**** Message from the server:\n']);
		messages.forEach((item) => {
			io.emit('log,' ['****\t' + item]);
			console.log(item);
		});
	}

	serverLog('a page connected to the server: ' + socket.id);


 	

	socket.on('join_room', (payload) => {
		serverLog('Server received command', '\'join_room\' ', JSON.stringify(payload));
		if ((typeof payload == 'undefined') || (payload === null)) {
			response = {};
			response.result = 'fail';
			response.message = 'client did not send a payload';
			socket.emit('join_room_response', response);
			serverLog('join_room command failed', JSON.stringify(response));
			return;
		}

	let room = payload.room;
	let username = payload.username;
	if ((typeof room == 'undefined') || (room === null)) {
			response = {};
			response.result = 'fail';
			response.message = 'client did not send a valid room to join';
			socket.emit('join_room_response', response);
			serverLog('join_room command failed', JSON.stringify(response));
			return; 
		}

	if ((typeof username == 'undefined') || (username === null)) {
			response = {};
			response.result = 'fail';
			response.message = 'client did not send a valid username to join the chat room';
			socket.emit('join_room_response', response);
			serverLog('join_room command failed', JSON.stringify(response));
			return;
		}


	/*Handle the command*/
	socket.join(room);

	/*Make sure client was put into room*/
		io.in(room).fetchSockets().then((sockets) => {
			
			/*socket didn't join room*/
			if ((typeof sockets == 'undefined') || (sockets === null) || !sockets.includes(socket)) {
				response = {};
				response.result = 'fail';
				response.message = 'Server internal error joining chat room';
				socket.emit('join_room_response', response);
				serverLog('join_room command failed', JSON.stringify(response));
				return; 
				}
			/*socket joined room*/
			else {
				players[socket.id] = {
					username: username,
					room: room
				}

				/*Announce to everyone in the room who else is in the room */
				for (const member of sockets) {
					response = {
						result: 'success',
						socket_id: member.id,
						room:  players[member.id].room,
						username: players[member.id].username,
						count: sockets.length,
					}
				
			
				/*Tell everyone that user has joined chat room*/
				io.of("/").to(room).emit("join_room_response", response);
				serverLog("join_room succeeded ", JSON.stringify(response));
			}
		}
	});
});

socket.on('disconnect', () => {
	serverLog('a page disconnected from the server: ' + socket.id);
	if((typeof players[socket.id] != 'undefined') && (players[socket.id] != null)) {
		let payload = {
			username: players[socket.id].username,
			room: players[socket.id].room,
			count: Object.keys(players).length - 1, 
			socket_id: socket.id
		};

		let room = players[socket.id].room;
		delete players[socket.id];

		/*Tell everyone who left the room*/
		io.of("/").to(room).emit("player_disconnected", payload);
		serverLog("player_disconnected succeeded ", JSON.stringify(payload));
	}
});


/*************************************************************************/

		socket.on('send_chat_message', (payload) => {
			serverLog('Server received command', '\'send_chat_message\' ', JSON.stringify(payload));
			if ((typeof payload == 'undefined') || (payload === null)) {
				response = {};
				response.result = 'fail';
				response.message = 'client did not send a valid payload';
				socket.emit('send_chat_message_response', response);
				serverLog('send_chat_message command failed', JSON.stringify(response));
				return;
			}

		let room = payload.room;
		let username = payload.username;
		let message = payload.message;
		if ((typeof room == 'undefined') || (room === null)) {
				response = {};
				response.result = 'fail';
				response.message = 'client did not send a valid room to message';
				socket.emit('send_chat_message_response', response);
				serverLog('send_chat_message command failed', JSON.stringify(response));
				return; 
			}

		if ((typeof username == 'undefined') || (username === null)) {
				response = {};
				response.result = 'fail';
				response.message = 'client did not send a valid username as a message source';
				socket.emit('send_chat_message_response', response);
				serverLog('send_chat_message command failed', JSON.stringify(response));
				return;
			}

		if ((typeof message == 'undefined') || (message === null)) {
				response = {};
				response.result = 'fail';
				response.message = 'client did not send a valid message';
				socket.emit('send_chat_message_response', response);
				serverLog('send_chat_message command failed', JSON.stringify(response));
				return;
			}


		/*Handle the command*/
		let response = {};
		response.result = 'success';
		response.username = username;
		response.room = room;
		response.message = message;

		/*Tell everyone in the room what the message is*/
		io.of('/').to(room).emit('send_chat_message_response', response);
		serverLog('send_chat_message command succeeded', JSON.stringify(response));
		
	});

});