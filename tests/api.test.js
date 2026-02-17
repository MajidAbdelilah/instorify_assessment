// ================================
// Simple Test Runner for Todo API
// ================================

const http = require("http");

let testsPassed = 0;
let testsFailed = 0;

// Generate a unique user ID for testing
const TEST_USER_ID = `test_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;

// Helper function to make HTTP requests with timeout and retry logic
async function makeRequest(method, path, data = null, retries = 2) {
	for (let attempt = 0; attempt <= retries; attempt++) {
		try {
			return await new Promise((resolve, reject) => {
				const options = {
					hostname: "localhost",
					port: 3000,
					path: path,
					method: method,
					headers: {
						"Content-Type": "application/json",
						Connection: "keep-alive",
						"X-User-Id": TEST_USER_ID,
					},
					timeout: 10000, // 5 second timeout
				};

				const req = http.request(options, (res) => {
					let body = "";

					res.on("data", (chunk) => {
						body += chunk;
					});

					res.on("end", () => {
						try {
							const parsedBody = body ? JSON.parse(body) : null;
							resolve({
								statusCode: res.statusCode,
								body: parsedBody,
							});
						} catch (error) {
							resolve({
								statusCode: res.statusCode,
								body: body,
							});
						}
					});
				});

				req.on("error", (error) => {
					reject(error);
				});

				req.on("timeout", () => {
					req.destroy();
					reject(new Error("Request timeout"));
				});

				if (data) {
					req.write(JSON.stringify(data));
				}

				req.end();
			});
		} catch (error) {
			if (attempt === retries) {
				throw error;
			}
			// Wait before retrying
			await new Promise((resolve) => setTimeout(resolve, 300));
		}
	}
}

// Test function with delay to prevent overwhelming the server
async function test(description, testFn) {
	try {
		await testFn();
		console.log(`✅ PASS: ${description}`);
		testsPassed++;
		// Small delay between tests to prevent connection issues
		await new Promise((resolve) => setTimeout(resolve, 200));
	} catch (error) {
		console.log(`❌ FAIL: ${description}`);
		console.log(`   Error: ${error.message}`);
		testsFailed++;
		// Small delay even on failure
		await new Promise((resolve) => setTimeout(resolve, 200));
	}
}

// Assertion helpers
function assert(condition, message) {
	if (!condition) {
		throw new Error(message || "Assertion failed");
	}
}

function assertEqual(actual, expected, message) {
	if (actual !== expected) {
		throw new Error(message || `Expected ${expected}, but got ${actual}`);
	}
}

// Run all tests
async function runTests() {
	console.log("\n🚀 Starting Todo API Tests...\n");
	console.log("=".repeat(60));

	// Wait for server to be ready
	await new Promise((resolve) => setTimeout(resolve, 1000));

	// Test 1: Create a todo successfully
	await test("Should create a todo successfully", async () => {
		const response = await makeRequest("POST", "/todos", {
			title: "Complete assignment",
			completed: false,
		});
		assertEqual(response.statusCode, 201, "Status code should be 201");
		assert(response.body.id, "Response should have an id");
		assert(response.body.title === "Complete assignment", "Title should match");
		assert(response.body.createdAt, "Should have createdAt timestamp");
	});

	// Test 2: Get all todos
	await test("Should get all todos", async () => {
		const response = await makeRequest("GET", "/todos");
		assertEqual(response.statusCode, 200, "Status code should be 200");
		assert(Array.isArray(response.body), "Response should be an array");
	});

	// Test 3: Get non-existent todo returns 404
	await test("Should return 404 for non-existent todo", async () => {
		const response = await makeRequest("GET", "/todos/999999");
		assertEqual(response.statusCode, 404, "Status code should be 404");
		assert(response.body.error, "Response should have an error message");
	});

	// Test 4: Create todo without title returns error
	await test("Should return error when creating todo without title", async () => {
		const response = await makeRequest("POST", "/todos", {
			completed: false,
		});
		assertEqual(response.statusCode, 400, "Status code should be 400");
		assert(response.body.error, "Response should have an error message");
	});

	// Test 5: Create todo with empty title returns error
	await test("Should return error when title is empty", async () => {
		const response = await makeRequest("POST", "/todos", {
			title: "   ",
			completed: false,
		});
		assertEqual(response.statusCode, 400, "Status code should be 400");
	});

	// Test 6: Update a todo
	await test("Should update a todo successfully", async () => {
		// First create a todo
		const createResponse = await makeRequest("POST", "/todos", {
			title: "Todo to update",
		});
		const todoId = createResponse.body.id;

		// Then update it
		const response = await makeRequest("PUT", `/todos/${todoId}`, {
			title: "Updated todo",
			completed: true,
		});
		assertEqual(response.statusCode, 200, "Status code should be 200");
		assertEqual(response.body.title, "Updated todo", "Title should be updated");
		assertEqual(response.body.completed, true, "Completed should be true");
	});

	// Test 7: Delete a todo
	await test("Should delete a todo successfully", async () => {
		// First create a todo
		const createResponse = await makeRequest("POST", "/todos", {
			title: "Todo to delete",
		});
		const todoId = createResponse.body.id;

		// Then delete it
		const response = await makeRequest("DELETE", `/todos/${todoId}`);
		assertEqual(response.statusCode, 200, "Status code should be 200");

		// Verify it's deleted
		const getResponse = await makeRequest("GET", `/todos/${todoId}`);
		assertEqual(getResponse.statusCode, 404, "Todo should be deleted");
	});

	// Test 8: Get statistics
	await test("Should get todo statistics", async () => {
		const response = await makeRequest("GET", "/todos/stats");
		assertEqual(response.statusCode, 200, "Status code should be 200");
		assert(typeof response.body.total === "number", "Should have total count");
		assert(
			typeof response.body.completed === "number",
			"Should have completed count",
		);
		assert(
			typeof response.body.pending === "number",
			"Should have pending count",
		);
		assert(
			typeof response.body.completionRate === "number",
			"Should have completion rate",
		);
	});

	// Test 9: Filter todos by status
	await test("Should filter todos by completed status", async () => {
		// Create a completed todo
		await makeRequest("POST", "/todos", {
			title: "Completed task",
			completed: true,
		});

		const response = await makeRequest("GET", "/todos?filter=completed");
		assertEqual(response.statusCode, 200, "Status code should be 200");
		assert(Array.isArray(response.body), "Response should be an array");
	});

	// Test 10: Search todos
	await test("Should search todos by title", async () => {
		// Create a unique todo
		await makeRequest("POST", "/todos", {
			title: "UniqueSearchTerm",
		});

		const response = await makeRequest("GET", "/todos?search=UniqueSearch");
		assertEqual(response.statusCode, 200, "Status code should be 200");
		assert(Array.isArray(response.body), "Response should be an array");
	});

	// Test 11: Priority validation
	await test("Should create todo with priority", async () => {
		const response = await makeRequest("POST", "/todos", {
			title: "High priority task",
			priority: "high",
		});
		assertEqual(response.statusCode, 201, "Status code should be 201");
		assertEqual(response.body.priority, "high", "Priority should be high");
	});

	// Test 12: Reject invalid priority
	await test("Should reject invalid priority", async () => {
		const response = await makeRequest("POST", "/todos", {
			title: "Task with invalid priority",
			priority: "invalid",
		});
		assertEqual(response.statusCode, 400, "Status code should be 400");
	});

	// Test 13: Update non-existent todo
	await test("Should return 404 when updating non-existent todo", async () => {
		const response = await makeRequest("PUT", "/todos/999999", {
			title: "Updated",
		});
		assertEqual(response.statusCode, 404, "Status code should be 404");
	});

	// Test 14: Delete non-existent todo
	await test("Should return 404 when deleting non-existent todo", async () => {
		const response = await makeRequest("DELETE", "/todos/999999");
		assertEqual(response.statusCode, 404, "Status code should be 404");
	});

	// Test 15: Handle long titles
	await test("Should accept titles up to 500 characters", async () => {
		const longTitle = "A".repeat(500);
		const response = await makeRequest("POST", "/todos", {
			title: longTitle,
		});
		assertEqual(response.statusCode, 201, "Status code should be 201");
	});

	// Test 16: Reject very long titles
	await test("Should reject titles over 500 characters", async () => {
		const tooLongTitle = "A".repeat(501);
		const response = await makeRequest("POST", "/todos", {
			title: tooLongTitle,
		});
		assertEqual(response.statusCode, 400, "Status code should be 400");
	});

	// Test 17: Trim whitespace
	await test("Should trim whitespace from title", async () => {
		const response = await makeRequest("POST", "/todos", {
			title: "   Trimmed Title   ",
		});
		assertEqual(response.statusCode, 201, "Status code should be 201");
		assertEqual(
			response.body.title,
			"Trimmed Title",
			"Title should be trimmed",
		);
	});

	// Test 18: Health check
	await test("Health check should return ok status", async () => {
		const response = await makeRequest("GET", "/health");
		assertEqual(response.statusCode, 200, "Status code should be 200");
		assertEqual(response.body.status, "ok", "Status should be ok");
	});

	// Print summary
	console.log("\n" + "=".repeat(60));
	console.log("📊 TEST SUMMARY");
	console.log("=".repeat(60));
	console.log(`✅ Passed: ${testsPassed}`);
	console.log(`❌ Failed: ${testsFailed}`);
	console.log(`📈 Total: ${testsPassed + testsFailed}`);
	console.log(
		`🎯 Success Rate: ${Math.round((testsPassed / (testsPassed + testsFailed)) * 100)}%`,
	);
	console.log("=".repeat(60) + "\n");

	if (testsFailed === 0) {
		console.log("🎉 All tests passed! Great job!\n");
		process.exit(0);
	} else {
		console.log(
			`⚠️  ${testsFailed} test(s) failed. Please review the errors above.\n`,
		);
		process.exit(1);
	}
}

// Run the tests
runTests().catch((error) => {
	console.error("\n❌ Test suite crashed:", error.message);
	console.error(error.stack);
	process.exit(1);
});
