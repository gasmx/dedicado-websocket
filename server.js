var http = require('http');
var server = http.createServer((request, response) => {});

server.listen(4555, () => {
    console.log((new Date()) + ' Server is listening on port 4555');
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

wsServer.on('sync', function(msg) {
    console.log('Notificando clientes que irão sincronizar.');

    for(var i in clients){
        clients[i].sendUTF(msg);
    }
});

/*  Dispara um evento de sync após 15 segundos,
    isto pode ser usado para disparar um evento do websocket ao acessar
    uma rota através da API */
// setTimeout(function() {
//    wsServer.emit('sync', 'Mensagem enviada pelo setTimeOut');
// }, 10000);

/* ================ */

var express = require('express'),
    app = express()
    bodyParser = require('body-parser');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

var port = process.env.PORT || 80;
var router = express.Router();

var emitir = function(req, res, next){
  wsServer.emit('sync', 'Mensagem enviada pela rota acessada!');
  next();
}

app.listen(port);

app.use(emitir);

app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

app.use('/api', router);

router.route('/sincronizar')
  .get(function(req, res){
    res.json({message: "Há registros para sincronizar."});
  });


console.log('Conectado a porta ' + port);