const express = require('express');
const app = express();
const cors = require('cors');
require('dotenv').config();
const bodyParser = require('body-parser');
const mongoose = require('mongoose');

app.use(cors());
app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Connect to MongoDB (Replace with your MongoDB URI)
mongoose.connect('mongodb+srv://katlegoshomangjunior:abc12345@cluster0.5g35z4j.mongodb.net/?retryWrites=true&w=majority', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

const db = mongoose.connection;

db.on('error', (err) => {
  console.error('Database connection error:', err);
});

db.once('open', () => {
  console.log('Connected to the database!');
});

db.once('close', () => {
  console.log('Database connection closed.');
});

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

// Define User and Exercise models
const userSchema = new mongoose.Schema({
  username: { type: String, required: true }
});

const exerciseSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, required: true },
  description: { type: String, required: true },
  duration: { type: Number, required: true },
  date: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);
const Exercise = mongoose.model('Exercise', exerciseSchema);

// API routes

// Create a new user
app.post('/api/users', async (req, res) => {
  try {
    const { username } = req.body;
    if (!username) {
      throw new Error('Username is required.');
    }
    const user = new User({ username });
    const savedUser = await user.save();
    res.json({ username: savedUser.username, _id: savedUser._id });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get a list of all users
app.get('/api/users', async (req, res) => {
  try {
    const users = await User.find({}, 'username _id');
    res.json(users);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Add an exercise for a user
app.post('/api/users/:_id/exercises', async (req, res) => {
  try {
    const userId = req.params._id;
    const { description, duration, date } = req.body;

    const exercise = new Exercise({ userId, description, duration });
    if (date) {
      exercise.date = new Date(date);
    }
    await exercise.save();

    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    res.json({
      username: user.username,
      _id: user._id,
      description: exercise.description,
      duration: exercise.duration,
      date: exercise.date.toDateString(), // Convert the date to a string in dateString format
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get a full exercise log of a user
app.get('/api/users/:_id/logs', async (req, res) => {
  // Inside the GET /api/users/:_id/logs route handler
const userId = req.params._id;
const { from, to, limit } = req.query;

const user = await User.findById(userId);
if (!user) {
  return res.status(404).json({ error: 'User not found' });
}

const query = { userId };

if (from || to) {
  query.date = {};

  if (from) {
    query.date.$gte = new Date(from);
  }

  if (to) {
    query.date.$lte = new Date(to);
  }
}

const exercises = await Exercise.find(query)
  .sort('-date')
  .limit(parseInt(limit) || undefined);

const formattedExercises = exercises.map((exercise) => ({
  description: exercise.description,
  duration: exercise.duration,
  date: exercise.date.toDateString(), // Use toDateString for the date property
}));

res.json({
  username: user.username,
  _id: user._id,
  count: formattedExercises.length,
  log: formattedExercises, // Use the formatted exercises array
});


});


const port = process.env.PORT || 3000;
const listener = app.listen(port, () => {
  console.log(`Your app is listening on port ${listener.address().port}`);
});
