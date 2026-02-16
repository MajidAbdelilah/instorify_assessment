// ================================
// API Configuration
// ================================

const API_BASE_URL = "http://localhost:3000";

// ================================
// State Management
// ================================

let currentFilter = "all";
let searchQuery = "";
let isDarkMode = localStorage.getItem("darkMode") === "true";

// ================================
// DOM Elements
// ================================

const elements = {
	todosList: document.getElementById("todosList"),
	addTodoForm: document.getElementById("addTodoForm"),
	todoInput: document.getElementById("todoInput"),
	prioritySelect: document.getElementById("prioritySelect"),
	searchInput: document.getElementById("searchInput"),
	filterButtons: document.querySelectorAll(".filter-btn"),
	loadingSpinner: document.getElementById("loadingSpinner"),
	errorMessage: document.getElementById("errorMessage"),
	emptyState: document.getElementById("emptyState"),
	themeToggle: document.getElementById("themeToggle"),
	toast: document.getElementById("toast"),
	toastMessage: document.getElementById("toastMessage"),
	statTotal: document.getElementById("statTotal"),
	statPending: document.getElementById("statPending"),
	statCompleted: document.getElementById("statCompleted"),
	statRate: document.getElementById("statRate"),
};

// ================================
// Initialization
// ================================

document.addEventListener("DOMContentLoaded", () => {
	initializeApp();
	setupEventListeners();
	loadTodos();
	loadStats();
});

function initializeApp() {
	// Initialize dark mode
	if (isDarkMode) {
		document.documentElement.setAttribute("data-theme", "dark");
	}
}

function setupEventListeners() {
	// Form submission
	elements.addTodoForm.addEventListener("submit", handleAddTodo);

	// Search input
	elements.searchInput.addEventListener("input", debounce(handleSearch, 300));

	// Filter buttons
	elements.filterButtons.forEach((btn) => {
		btn.addEventListener("click", () => handleFilter(btn.dataset.filter));
	});

	// Theme toggle
	elements.themeToggle.addEventListener("click", toggleTheme);
}

// ================================
// Theme Management
// ================================

function toggleTheme() {
	isDarkMode = !isDarkMode;
	localStorage.setItem("darkMode", isDarkMode);

	if (isDarkMode) {
		document.documentElement.setAttribute("data-theme", "dark");
	} else {
		document.documentElement.removeAttribute("data-theme");
	}

	showToast(isDarkMode ? "Dark mode enabled 🌙" : "Light mode enabled ☀️");
}

// ================================
// API Functions
// ================================

async function fetchTodos(filter = null, search = null) {
	const params = new URLSearchParams();
	if (filter && filter !== "all") params.append("filter", filter);
	if (search) params.append("search", search);

	const url = `${API_BASE_URL}/todos${params.toString() ? "?" + params.toString() : ""}`;

	const response = await fetch(url);
	if (!response.ok) {
		throw new Error("Failed to fetch todos");
	}
	return response.json();
}

async function createTodo(title, priority) {
	const response = await fetch(`${API_BASE_URL}/todos`, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify({ title, priority }),
	});

	if (!response.ok) {
		const error = await response.json();
		throw new Error(error.error || "Failed to create todo");
	}

	return response.json();
}

async function updateTodo(id, updates) {
	const response = await fetch(`${API_BASE_URL}/todos/${id}`, {
		method: "PUT",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify(updates),
	});

	if (!response.ok) {
		const error = await response.json();
		throw new Error(error.error || "Failed to update todo");
	}

	return response.json();
}

async function deleteTodo(id) {
	const response = await fetch(`${API_BASE_URL}/todos/${id}`, {
		method: "DELETE",
	});

	if (!response.ok) {
		const error = await response.json();
		throw new Error(error.error || "Failed to delete todo");
	}

	return response.json();
}

async function fetchStats() {
	const response = await fetch(`${API_BASE_URL}/todos/stats`);
	if (!response.ok) {
		throw new Error("Failed to fetch stats");
	}
	return response.json();
}

// ================================
// Event Handlers
// ================================

async function handleAddTodo(e) {
	e.preventDefault();

	const title = elements.todoInput.value.trim();
	const priority = elements.prioritySelect.value;

	if (!title) {
		showError("Please enter a todo title");
		return;
	}

	try {
		showLoading(true);
		hideError();

		await createTodo(title, priority);

		// Reset form
		elements.todoInput.value = "";
		elements.prioritySelect.value = "medium";

		// Reload todos and stats
		await Promise.all([loadTodos(), loadStats()]);

		showToast("Todo added successfully! 🎉");
	} catch (error) {
		showError(error.message);
	} finally {
		showLoading(false);
	}
}

async function handleToggleComplete(id, currentStatus) {
	try {
		await updateTodo(id, { completed: !currentStatus });
		await Promise.all([loadTodos(), loadStats()]);
		showToast(currentStatus ? "Todo marked as pending" : "Todo completed! ✅");
	} catch (error) {
		showError(error.message);
	}
}

async function handleDeleteTodo(id) {
	if (!confirm("Are you sure you want to delete this todo?")) {
		return;
	}

	try {
		showLoading(true);
		await deleteTodo(id);
		await Promise.all([loadTodos(), loadStats()]);
		showToast("Todo deleted successfully");
	} catch (error) {
		showError(error.message);
	} finally {
		showLoading(false);
	}
}

function handleSearch(e) {
	searchQuery = e.target.value.trim();
	loadTodos();
}

