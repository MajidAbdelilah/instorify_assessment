const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_DIR = path.join(__dirname, "user_data");

// Create user_data directory if it doesn't exist
if (!fs.existsSync(DATA_DIR)) {
	fs.mkdirSync(DATA_DIR);
}

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static("public"));

// In-memory storage with file persistence (per user)
const userDataCache = new Map(); // Cache user data in memory

// Get user data file path
function getUserDataFile(userId) {
	return path.join(DATA_DIR, `todos_${userId}.json`);
}

// Validate user ID format
function isValidUserId(userId) {
	// Check if userId is a valid format (alphanumeric, hyphens, underscores, 8-64 chars)
	return (
		userId && typeof userId === "string" && /^[a-zA-Z0-9_-]{8,64}$/.test(userId)
	);
}

// Load todos for specific user
function loadUserTodos(userId) {
	try {
		// Check cache first
		if (userDataCache.has(userId)) {
			return userDataCache.get(userId);
		}

		const userFile = getUserDataFile(userId);
		if (fs.existsSync(userFile)) {
			const data = fs.readFileSync(userFile, "utf8");
			const parsed = JSON.parse(data);
			const userData = {
				todos: parsed.todos || [],
				nextId: parsed.nextId || 1,
			};
			userDataCache.set(userId, userData);
			return userData;
		}

		// Create new user data
		const userData = { todos: [], nextId: 0 };
		userDataCache.set(userId, userData);
		return userData;
	} catch (error) {
		console.error(`Error loading todos for user ${userId}:`, error.message);
		return { todos: [], nextId: 1 };
	}
}

// Save todos for specific user
function saveUserTodos(userId, todos, nextId) {
	try {
		const data = JSON.stringify({ todos, nextId }, null, 2);
		const userFile = getUserDataFile(userId);
		fs.writeFileSync(userFile, data, "utf8");

		// Update cache
		userDataCache.set(userId, { todos, nextId });
	} catch (error) {
		console.error(`Error saving todos for user ${userId}:`, error.message);
	}
}

// User ID validation middleware
function validateUserId(req, res, next) {
	const userId = req.headers["x-user-id"];

	if (!userId) {
		return res.status(401).json({
			error: "User ID is required. Please provide X-User-Id header.",
		});
	}

	if (!isValidUserId(userId)) {
		return res.status(400).json({
			error: "Invalid User ID format",
		});
	}

	req.userId = userId;
	next();
}

// Input validation middleware
function validateTodo(req, res, next) {
	const { title } = req.body;

	if (!title || typeof title !== "string") {
		return res.status(400).json({
			error: "Title is required and must be a string",
		});
	}

	if (title.trim().length === 0) {
		return res.status(400).json({
			error: "Title cannot be empty",
		});
	}

	if (title.length > 500) {
		return res.status(400).json({
			error: "Title must be less than 500 characters",
		});
	}

	next();
}

// Validate priority if provided
function validatePriority(priority) {
	const validPriorities = ["low", "medium", "high"];
	return !priority || validPriorities.includes(priority);
}

// API Routes

// GET /todos - Get all todos with optional filtering
app.get("/todos", validateUserId, (req, res) => {
	try {
		const { filter, search } = req.query;
		const userData = loadUserTodos(req.userId);
		let filteredTodos = [...userData.todos];

		// Apply completion filter
		if (filter === "completed") {
			filteredTodos = filteredTodos.filter((todo) => todo.completed);
		} else if (filter === "pending") {
			filteredTodos = filteredTodos.filter((todo) => !todo.completed);
		}

		// Apply search
		if (search && typeof search === "string") {
			const searchLower = search.toLowerCase().trim();
			filteredTodos = filteredTodos.filter((todo) =>
				todo.title.toLowerCase().includes(searchLower),
			);
		}

		res.json(filteredTodos);
	} catch (error) {
		res.status(500).json({ error: "Internal server error" });
	}
});

// GET /todos/stats - Get statistics about todos
app.get("/todos/stats", validateUserId, (req, res) => {
	try {
		const userData = loadUserTodos(req.userId);
		const todos = userData.todos;

		const completed = todos.filter((todo) => todo.completed).length;
		const pending = todos.filter((todo) => !todo.completed).length;
		const total = todos.length;

		const priorityCounts = {
			low: todos.filter((todo) => todo.priority === "low").length,
			medium: todos.filter((todo) => todo.priority === "medium").length,
			high: todos.filter((todo) => todo.priority === "high").length,
		};

		res.json({
			total,
			completed,
			pending,
			completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
			priorityCounts,
		});
	} catch (error) {
		res.status(500).json({ error: "Internal server error" });
	}
});

