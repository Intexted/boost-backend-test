// backend/app.js
const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const app = express();
const server = http.createServer(app);
const io = socketIo(server);
const cors = require("cors");

app.use(cors());

const rooms = {};

io.on("connection", (socket) => {
  console.log("a user connected", socket.id);

  socket.on("create-room", (roomId) => {
    if (!rooms[roomId]) {
      rooms[roomId] = [];
    }
    rooms[roomId].push(socket.id);
    socket.join(roomId);
    console.log(`Room ${roomId} created by ${socket.id}`);
  });

  socket.on("join-room", (roomId) => {
    if (rooms[roomId]) {
      rooms[roomId].push(socket.id);
      socket.join(roomId);
      console.log(`User ${socket.id} joined room ${roomId}`);
      socket.to(roomId).emit("user-connected", socket.id);
    } else {
      console.log(`Room ${roomId} does not exist`);
    }
  });

  socket.on("offer", (offer, roomId) => {
    socket.to(roomId).emit("offer", offer, socket.id);
  });

  socket.on("answer", (answer, roomId) => {
    socket.to(roomId).emit("answer", answer, socket.id);
  });

  socket.on("ice-candidate", (candidate, roomId) => {
    socket.to(roomId).emit("ice-candidate", candidate, socket.id);
  });

  socket.on("disconnect", () => {
    for (const roomId in rooms) {
      rooms[roomId] = rooms[roomId].filter((id) => id !== socket.id);
      if (rooms[roomId].length === 0) {
        delete rooms[roomId];
      } else {
        socket.to(roomId).emit("user-disconnected", socket.id);
      }
    }
    console.log(`User ${socket.id} disconnected`);
  });
});

server.listen(5000, () => {
  console.log("listening on *:5000");
});
