const buffer = require('buffer');
if (!buffer.SlowBuffer) buffer.SlowBuffer = buffer.Buffer;
const express = require('express');
const http = require('http'); // Required for socket.io
const { Server } = require('socket.io');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db'); 
const userRoutes = require("./routes/userRoutes")
const mealRoutes = require("./routes/mealRoutes")
const authRoutes = require("./routes/authRoutes")
const otpRoutes = require("./routes/otpRoutes");
const orderRoutes = require("./routes/orderRoutes");
const foodRequestRoutes = require("./routes/foodRequestRoutes");
const reviewRoutes = require("./routes/reviewRoutes");

dotenv.config(); 

const app = express();
const server = http.createServer(app); // Wrap express app
const PORT = process.env.PORT || 5001; // Match frontend default port

// Initialize Socket.io
const io = new Server(server, {
  cors: {
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);
      if (
        origin === process.env.FRONTEND_URL ||
        origin.startsWith('http://localhost') ||
        origin.endsWith('.vercel.app') ||
        origin.endsWith('.web.app') ||
        origin.endsWith('.firebaseapp.com') ||
        origin.endsWith('craavyo.com')
      ) {
        return callback(null, true);
      } else {
        return callback(new Error('CORS policy violation'));
      }
    },
    methods: ["GET", "POST"]
  }
});

app.use((req, res, next) => {
  req.io = io;
  next();
});

connectDB();

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like curl requests or mobile apps)
    if (!origin) return callback(null, true);
    
    // Allow localhost, main domain, and any Firebase/Vercel preview link
    if (
      origin === process.env.FRONTEND_URL ||
      origin.startsWith('http://localhost') ||
      origin.endsWith('.vercel.app') ||
      origin.endsWith('.web.app') ||
      origin.endsWith('.firebaseapp.com') ||
      origin.endsWith('craavyo.com')
    ) {
      return callback(null, true);
    } else {
      return callback(new Error('CORS policy violation'));
    }
  },
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
  credentials: true
}));
app.use(express.json());

app.get('/', (req, res) => {
  res.send('Backend Running');
});

const { getCollegeRoom } = require('./utils/collegeHelper');

// Socket.io logic
io.on('connection', (socket) => {
  console.log('[Socket.IO] A client connected:', socket.id);

  // User-specific room for direct order & review events
  socket.on('join_room', (userId) => {
    if (userId) {
      const room = String(userId).trim();
      socket.join(room);
      console.log(`[Socket.IO] Socket ${socket.id} joined personal room: ${room}`);
    }
  });

  // College-specific room for campus-scoped meal feeds & custom food requests
  socket.on('join_college_room', (collegeName) => {
    if (collegeName) {
      const room = getCollegeRoom(collegeName);
      if (room) {
        // Leave any prior college rooms the socket might have been in
        for (const r of socket.rooms) {
          if (typeof r === 'string' && r.startsWith('college_') && r !== room) {
            socket.leave(r);
            console.log(`[Socket.IO] Socket ${socket.id} left old college room: ${r}`);
          }
        }
        socket.join(room);
        console.log(`[Socket.IO] Socket ${socket.id} joined college room: ${room} ("${collegeName}")`);
      }
    }
  });

  socket.on('disconnect', (reason) => {
    console.log(`[Socket.IO] Socket ${socket.id} disconnected (${reason})`);
  });
});

app.use("/api/users", userRoutes);
app.use("/api/meals",mealRoutes);
app.use("/api/auth",authRoutes);
app.use("/api/auth", otpRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/food-requests", foodRequestRoutes);
app.use("/api/reviews", reviewRoutes);

server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
