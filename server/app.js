const express = require('express');
const User = require('./database/models/user');
const app = express();

app.use(express.json());

// Routes
app.get('/api/users', (req, res) => {
  User.getAll((err, users) => {
    if (err) {
      res.status(500).json({ error: err.message });
    } else {
      res.json(users);
    }
  });
});

app.get('/api/users/:id', (req, res) => {
  const id = req.params.id;
  User.getById(id, (err, user) => {
    if (err) {
      res.status(500).json({ error: err.message });
    } else if (!user) {
      res.status(404).json({ error: 'User not found' });
    } else {
      res.json(user);
    }
  });
});

app.post('/api/users', (req, res) => {
  User.create(req.body, (err, userId) => {
    if (err) {
      res.status(500).json({ error: err.message });
    } else {
      res.status(201).json({ id: userId, ...req.body });
    }
  });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});