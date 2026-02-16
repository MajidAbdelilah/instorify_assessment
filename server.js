const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, 'todos.json');

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// In-memory storage with file persistence
let todos = [];
let nextId = 1;

// Load todos from file on startup
function loadTodos() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const data = fs.readFileSync(DATA_FILE, 'utf8');
      const parsed = JSON.parse(data);
      todos = parsed.todos || [];
      nextId = parsed.nextId || 1;
      console.log(`Loaded ${todos.length} todos from file`);
    }
  } catch (error) {
    console.error('Error loading todos:', error.message);
    todos = [];
    nextId = 1;
  }
}

// Save todos to file
function saveTodos() {
  try {
    const data = JSON.stringify({ todos, nextId }, null, 2);
    fs.writeFileSync(DATA_FILE, data, 'utf8');
  } catch (error) {
    console.error('Error saving todos:', error.message);
  }
}

// Input validation middleware
function validateTodo(req, res, next) {
  const { title } = req.body;

  if (!title || typeof title !== 'string') {
    return res.status(400).json({
      error: 'Title is required and must be a string'
    });
  }

  if (title.trim().length === 0) {
    return res.status(400).json({
      error: 'Title cannot be empty'
    });
  }

  if (title.length > 500) {
    return res.status(400).json({
      error: 'Title must be less than 500 characters'
    });
  }

  next();
}

// Validate priority if provided
function validatePriority(priority) {
  const validPriorities = ['low', 'medium', 'high'];
  return !priority || validPriorities.includes(priority);
}

// API Routes

// GET /todos - Get all todos with optional filtering
app.get('/todos', (req, res) => {
  try {
    const { filter, search } = req.query;
    let filteredTodos = [...todos];

    // Apply completion filter
    if (filter === 'completed') {
      filteredTodos = filteredTodos.filter(todo => todo.completed);
    } else if (filter === 'pending') {
      filteredTodos = filteredTodos.filter(todo => !todo.completed);
    }

    // Apply search
    if (search && typeof search === 'string') {
      const searchLower = search.toLowerCase().trim();
      filteredTodos = filteredTodos.filter(todo =>
        todo.title.toLowerCase().includes(searchLower)
      );
    }

    res.json(filteredTodos);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /todos/stats - Get statistics about todos
app.get('/todos/stats', (req, res) => {
  try {
    const completed = todos.filter(todo => todo.completed).length;
    const pending = todos.filter(todo => !todo.completed).length;
    const total = todos.length;

    const priorityCounts = {
      low: todos.filter(todo => todo.priority === 'low').length,
      medium: todos.filter(todo => todo.priority === 'medium').length,
      high: todos.filter(todo => todo.priority === 'high').length
    };

    res.json({
      total,
      completed,
      pending,
      completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
      priorityCounts
    });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /todos/:id - Get a specific todo
app.get('/todos/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);

    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid todo ID' });
    }

    const todo = todos.find(t => t.id === id);

    if (!todo) {
      return res.status(404).json({ error: 'Todo not found' });
    }

    res.json(todo);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /todos - Create a new todo
app.post('/todos', validateTodo, (req, res) => {
  try {
    const { title, completed = false, priority = 'medium' } = req.body;

    // Validate priority
    if (!validatePriority(priority)) {
      return res.status(400).json({
        error: 'Priority must be one of: low, medium, high'
      });
    }

    const newTodo = {
      id: nextId++,
      title: title.trim(),
      completed: Boolean(completed),
      priority,
      createdAt: new Date().toISOString()
    };

    todos.push(newTodo);
    saveTodos();

    res.status(201).json(newTodo);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /todos/:id - Update a todo
app.put('/todos/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);

    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid todo ID' });
    }

    const todoIndex = todos.findIndex(t => t.id === id);

    if (todoIndex === -1) {
      return res.status(404).json({ error: 'Todo not found' });
    }

    const { title, completed, priority } = req.body;

    // Validate title if provided
    if (title !== undefined) {
      if (typeof title !== 'string') {
        return res.status(400).json({
          error: 'Title must be a string'
        });
      }
      if (title.trim().length === 0) {
        return res.status(400).json({
          error: 'Title cannot be empty'
        });
      }
      if (title.length > 500) {
        return res.status(400).json({
          error: 'Title must be less than 500 characters'
        });
      }
    }

    // Validate priority if provided
    if (priority !== undefined && !validatePriority(priority)) {
      return res.status(400).json({
        error: 'Priority must be one of: low, medium, high'
      });
    }

    // Update todo
    if (title !== undefined) {
      todos[todoIndex].title = title.trim();
    }
    if (completed !== undefined) {
      todos[todoIndex].completed = Boolean(completed);
    }
    if (priority !== undefined) {
      todos[todoIndex].priority = priority;
    }

    saveTodos();

    res.json(todos[todoIndex]);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /todos/:id - Delete a todo
app.delete('/todos/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);

    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid todo ID' });
    }

    const todoIndex = todos.findIndex(t => t.id === id);

    if (todoIndex === -1) {
      return res.status(404).json({ error: 'Todo not found' });
    }

    const deletedTodo = todos.splice(todoIndex, 1)[0];
    saveTodos();

    res.json({
      message: 'Todo deleted successfully',
      todo: deletedTodo
    });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// Load todos and start server
loadTodos();

const server = app.listen(PORT, () => {
  console.log(`✅ Todo API server running on http://localhost:${PORT}`);
  console.log(`📝 API endpoints available at http://localhost:${PORT}/todos`);
  console.log(`🌐 Frontend UI available at http://localhost:${PORT}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, closing server...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

module.exports = app;
