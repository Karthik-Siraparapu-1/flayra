const express = require('express');
const http = require('http');
const cors = require('cors');
const dotenv = require('dotenv');
const { Server } = require('socket.io');
const connectDB = require('./config/db');

// Load env vars
dotenv.config();

// Connect to Database
connectDB();

// Init Cron Jobs
require('./services/CronJobs')();

// Warm up Elite Bloom Filter
const BloomFilterService = require('./services/BloomFilterService');
BloomFilterService.warmUp().catch(err => console.error('[BLOOM] Failed to warm up:', err));

// Register Elite Background Event Handlers
const EventService = require('./services/EventService');
EventService.registerHandlers();

// Bootstrap Elite QuadTree (Precision Spatial Discovery)
const SpatialService = require('./services/SpatialService');
const User = require('./models/User');
User.find({ mapVisibility: true }).then(users => {
    SpatialService.rebuildTree(users);
}).catch(err => console.error('[SPATIAL] Failed to bootstrap QuadTree:', err));

const app = express();
const server = http.createServer(app);

// Middleware
app.use(cors());
app.use(express.json());

// Socket.IO Setup
const io = new Server(server, {
  cors: {
    origin: '*', // For development
    methods: ['GET', 'POST']
  }
});

require('./sockets')(io);

// Routes
app.use('/auth', require('./routes/auth'));
app.use('/user', require('./routes/user'));
app.use('/users', require('./routes/discover'));
app.use('/swipe', require('./routes/swipe'));
app.use('/match', require('./routes/match'));
app.use('/message', require('./routes/message'));
app.use('/reels', require('./routes/reels'));
app.use('/community', require('./routes/community'));
app.use('/recording', require('./routes/recording'));

app.get('/', (req, res) => {
  res.send('Flayra API is running...');
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
