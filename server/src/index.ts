import { createServer } from "http";
import { Server } from "socket.io";

const PORT = parseInt(process.env.PORT ?? "3001", 10);

const httpServer = createServer();
const io = new Server(httpServer, {
  cors: {
    origin: process.env.CORS_ORIGIN || "http://localhost:3000",
    methods: ["GET", "POST"],
  },
});

io.on("connection", (socket) => {
  console.log(`[server] Client connected: ${socket.id}`);

  socket.on("ping", (cb) => {
    if (typeof cb === "function") cb("pong");
  });

  socket.on("disconnect", (reason) => {
    console.log(`[server] Client disconnected: ${socket.id} (${reason})`);
  });
});

httpServer
  .listen(PORT, () => {
    console.log(`[server] Socket.IO server listening on port ${PORT}`);
  })
  .on("error", (err) => {
    console.error(`[server] Failed to listen on port ${PORT}:`, err.message);
    process.exit(1);
  });
