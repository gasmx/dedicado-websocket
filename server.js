var http = require('http');
var server = http.createServer((request, response) => {});
var socketport = process.env.PORT || 5000;

server.listen(socketport, () => {
    console.log((new Date()) + ' Socket Server em pé na porta '+ socketport);
});

var WebSocketServer = require('websocket').server;
wsServer = new WebSocketServer({
    httpServer: server
});

function originIsAllowed(origin) {
  // put logic here to detect whether the specified origin is allowed.
  return true;
}

function sendMessageToConnectedClients(clients, message, sender = null) {
  // Envia a mensagem para todos os clientes, exceto o remetente
  for (var i in clients){
     if (null != sender && sender == i) {
        continue;
     }
     clients[i].send(message.data);
  }
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

    console.log((new Date()) + ' Connection accepted. ID: '+ id +' [' + clients[id].remoteAddress + '].');

    connection.on('message', function(message) {
      if (message.type === 'utf8') {
          // console.log('Received Message: ' + message.utf8Data);
          message.data = message.utf8Data;
      } else if (message.type === 'binary') {
          // console.log('Received Binary Message of ' + message.binaryData.length + ' bytes');
          message.data = message.utf8Data.length;
      }

      sendMessageToConnectedClients(clients, message, id);
    });

    connection.on('close', function(reasonCode, description) {
        delete clients[id];
        console.log((new Date()) + ' Connection closed. ID: '+ id +' [' + connection.remoteAddress + '].');
    });
});

wsServer.on('sync', function(data) {
    // console.log('Notificando clientes que irão sincronizar.');
    let message = { data: data };
    sendMessageToConnectedClients(clients, message);
});

/* ============================================================ */

var express = require('express'),
    app = express()
    bodyParser = require('body-parser');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

var webport = process.env.PORT || 4000;
var router = express.Router();

var emitir = function(req, res, next){
  wsServer.emit('sync', JSON.stringify(req.body));
  next();
}

app.listen(webport);

app.use(emitir);

app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

app.use('/api', router);

router.route('/sincronizar')
  .post(function(req, res){
    res.json({message: "Notificação enviada.."});
  });

console.log((new Date()) + ' Web Server em pé na porta ' + webport);