function handleFilter(filter) {
	currentFilter = filter;

	// Update active button
	elements.filterButtons.forEach((btn) => {
		btn.classList.toggle("active", btn.dataset.filter === filter);
	});

	loadTodos();
}

// ================================
// Render Functions
// ================================

async function loadTodos() {
	try {
		showLoading(true);
		hideError();

		const todos = await fetchTodos(
			currentFilter !== "all" ? currentFilter : null,
			searchQuery || null,
		);

		renderTodos(todos);
	} catch (error) {
		showError(error.message);
	} finally {
		showLoading(false);
	}
}

async function loadStats() {
	try {
		const stats = await fetchStats();
		renderStats(stats);
	} catch (error) {
		console.error("Failed to load stats:", error);
	}
}

function renderTodos(todos) {
	elements.todosList.innerHTML = "";

	if (todos.length === 0) {
		elements.emptyState.classList.remove("hidden");
		elements.todosList.classList.add("hidden");
		return;
	}

	elements.emptyState.classList.add("hidden");
	elements.todosList.classList.remove("hidden");

	// Sort todos: pending first (high→med→low), then completed (high→med→low)
	const sortedTodos = sortTodos(todos);

	sortedTodos.forEach((todo, index) => {
		const todoElement = createTodoElement(todo, index);
		elements.todosList.appendChild(todoElement);
	});
}

function createTodoElement(todo, index) {
	const div = document.createElement("div");
	div.className = `todo-item priority-${todo.priority} ${todo.completed ? "completed" : ""}`;
	div.style.animationDelay = `${index * 0.05}s`;

	const formattedDate = formatDate(todo.createdAt);

	div.innerHTML = `
        <div class="todo-checkbox ${todo.completed ? "checked" : ""}"
             onclick="handleToggleComplete(${todo.id}, ${todo.completed})">
        </div>
        <div class="todo-content">
            <div class="todo-header">
                <span class="todo-title">${escapeHtml(todo.title)}</span>
                <span class="priority-badge ${todo.priority}">${todo.priority}</span>
            </div>
            <div class="todo-date">
                ${formattedDate}
            </div>
        </div>
        <div class="todo-actions">
            <button class="btn-icon btn-delete" onclick="handleDeleteTodo(${todo.id})" aria-label="Delete todo">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="3 6 5 6 21 6"></polyline>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                <line x1="10" y1="11" x2="10" y2="17"></line>
                <line x1="14" y1="11" x2="14" y2="17"></line>
            </svg>
            </button>
        </div>
    `;

	return div;
}

function renderStats(stats) {
	elements.statTotal.textContent = stats.total;
	elements.statPending.textContent = stats.pending;
	elements.statCompleted.textContent = stats.completed;
	elements.statRate.textContent = `${stats.completionRate}%`;
}

// ================================
// UI Helper Functions
// ================================

function showLoading(show) {
	if (show) {
		elements.loadingSpinner.classList.remove("hidden");
		elements.todosList.style.opacity = "0.5";
	} else {
		elements.loadingSpinner.classList.add("hidden");
		elements.todosList.style.opacity = "1";
	}
}

function showError(message) {
	elements.errorMessage.textContent = message;
	elements.errorMessage.classList.remove("hidden");

	// Auto-hide after 5 seconds
	setTimeout(() => {
		hideError();
	}, 5000);
}

function hideError() {
	elements.errorMessage.classList.add("hidden");
}

function showToast(message) {
	elements.toastMessage.textContent = message;
	elements.toast.classList.remove("hidden");
	elements.toast.classList.add("show");

	setTimeout(() => {
		elements.toast.classList.remove("show");
		setTimeout(() => {
			elements.toast.classList.add("hidden");
		}, 300);
	}, 3000);
}

// ================================
// Utility Functions
// ================================

function sortTodos(todos) {
	// Priority order mapping for sorting
	const priorityOrder = {
		high: 1,
		medium: 2,
		low: 3,
	};

	return todos.sort((a, b) => {
		// First, sort by completion status (pending first)
		if (a.completed !== b.completed) {
			return a.completed ? 1 : -1;
		}

		// Then, sort by priority (high → medium → low)
		return priorityOrder[a.priority] - priorityOrder[b.priority];
	});
}

function formatDate(dateString) {
	const date = new Date(dateString);
	const now = new Date();
	const diffMs = now - date;
	const diffMins = Math.floor(diffMs / 60000);
	const diffHours = Math.floor(diffMs / 3600000);
	const diffDays = Math.floor(diffMs / 86400000);

	if (diffMins < 1) {
		return "Just now";
	} else if (diffMins < 60) {
		return `${diffMins} minute${diffMins > 1 ? "s" : ""} ago`;
	} else if (diffHours < 24) {
		return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
	} else if (diffDays < 7) {
		return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
	} else {
		return date.toLocaleDateString("en-US", {
			year: "numeric",
			month: "short",
			day: "numeric",
		});
	}
}

function escapeHtml(text) {
	const div = document.createElement("div");
	div.textContent = text;
	return div.innerHTML;
}

function debounce(func, wait) {
	let timeout;
	return function executedFunction(...args) {
		const later = () => {
			clearTimeout(timeout);
			func(...args);
		};
		clearTimeout(timeout);
		timeout = setTimeout(later, wait);
	};
}

// ================================
// Auto-refresh stats periodically
// ================================

setInterval(() => {
	loadStats();
}, 30000); // Refresh stats every 30 seconds
