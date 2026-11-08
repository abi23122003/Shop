import assert from "node:assert/strict";
import test from "node:test";
import { register, login } from "../src/services/authService.js";
import api from "../src/services/api.js";

// Helper validator replicating Register component validation logic
function validateRegistration(username, password, confirmPassword) {
  const errors = {};
  const trimmed = (username || "").trim();

  if (!trimmed) {
    errors.username = "Username is required";
  } else if (trimmed.length < 3) {
    errors.username = "Username must be at least 3 characters";
  } else if (trimmed.length > 50) {
    errors.username = "Username cannot exceed 50 characters";
  } else if (!/^[a-zA-Z0-9_.-]+$/.test(trimmed)) {
    errors.username = "Only letters, numbers, underscores, hyphens, and dots allowed";
  }

  if (!password) {
    errors.password = "Password is required";
  } else if (password.length < 8) {
    errors.password = "Password must be at least 8 characters long";
  }

  if (!confirmPassword) {
    errors.confirmPassword = "Confirm password is required";
  } else if (password !== confirmPassword) {
    errors.confirmPassword = "Passwords do not match";
  }

  return errors;
}

test("registration validation accepts valid credentials", () => {
  const errors = validateRegistration("retail_clerk", "SecurePass123!", "SecurePass123!");
  assert.equal(Object.keys(errors).length, 0);
});

test("registration validation rejects empty or too short username", () => {
  const emptyErrors = validateRegistration("  ", "SecurePass123!", "SecurePass123!");
  assert.equal(emptyErrors.username, "Username is required");

  const shortErrors = validateRegistration("ab", "SecurePass123!", "SecurePass123!");
  assert.equal(shortErrors.username, "Username must be at least 3 characters");
});

test("registration validation rejects short password and mismatched confirmation", () => {
  const shortPassErrors = validateRegistration("valid_user", "short", "short");
  assert.equal(shortPassErrors.password, "Password must be at least 8 characters long");

  const mismatchErrors = validateRegistration("valid_user", "SecurePass123!", "DifferentPass123!");
  assert.equal(mismatchErrors.confirmPassword, "Passwords do not match");
});

test("authService.register sends expected POST payload to /auth/register", async () => {
  const originalPost = api.post;
  let capturedUrl = "";
  let capturedBody = null;

  api.post = async (url, body) => {
    capturedUrl = url;
    capturedBody = body;
    return {
      data: {
        message: "Registration successful! Your account is pending administrator approval before you can sign in.",
        username: body.username,
        approved: false,
      },
    };
  };

  try {
    const result = await register("new_cashier", "StrongPassword123!", "StrongPassword123!");
    assert.equal(capturedUrl, "/auth/register");
    assert.deepEqual(capturedBody, {
      username: "new_cashier",
      password: "StrongPassword123!",
      confirmPassword: "StrongPassword123!",
    });
    assert.equal(result.approved, false);
    assert.equal(result.username, "new_cashier");
  } finally {
    api.post = originalPost;
  }
});

test("login service communicates with /auth/login endpoint", async () => {
  const originalPost = api.post;
  let capturedUrl = "";
  let capturedBody = null;

  api.post = async (url, body) => {
    capturedUrl = url;
    capturedBody = body;
    return {
      data: {
        token: "mocked-jwt-token-xyz",
      },
    };
  };

  try {
    const result = await login("admin", "Pavi@2003");
    assert.equal(capturedUrl, "/auth/login");
    assert.deepEqual(capturedBody, { username: "admin", password: "Pavi@2003" });
    assert.equal(result.token, "mocked-jwt-token-xyz");
  } finally {
    api.post = originalPost;
  }
});
