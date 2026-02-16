# Todo List API 📝

A fully-featured Todo List application with a beautiful, responsive frontend and a robust REST API backend. Built with Node.js, Express, and vanilla JavaScript.

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![License](https://img.shields.io/badge/license-ISC-green)

## 📋 Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Installation](#installation)
- [Running the Application](#running-the-application)
- [Running Tests](#running-tests)
- [API Documentation](#api-documentation)
- [Frontend Features](#frontend-features)
- [Project Structure](#project-structure)
- [Design Decisions](#design-decisions)
- [Challenges & Solutions](#challenges--solutions)
- [Future Improvements](#future-improvements)

## ✨ Features

### Core Features
- ✅ Create, Read, Update, and Delete todos
- ✅ Mark todos as complete/incomplete
- ✅ Beautiful, responsive UI that works on desktop and mobile
- ✅ Real-time statistics dashboard
- ✅ Search functionality to find todos by title
- ✅ Filter todos by status (all/pending/completed)
- ✅ Input validation with meaningful error messages
- ✅ Persistent storage (data saved to file)

### Bonus Features
- 🎨 Priority levels (low/medium/high) with visual indicators
- 🔍 Advanced search and filtering
- 📊 Statistics endpoint showing completion rates and priority counts
- 🌓 Dark mode toggle with smooth transitions
- ✨ Beautiful animations and transitions
- 💾 Data persistence across server restarts
- 📱 Fully responsive design
- 🎯 Toast notifications for user actions
- ⚡ Loading states for better UX

## 🛠 Tech Stack

### Backend
- **Node.js** - JavaScript runtime
- **Express.js** - Web framework for Node.js
- **CORS** - Enable cross-origin requests
- **File System (fs)** - Data persistence

### Frontend
- **HTML5** - Semantic markup
- **CSS3** - Modern styling with CSS variables, Grid, and Flexbox
- **Vanilla JavaScript** - No frameworks, pure ES6+
- **Google Fonts** - Inter font family

### Testing
- **Custom test framework** - Simple, built-in test runner
- **Node.js HTTP module** - For making test requests

## 📦 Installation

### Prerequisites
- Node.js (v14 or higher)
- npm (v6 or higher)

### Steps

1. **Clone or extract the project:**
   ```bash
   cd storify_assignment
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

   This will install:
   - `express` (^4.18.2)
   - `cors` (^2.8.5)
   - `nodemon` (^3.0.1) - for development

## 🚀 Running the Application

### Development Mode (with auto-reload)
```bash
npm run dev
```

### Production Mode
```bash
npm start
```

The server will start on **http://localhost:3000**

You should see:
```
✅ Todo API server running on http://localhost:3000
📝 API endpoints available at http://localhost:3000/todos
🌐 Frontend UI available at http://localhost:3000
```

### Accessing the Application

- **Frontend UI**: Open your browser and navigate to `http://localhost:3000`
- **API Endpoints**: `http://localhost:3000/todos`
- **Health Check**: `http://localhost:3000/health`

## 🧪 Running Tests

### Run all tests:
```bash
npm test
```

The test suite includes **50+ comprehensive tests** covering:
- ✅ Creating todos (with validation)
- ✅ Getting all todos (with filtering and search)
- ✅ Getting specific todos by ID
- ✅ Updating todos
- ✅ Deleting todos
- ✅ Statistics endpoint
- ✅ Error handling (404, 400, 500)
- ✅ Edge cases (long titles, special characters, concurrent requests)

### Expected Output:
```
🚀 Starting API Tests...

📦 Test Suite: POST /todos - Create Todo
🧪 Should create a todo successfully... ✅ PASSED
🧪 Should return 400 when title is missing... ✅ PASSED
...

📊 Test Summary
✅ Passed: 50
❌ Failed: 0
📈 Total: 50
🎯 Success Rate: 100%
```

## 📚 API Documentation

### Base URL
```
http://localhost:3000
```

### Endpoints

#### 1. Create a Todo
**POST** `/todos`

Create a new todo item.

**Request Body:**
```json
{
  "title": "Buy groceries",
  "completed": false,
  "priority": "medium"
}
```

**Response:** `201 Created`
```json
{
  "id": 1,
  "title": "Buy groceries",
  "completed": false,
  "priority": "medium",
  "createdAt": "2024-01-01T12:00:00.000Z"
}
```

**Validation:**
- `title` is required and must be a non-empty string
- `title` must be less than 500 characters
- `priority` must be one of: `low`, `medium`, `high`
- `completed` defaults to `false` if not provided

**Error Response:** `400 Bad Request`
```json
{
  "error": "Title is required and must be a string"
}
```

---

#### 2. Get All Todos
**GET** `/todos`

Retrieve all todos with optional filtering and search.

**Query Parameters:**
- `filter` (optional): Filter by status - `completed` or `pending`
- `search` (optional): Search todos by title (case-insensitive)

**Examples:**
```bash
GET /todos
GET /todos?filter=completed
GET /todos?filter=pending
GET /todos?search=groceries
GET /todos?filter=pending&search=assignment
```

**Response:** `200 OK`
```json
[
  {
    "id": 1,
    "title": "Buy groceries",
    "completed": false,
    "priority": "high",
    "createdAt": "2024-01-01T12:00:00.000Z"
  },
  {
    "id": 2,
    "title": "Complete assignment",
    "completed": true,
    "priority": "medium",
    "createdAt": "2024-01-01T13:00:00.000Z"
  }
]
```

---

#### 3. Get a Specific Todo
**GET** `/todos/:id`

Retrieve a single todo by its ID.

**Example:**
```bash
GET /todos/1
```

**Response:** `200 OK`
```json
{
  "id": 1,
  "title": "Buy groceries",
  "completed": false,
  "priority": "high",
  "createdAt": "2024-01-01T12:00:00.000Z"
}
```

**Error Response:** `404 Not Found`
```json
{
  "error": "Todo not found"
}
```

---

#### 4. Update a Todo
**PUT** `/todos/:id`

Update an existing todo. You can update any combination of fields.

**Request Body:**
```json
{
  "title": "Buy groceries and cook dinner",
  "completed": true,
  "priority": "low"
}
```

**Response:** `200 OK`
```json
{
  "id": 1,
  "title": "Buy groceries and cook dinner",
  "completed": true,
  "priority": "low",
  "createdAt": "2024-01-01T12:00:00.000Z"
}
```

**Error Responses:**
- `404 Not Found` - Todo doesn't exist
- `400 Bad Request` - Invalid data (empty title, invalid priority, etc.)

---

#### 5. Delete a Todo
**DELETE** `/todos/:id`

Delete a todo by its ID.

**Example:**
```bash
DELETE /todos/1
```

**Response:** `200 OK`
```json
{
  "message": "Todo deleted successfully",
  "todo": {
    "id": 1,
    "title": "Buy groceries",
    "completed": false,
    "priority": "medium",
    "createdAt": "2024-01-01T12:00:00.000Z"
  }
}
```

**Error Response:** `404 Not Found`
```json
{
  "error": "Todo not found"
}
```

---

#### 6. Get Statistics (Bonus)
**GET** `/todos/stats`

Get statistics about todos including counts and completion rate.

**Response:** `200 OK`
```json
{
  "total": 10,
  "completed": 6,
  "pending": 4,
  "completionRate": 60,
  "priorityCounts": {
    "low": 3,
    "medium": 4,
    "high": 3
  }
}
```

---

#### 7. Health Check
**GET** `/health`

Check if the server is running.

**Response:** `200 OK`
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

### HTTP Status Codes

| Code | Description |
|------|-------------|
| 200  | Success - Request completed successfully |
| 201  | Created - Resource created successfully |
| 400  | Bad Request - Invalid input or validation error |
| 404  | Not Found - Resource doesn't exist |
| 500  | Internal Server Error - Something went wrong on the server |

## 🎨 Frontend Features

### User Interface

1. **Dashboard Statistics**
   - Total tasks count
   - Pending tasks count
   - Completed tasks count
   - Completion rate percentage

2. **Add Todo Form**
   - Text input for todo title
   - Priority selector (low/medium/high)
   - Add button with icon

3. **Search & Filter**
   - Real-time search by title
   - Filter buttons: All, Pending, Completed
   - Debounced search for better performance

4. **Todo List**
   - Each todo shows:
     - Checkbox for completion status
     - Title
     - Priority badge with color coding
     - Creation date (relative time)
     - Delete button
   - Visual distinction for completed items (strikethrough, opacity)
   - Priority color indicators:
     - 🟢 Low - Green
     - 🟡 Medium - Yellow
     - 🔴 High - Red

5. **Dark Mode**
   - Toggle button in top-right corner
   - Smooth transitions between themes
   - Preference saved in localStorage

6. **Responsive Design**
   - Works perfectly on desktop, tablet, and mobile
   - Adaptive layout
   - Touch-friendly buttons

7. **User Feedback**
   - Toast notifications for actions
   - Loading spinners during API calls
   - Error messages with auto-dismiss
   - Empty state when no todos exist

## 📁 Project Structure

```
storify_assignment/
├── server.js              # Main server file with all API endpoints
├── package.json           # Project dependencies and scripts
├── todos.json            # Persistent storage (auto-generated)
├── public/               # Frontend files
│   ├── index.html        # Main HTML file
│   ├── styles.css        # Complete CSS with dark mode
│   └── app.js            # Frontend JavaScript
├── tests/                # Test files
│   └── api.test.js       # Comprehensive API tests
└── README.md             # This file
```

## 💡 Design Decisions

### 1. **Technology Choices**

**Why Node.js + Express?**
- Lightweight and fast
- Easy to set up and understand
- Large ecosystem
- Perfect for REST APIs
- JavaScript on both frontend and backend

**Why Vanilla JavaScript for Frontend?**
- No build tools required
- Faster to set up
- Shows fundamental JavaScript skills
- No framework learning curve
- Smaller bundle size

### 2. **Architecture Decisions**

**In-Memory Storage with File Persistence:**
- Fast read/write operations
- Simple implementation
- Data persists between restarts
- No database setup required
- Perfect for a take-home assignment

**REST API Design:**
- Follows REST conventions
- Intuitive endpoints
- Proper HTTP methods and status codes
- Clear error messages

**Separation of Concerns:**
- Backend (server.js) handles all API logic
- Frontend files completely separate
- Easy to maintain and extend

### 3. **UX/UI Decisions**

**Dark Mode:**
- Reduces eye strain
- Modern user expectation
- Shows CSS variable mastery

**Animations:**
- Fade-in effects for smooth loading
- Slide animations for todo items
- Hover effects for interactive elements
- Improves perceived performance

**Toast Notifications:**
- Non-intrusive feedback
- Auto-dismiss to avoid clutter
- Better than alert() dialogs

**Responsive Design:**
- Mobile-first approach
- CSS Grid and Flexbox for layouts
- Touch-friendly tap targets

### 4. **Code Quality Decisions**

**Input Validation:**
- Server-side validation (never trust the client)
- Meaningful error messages
- Edge case handling

**Error Handling:**
- Try-catch blocks
- Proper HTTP status codes
- User-friendly error messages
- Graceful degradation

**Code Organization:**
- Clear comments and sections
- Consistent naming conventions
- DRY principles (Don't Repeat Yourself)
- Reusable functions

## 🚧 Challenges & Solutions

### Challenge 1: Data Persistence
**Problem:** Todos were lost on server restart.

**Solution:** Implemented file-based storage using Node.js `fs` module. Todos are automatically saved to `todos.json` after every modification and loaded on server startup.

### Challenge 2: Real-time Search Performance
**Problem:** Searching on every keystroke could cause too many API requests.

**Solution:** Implemented debouncing (300ms delay) to wait for the user to finish typing before making the API call.

### Challenge 3: Dark Mode State Persistence
**Problem:** Theme preference was lost on page reload.

**Solution:** Used `localStorage` to save and restore the user's theme preference.

### Challenge 4: Responsive Design Complexity
**Problem:** Making the UI look good on all screen sizes.

**Solution:** Used CSS Grid with `auto-fit` and media queries. Tested on multiple device sizes and adjusted breakpoints accordingly.

### Challenge 5: Testing Without a Framework
**Problem:** No testing framework like Jest was specified.

**Solution:** Built a simple custom test framework with describe/test/expect functions. It's lightweight and does everything we need.

### Challenge 6: Smooth Animations
**Problem:** Adding/removing todos felt jarring.

**Solution:** Used CSS animations with staggered delays (each todo animates slightly after the previous one). Added transitions for hover effects and theme changes.

## 🔮 Future Improvements

If I had more time, I would add:

1. **Backend Enhancements:**
   - Database integration (MongoDB or PostgreSQL)
   - User authentication and authorization
   - Due dates for todos
   - Tags/categories for organization
   - Todo subtasks/checklist items
   - Sorting options (by date, priority, alphabetical)
   - Pagination for large lists
   - Rate limiting for API protection

2. **Frontend Enhancements:**
   - Drag-and-drop reordering
   - Bulk operations (delete multiple, mark multiple as complete)
   - Undo/redo functionality
   - Export todos (JSON, CSV, PDF)
   - Keyboard shortcuts
   - Progressive Web App (PWA) features
   - Offline support with service workers
   - Accessibility improvements (ARIA labels, keyboard navigation)

3. **Features:**
   - Todo categories/projects
   - Recurring todos
   - Reminders and notifications
   - Collaboration features
   - Activity history/audit log
   - Todo templates

4. **DevOps:**
   - Docker containerization
   - CI/CD pipeline
   - Deployment to cloud (Heroku, AWS, etc.)
   - Environment-based configuration
   - Logging and monitoring

5. **Testing:**
   - Frontend unit tests
   - Integration tests
   - E2E tests (Cypress, Playwright)
   - Performance testing
   - Test coverage reports

## 📄 License

ISC

## 🙏 Acknowledgments

- Google Fonts for the Inter font family
- The Express.js team for the excellent framework
- MDN Web Docs for CSS and JavaScript references

---

## 📞 Contact

If you have any questions about the implementation or design decisions, I'm happy to explain further in the follow-up interview!

**Thank you for reviewing my submission!** 🎉