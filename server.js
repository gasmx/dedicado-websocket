var http = require('http');
var server = http.createServer((request, response) => {});

server.listen(80, () => {
    console.log((new Date()) + ' Server is listening on port 80');
});

var WebSocketServer = require('websocket').server;
wsServer = new WebSocketServer({
    httpServer: server
});

function originIsAllowed(origin) {
  // put logic here to detect whether the specified origin is allowed. 
  return true;
}

var count = 0;
var clients = {};

wsServer.on('request', function(request) {
    if (!originIsAllowed(request.origin)) {
      // Make sure we only accept requests from an allowed origin 
      request.reject();
      console.log((new Date()) + ' Connection from origin ' + request.origin + ' rejected.');
      return;
    }
    
    // var connection = request.accept('echo-protocol', request.origin);
    var connection = request.accept(null, request.origin);

    // Specific id for this client & increment count
    var id = count++;
    // Store the connection method so we can loop through & contact all clients
    clients[id] = connection;

    console.log((new Date()) + ' Connection accepted [' + id + ']');

    connection.on('message', function(message) {
    	// The string message that was sent to us
	    var msgString = message.utf8Data;

	    // Loop through all clients
	    for(var i in clients){
	    	if (i == id) {
	    		continue;
	    	}
	        // Send a message to the client with the message
	        clients[i].sendUTF(msgString);
	    }

        // if (message.type === 'utf8') {
        //     console.log('Received Message: ' + message.utf8Data);
        //     connection.sendUTF(message.utf8Data);
        // }
        // else if (message.type === 'binary') {
        //     console.log('Received Binary Message of ' + message.binaryData.length + ' bytes');
        //     connection.sendBytes(message.binaryData);
        // }
    });
    connection.on('close', function(reasonCode, description) {
        delete clients[id];
        console.log((new Date()) + ' Peer ' + connection.remoteAddress + ' disconnected.');
    });
});