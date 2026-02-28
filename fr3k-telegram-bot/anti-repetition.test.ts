#!/usr/bin/env bun
/**
 * Anti-Repetition System Tests
 *
 * Unit tests for the anti-repetition functionality
 */

import { test, expect } from "bun:test";
import { AntiRepetitionSystem } from "./anti-repetition.js";

test("Anti-repetition system should detect high similarity responses", () => {
  const system = new AntiRepetitionSystem();

  // Add a test response
  system.processResponse("Hello world, this is a test message", "user123", "msg1");

  // Test very similar response
  const result1 = system.processResponse("Hello world, this is another test message", "user123", "msg2");
  expect(result1.wasModified).toBe(true);
  expect(result1.similarity).toBeGreaterThan(0.8);

  // Test different response
  const result2 = system.processResponse("This is completely different content", "user123", "msg3");
  expect(result2.wasModified).toBe(false);
  expect(result2.similarity).toBeLessThan(0.8);
});

test("Anti-repetition system should buffer responses correctly", () => {
  const system = new AntiRepetitionSystem();

  // Add responses
  system.processResponse("Message 1", "user1", "msg1");
  system.processResponse("Message 2", "user2", "msg2");
  system.processResponse("Message 3", "user1", "msg3");

  const stats = system.getBufferStats();
  expect(stats.size).toBe(3);
  expect(stats.userCounts["user1"]).toBe(2);
  expect(stats.userCounts["user2"]).toBe(1);
});

test("Anti-repetition system should generate variations for repetitive responses", () => {
  const system = new AntiRepetitionSystem();

  // Add initial response
  system.processResponse("The project is progressing well", "user123", "msg1");

  // Test repetitive response - should be modified
  const result = system.processResponse("The project is progressing well", "user123", "msg2");

  expect(result.wasModified).toBe(true);
  expect(result.finalResponse).not.toBe("The project is progressing well");

  // Check that variation template was used
  const templates = [
    "Here's another way to look at it: The project is progressing well",
    "Let me rephrase that: The project is progressing well",
    "To clarify: The project is progressing well",
    "In other words: The project is progressing well",
    "Let me put it differently: The project is progressing well",
    "To elaborate: The project is progressing well",
    "Here's a different perspective: The project is progressing well",
    "Let me explain this differently: The project is progressing well",
    "In summary: The project is progressing well",
    "The core point is: The project is progressing well",
  ];

  const isTemplate = templates.some(template => result.finalResponse === template);
  expect(isTemplate).toBe(true);
});

test("Anti-repetition system should handle empty responses", () => {
  const system = new AntiRepetitionSystem();

  // Test with empty response
  const result = system.processResponse("", "user123", "msg1");
  expect(result.wasModified).toBe(false);
  expect(result.finalResponse).toBe("");
});

test("Anti-repetition system should clean old buffer entries", async () => {
  const system = new AntiRepetitionSystem();

  // Mock the timestamp to make entries old
  const oldResponse = {
    id: "old",
    text: "Old message",
    timestamp: Date.now() - 7200000, // 2 hours ago
    userId: "user1",
    similarity: 0
  };

  // Access private buffer for testing
  (system as any).responseBuffer = [oldResponse];

  // Add new response - should trigger cleanup
  system.processResponse("New message", "user1", "new");

  const stats = system.getBufferStats();
  // Old entry should be cleaned out
  expect(stats.size).toBe(1);
});

test("Anti-repetition system should calculate similarity correctly", () => {
  const system = new AntiRepetitionSystem();

  // Add first response to buffer (nothing to compare yet)
  system.processResponse("Hello world", "user1", "msg1");

  // Test exact match - comparing to previous response
  const result1 = system.processResponse("Hello world", "user1", "msg2");
  expect(result1.similarity).toBe(1);

  // Test partial match
  const result2 = system.processResponse("Hello world peace", "user1", "msg3");
  expect(result2.similarity).toBeGreaterThan(0.5);

  // Test no match
  const result3 = system.processResponse("Completely different topic", "user1", "msg4");
  expect(result3.similarity).toBeLessThan(0.3);
});

test("Anti-repetition system should respect buffer size limit", () => {
  const system = new AntiRepetitionSystem();

  // Add more responses than buffer size
  for (let i = 0; i < 10; i++) {
    system.processResponse(`Message ${i}`, `user${i}`, `msg${i}`);
  }

  const stats = system.getBufferStats();
  expect(stats.size).toBe((system as any).BUFFER_SIZE);
});

test("Anti-repetition system should be case insensitive", () => {
  const system = new AntiRepetitionSystem();

  // Add response
  system.processResponse("Hello World Test", "user1", "msg1");

  // Test case variation
  const result = system.processResponse("hello world test", "user1", "msg2");
  expect(result.wasModified).toBe(true);
  expect(result.similarity).toBeGreaterThan(0.8);
});

test("Anti-repetition system should ignore short words", () => {
  const system = new AntiRepetitionSystem();

  // Add response
  system.processResponse("This is a simple test for the system", "user1", "msg1");

  // Test with different short words
  const result = system.processResponse("This is simple test for a system", "user1", "msg2");
  expect(result.wasModified).toBe(true);
  expect(result.similarity).toBeGreaterThan(0.7);
});

test("Anti-repetition system should clear buffer when requested", () => {
  const system = new AntiRepetitionSystem();

  // Add responses
  system.processResponse("Message 1", "user1", "msg1");
  system.processResponse("Message 2", "user2", "msg2");

  expect(system.getBufferStats().size).toBe(2);

  // Clear buffer
  (system as any).clearBuffer();

  expect(system.getBufferStats().size).toBe(0);
});

test("Anti-repetition system should handle punctuation correctly", () => {
  const system = new AntiRepetitionSystem();

  // Add response with punctuation
  system.processResponse("Hello world! This is a test.", "user1", "msg1");

  // Test without punctuation
  const result = system.processResponse("Hello world this is a test", "user1", "msg2");
  expect(result.wasModified).toBe(true);
  expect(result.similarity).toBeGreaterThan(0.8);
});