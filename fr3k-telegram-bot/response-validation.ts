#!/usr/bin/env bun
/**
 * Response Validation Utilities
 *
 * Provides functions to validate PAI responses for completeness before sending to Telegram
 * to prevent truncated or incomplete messages.
 */

/**
 * Check if a response appears to be complete based on sentence boundaries
 * Returns true if response is complete, false if likely truncated
 */
export function isResponseComplete(response: string): boolean {
  if (!response || response.length === 0) {
    return false;
  }

  // Trim whitespace and check for meaningful content
  const trimmed = response.trim();
  // Allow short responses if they end with proper punctuation
  if (trimmed.length < 5) {
    // Extremely short - probably incomplete
    return false;
  }

  // Check for sentence termination patterns (but NOT ellipsis)
  const ellipsisPattern = /\.\.\.\s*$/;
  if (ellipsisPattern.test(trimmed)) {
    console.warn("⚠️ Response ends with ellipsis - appears truncated");
    return false;
  }

  const sentenceEndPattern = /[.!?]\s*$/;
  const hasSentenceEnd = sentenceEndPattern.test(trimmed);

  if (hasSentenceEnd) {
    // Check for common truncation patterns after sentence ends
    const sentences = trimmed.split(/[.!?]\s+/);
    const lastSentence = sentences[sentences.length - 1];

    // If last sentence is very short, might be truncated
    if (lastSentence.length < 5) {
      console.warn("⚠️ Response ends with very short sentence - possible truncation");
    }

    return true;
  }

  // Check for common truncation patterns
  const truncationPatterns = [
    /\w+$/,      // Word at end without punctuation
    /\s+\w*$/,   // Trailing spaces with optional word fragment
    /\[[^\]]*$/, // Incomplete bracket content
    /`[^`]*$/,   // Incomplete backtick content
    /\*[^*]*$/,  // Incomplete asterisk content
    /\.\.\.\s*$/, // Ellipsis at end
  ];

  const hasTruncationPattern = truncationPatterns.some(pattern => pattern.test(trimmed));

  if (hasTruncationPattern) {
    console.warn("⚠️ Response contains truncation pattern");
    return false;
  }

  // Check if response ends mid-sentence
  const midSentencePatterns = [
    /\s+(is|are|was|were|have|has|had|do|does|did|will|would|could|should|can|could|might|may|must|shall|ought|to|be|been|being|at|by|for|from|in|into|of|on|onto|out|over|since|through|to|under|up|with|without|about|across|against|along|among|around|before|behind|below|beneath|beside|between|beyond|but|concerning|considering|despite|except|following|inside|into|like|minus|near|off|on|onto|outside|over|past|plus|regarding|round|save|than|through|toward|towards|underneath|unlike|until|upon|versus|via|with|within|without|according to|ahead of|apart from|as far as|as well as|aside from|away from|because of|close to|due to|except for|far from|inside of|instead of|near to|next to|out of|outside of|prior to|pursuant to|rather than|regardless of|since then|such as|thanks to|that is|together with|up to|where as|whether or|with regard to|because|since|although|though|even though|while|whenever|whereas|wherever)\s+\w*$/, // Preposition + word fragment
    /\s+[A-Z][a-z]*$/, // Capitalized word without following punctuation
    /\s+\d+\s*\w*$/, // Numbers at end
  ];

  const endsMidSentence = midSentencePatterns.some(pattern => pattern.test(trimmed));

  if (endsMidSentence) {
    console.warn("⚠️ Response appears to end mid-sentence");
    return false;
  }

  // If we get here, response appears complete
  return true;
}

/**
 * Escape regex special characters for safety
 */
function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Validate PAI response and return flag indicating if it's safe to send
 */
export function validatePAIResponse(response: string): { isValid: boolean; reason?: string } {
  // Check for empty or null response
  if (!response || response.trim().length === 0) {
    return { isValid: false, reason: "Empty response" };
  }

  // Check for response length (Telegram has 4096 character limit per message)
  if (response.length > 4000) {
    console.warn("⚠️ Response very long, may be truncated by Telegram");
    // Even if long, check if it's complete
    if (isResponseComplete(response)) {
      return { isValid: true };
    } else {
      return { isValid: false, reason: "Response too long and appears incomplete" };
    }
  }

  // Check completeness using sentence boundary detection
  if (!isResponseComplete(response)) {
    return { isValid: false, reason: "Response appears incomplete - may be truncated" };
  }

  // Check for typical PAI response structure
  const trimmed = response.trim();
  if (trimmed.length < 20 && !trimmed.includes('.') && !trimmed.includes('!') && !trimmed.includes('?')) {
    return { isValid: false, reason: "Response too short and lacks proper structure" };
  }

  // Response appears valid
  return { isValid: true };
}