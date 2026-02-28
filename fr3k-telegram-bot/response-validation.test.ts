#!/usr/bin/env bun
/**
 * Response Validation Tests
 *
 * Unit tests for the response validation functionality
 */

import { test, expect } from "bun:test";
import { validatePAIResponse, isResponseComplete } from "./response-validation.js";

test("Response validation should accept complete sentences", () => {
  const validResponses = [
    "This is a complete sentence.",
    "Hello! How are you?",
    "The quick brown fox jumps over the lazy dog.",
    "Yes, this is a valid response with proper punctuation.",
    "This response has multiple sentences. Each one is complete. And properly punctuated."
  ];

  validResponses.forEach(response => {
    const result = validatePAIResponse(response);
    expect(result.isValid).toBe(true);
  });
});

test("Response validation should reject incomplete sentences", () => {
  const invalidResponses = [
    "This is incomplete",
    "Hello world without punctuation",
    "This is a test sentence with [incomplete bracket",
    "Response ending with ellipsis...",
    "This response has unclosed quotes",
    "This is incomplete and has unbalanced (parentheses",
    "Incomplete response with backticks `unclosed",
    "This sentence just trails off without ending"
  ];

  invalidResponses.forEach(response => {
    const result = validatePAIResponse(response);
    expect(result.isValid).toBe(false);
    expect(result.reason).toContain("incomplete");
  });
});

test("Response validation should reject empty responses", () => {
  const emptyResponses = [
    "",
    "   ",
    "\n\t\n"
  ];

  emptyResponses.forEach(response => {
    const result = validatePAIResponse(response);
    expect(result.isValid).toBe(false);
    expect(result.reason).toBe("Empty response");
  });
});

test("Response validation should reject very short responses", () => {
  const shortResponses = [
    "Hi",
    "No",
    "Yes",
    "Ok"
  ];

  shortResponses.forEach(response => {
    const result = validatePAIResponse(response);
    expect(result.isValid).toBe(false);
  });
});

test("Response validation should handle balanced quotes", () => {
  const validWithQuotes = [
    'This has "balanced quotes" and is complete.',
    "This has 'balanced quotes' and is complete.",
    "This response contains (balanced parentheses) and is complete.",
    "This response contains [balanced brackets] and is complete.",
    "This response contains {balanced braces} and is complete."
  ];

  validWithQuotes.forEach(response => {
    const result = validatePAIResponse(response);
    expect(result.isValid).toBe(true);
  });
});

test("Response validation should reject unbalanced quotes", () => {
  const invalidWithQuotes = [
    'This has "unbalanced quotes and is incomplete.',
    "This has 'unbalanced quotes and is incomplete.",
    "This response has (unbalanced parentheses and is incomplete.",
    "This response has [unbalanced brackets and is incomplete.",
    "This response has {unbalanced braces and is incomplete."
  ];

  invalidWithQuotes.forEach(response => {
    const result = validatePAIResponse(response);
    expect(result.isValid).toBe(false);
  });
});

test("Response validation should accept long but complete responses", () => {
  const longResponse = "This is a very long response that contains multiple sentences. Each sentence is properly punctuated. The response is complete and well-structured. It meets all the validation criteria. This sentence also ends properly. And this one too. Finally, this response is complete.";
  const result = validatePAIResponse(longResponse);
  expect(result.isValid).toBe(true);
  expect(result.reason).toBeUndefined();
});

test("Response validation should reject truncated responses", () => {
  const truncatedResponses = [
    "This is complete. [incomplete content",
    "This has code blocks ```incomplete",
    "This has asterisks *incomplete",
    "This has underscores _incomplete",
    "This has angle brackets <incomplete"
  ];

  truncatedResponses.forEach(response => {
    const result = validatePAIResponse(response);
    expect(result.isValid).toBe(false);
  });
});

test("Response validation should handle numeric content correctly", () => {
  const validNumericResponses = [
    "The answer is 42.",
    "This contains numbers like 123 and 456.",
    "The code is version 2.0.1 and it works.",
    "This response ends with a number 100."
  ];

  validNumericResponses.forEach(response => {
    const result = validatePAIResponse(response);
    expect(result.isValid).toBe(true);
  });
});

test("Response validation should reject responses ending with prepositions", () => {
  const invalidPrepositionResponses = [
    "This response ends with about",
    "This one ends with across",
    "This has without at the end",
    "This ends with for no reason"
  ];

  invalidPrepositionResponses.forEach(response => {
    const result = validatePAIResponse(response);
    expect(result.isValid).toBe(false);
  });
});

test("isResponseComplete helper function should work correctly", () => {
  const completeSentences = [
    "This is complete.",
    "Hello world!",
    "Question?",
    "Multiple sentences. Each complete.",
    "  This has leading spaces but is complete.  "
  ];

  completeSentences.forEach(sentence => {
    const result = isResponseComplete(sentence);
    expect(result).toBe(true);
  });

  const incompleteSentences = [
    "This is incomplete",
    "Hello world without punctuation",
    "  This has leading spaces but incomplete  ",
    "Incomplete with [bracket",
    "Incomplete with quotes'",
    "This sentence just trails off",
    "Ends with ellipsis..."
  ];

  incompleteSentences.forEach(sentence => {
    const result = isResponseComplete(sentence);
    expect(result).toBe(false);
  });
});

test("Response validation should accept responses with proper structure", () => {
  const wellStructuredResponses = [
    "Yes, this is a valid response with proper structure.",
    "The project is progressing well on schedule.",
    "I understand your question and can provide a clear answer.",
    "Based on the analysis, this approach should work effectively."
  ];

  wellStructuredResponses.forEach(response => {
    const result = validatePAIResponse(response);
    expect(result.isValid).toBe(true);
  });
});

test("Response validation should reject responses lacking proper structure", () => {
  const poorlyStructuredResponses = [
    "yes", // Too short
    "fragmented sentence without proper thought",
    "just a bunch of words together",
    "nonsense that doesn't make sense but is long enough to pass length checks"
  ];

  poorlyStructuredResponses.forEach(response => {
    const result = validatePAIResponse(response);
    expect(result.isValid).toBe(false);
  });
});