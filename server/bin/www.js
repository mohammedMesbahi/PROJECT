#!/usr/bin/env node

/**
 * Module dependencies.
 */

var app = require('../app');
var debug = require('debug')('project:server');
var http = require('http');
var cookie = require('cookie');
const { verifyToken } = require('../lib/authTools')
/**
 * Get port from environment and store in Express.
 */

var port = normalizePort(process.env.PORT || '3000');
app.set('port', port);

/**
 * Create HTTP server.
 */

var server = http.createServer(app);

/*  ********** integrating socketIo ✔🎉 ********
 */

const { Server } = require("socket.io");
const { default: axios } = require('axios');
const io = new Server(server);
let connectedUsers = [];
// a middleware to authenticate a user
io.of("/chat").use((socket, next) => {
  var cookies = cookie.parse(socket.handshake.headers.cookie || '');
  verifyToken(cookies.jwt)
    .then(user => {
      socket.user = user;
      socket.id = user.userid;
      next();
    })
    .catch(err => {
      next(err);
    });
});
// on each connection update the list of connected users and send it to other users
io.of('/chat').on('connection', (socket) => {
  if (!connectedUsers.find((user) => user == socket.id)) {
    connectedUsers.push(socket.id);
    io.of('/chat').emit('connection', { ConnectedUsers: connectedUsers })
  }
  socket.on('message', (message) => {
    message["sender"] = socket.id;
    message["sendername"] = socket.user.name;
    io.of('/chat').to(message.reciever).emit('message', message)
  })
  socket.on('disconnect', () => {
    connectedUsers = connectedUsers.filter((user) => user !== socket.id);
    io.of('/chat').emit('disconnetion', { ConnectedUsers: connectedUsers })
  });



});

// *********************************************************** 🤞🤞 ********************************

/**
 * Listen on provided port, on all network interfaces.
 */

server.listen(port);
server.on('error', onError);
server.on('listening', onListening);

/**
 * Normalize a port into a number, string, or false.
 */

function normalizePort(val) {
  var port = parseInt(val, 10);

  if (isNaN(port)) {
    // named pipe
    return val;
  }

  if (port >= 0) {
    // port number
    return port;
  }

  return false;
}

/**
 * Event listener for HTTP server "error" event.
 */

function onError(error) {
  if (error.syscall !== 'listen') {
    throw error;
  }

  var bind = typeof port === 'string'
    ? 'Pipe ' + port
    : 'Port ' + port;

  // handle specific listen errors with friendly messages
  switch (error.code) {
    case 'EACCES':
      console.error(bind + ' requires elevated privileges');
      process.exit(1);
      break;
    case 'EADDRINUSE':
      console.error(bind + ' is already in use');
      process.exit(1);
      break;
    default:
      throw error;
  }
}

/**
 * Event listener for HTTP server "listening" event.
 */

function onListening() {
  var addr = server.address();
  var bind = typeof addr === 'string'
    ? 'pipe ' + addr
    : 'port ' + addr.port;
  debug('Listening on ' + bind);
}