// GET /todos/:id - Get a specific todo
app.get("/todos/:id", validateUserId, (req, res) => {
	try {
		const id = parseInt(req.params.id, 10);

		if (isNaN(id)) {
			return res.status(400).json({ error: "Invalid todo ID" });
		}

		const userData = loadUserTodos(req.userId);
		const todo = userData.todos.find((t) => t.id === id);

		if (!todo) {
			return res.status(404).json({ error: "Todo not found" });
		}

		res.json(todo);
	} catch (error) {
		res.status(500).json({ error: "Internal server error" });
	}
});

// POST /todos - Create a new todo
app.post("/todos", validateUserId, validateTodo, (req, res) => {
	try {
		const { title, completed = false, priority = "medium" } = req.body;

		// Validate priority
		if (!validatePriority(priority)) {
			return res.status(400).json({
				error: "Priority must be one of: low, medium, high",
			});
		}

		const userData = loadUserTodos(req.userId);

		const newTodo = {
			id: userData.nextId++,
			title: title.trim(),
			completed: Boolean(completed),
			priority,
			createdAt: new Date().toISOString(),
		};

		userData.todos.push(newTodo);
		saveUserTodos(req.userId, userData.todos, userData.nextId);

		res.status(201).json(newTodo);
	} catch (error) {
		res.status(500).json({ error: "Internal server error" });
	}
});

// PUT /todos/:id - Update a todo
app.put("/todos/:id", validateUserId, (req, res) => {
	try {
		const id = parseInt(req.params.id, 10);

		if (isNaN(id)) {
			return res.status(400).json({ error: "Invalid todo ID" });
		}

		const userData = loadUserTodos(req.userId);
		const todoIndex = userData.todos.findIndex((t) => t.id === id);

		if (todoIndex === -1) {
			return res.status(404).json({ error: "Todo not found" });
		}

		const { title, completed, priority } = req.body;

		// Validate title if provided
		if (title !== undefined) {
			if (typeof title !== "string") {
				return res.status(400).json({
					error: "Title must be a string",
				});
			}
			if (title.trim().length === 0) {
				return res.status(400).json({
					error: "Title cannot be empty",
				});
			}
			if (title.length > 500) {
				return res.status(400).json({
					error: "Title must be less than 500 characters",
				});
			}
		}

		// Validate priority if provided
		if (priority !== undefined && !validatePriority(priority)) {
			return res.status(400).json({
				error: "Priority must be one of: low, medium, high",
			});
		}

		// Update todo
		if (title !== undefined) {
			userData.todos[todoIndex].title = title.trim();
		}
		if (completed !== undefined) {
			userData.todos[todoIndex].completed = Boolean(completed);
		}
		if (priority !== undefined) {
			userData.todos[todoIndex].priority = priority;
		}

		saveUserTodos(req.userId, userData.todos, userData.nextId);

		res.json(userData.todos[todoIndex]);
	} catch (error) {
		res.status(500).json({ error: "Internal server error" });
	}
});

// DELETE /todos/:id - Delete a todo
app.delete("/todos/:id", validateUserId, (req, res) => {
	try {
		const id = parseInt(req.params.id, 10);

		if (isNaN(id)) {
			return res.status(400).json({ error: "Invalid todo ID" });
		}

		const userData = loadUserTodos(req.userId);
		const todoIndex = userData.todos.findIndex((t) => t.id === id);

		if (todoIndex === -1) {
			return res.status(404).json({ error: "Todo not found" });
		}

		const deletedTodo = userData.todos.splice(todoIndex, 1)[0];
		saveUserTodos(req.userId, userData.todos, userData.nextId);

		res.json({
			message: "Todo deleted successfully",
			todo: deletedTodo,
		});
	} catch (error) {
		res.status(500).json({ error: "Internal server error" });
	}
});

// Health check endpoint
app.get("/health", (req, res) => {
	res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// 404 handler
app.use((req, res) => {
	res.status(404).json({ error: "Route not found" });
});

// Error handler
app.use((err, req, res, next) => {
	console.error(err.stack);
	res.status(500).json({ error: "Something went wrong!" });
});

// Start server (no need to load todos upfront - loaded per user on demand)
const server = app.listen(PORT, () => {
	console.log(`✅ Todo API server running on http://localhost:${PORT}`);
	console.log(`📝 API endpoints available at http://localhost:${PORT}/todos`);
	console.log(`🌐 Frontend UI available at http://localhost:${PORT}`);
});

// Graceful shutdown
process.on("SIGTERM", () => {
	console.log("SIGTERM received, closing server...");
	server.close(() => {
		console.log("Server closed");
		process.exit(0);
	});
});

module.exports = app;
