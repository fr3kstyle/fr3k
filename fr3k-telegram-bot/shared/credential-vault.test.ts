// Set required env var BEFORE importing credential-vault
process.env.PAI_CREDENTIAL_KEY = "test-master-key-for-testing-only-32-chars-long!!";

import { test, expect } from "bun:test";
import { credentialVault } from "./credential-vault";
import { existsSync, readFileSync, unlinkSync } from "fs";
import { join } from "path";

const TEST_VAULT_PATH = join(process.cwd(), '.pai-credentials', 'test-vault.json');

test("should create vault instance and validate master key", () => {
  expect(credentialVault.validateMasterKey()).toBe(true);
});

test("should add credential to vault", () => {
  const channel_id = "test-channel-123";
  const service = "gmail";
  const username = "test@example.com";
  const password = "test-password-123";

  const credential = credentialVault.addCredential(channel_id, service, username, password);

  expect(credential.id).toBeDefined();
  expect(credential.service).toBe(service);
  expect(credential.username).toBe(username);
  expect(credential.encrypted_password).toBeDefined();
  expect(credential.created_at).toBeDefined();
});

test("should get credential by ID", () => {
  const channel_id = "test-channel-123";
  const service = "gmail";
  const username = "test@example.com";
  const password = "test-password-123";

  const credential = credentialVault.addCredential(channel_id, service, username, password);
  const retrievedCredential = credentialVault.getCredential(channel_id, credential.id);

  expect(retrievedCredential).not.toBeNull();
  expect(retrievedCredential?.id).toBe(credential.id);
  expect(retrievedCredential?.service).toBe(service);
});

test("should get all credentials for channel", () => {
  const channel_id = "test-channel-123";
  const credentials = credentialVault.getCredentialsByChannel(channel_id);

  expect(Array.isArray(credentials)).toBe(true);
});

test("should update credential", async () => {
  const channel_id = "test-channel-123";
  const service = "gmail";
  const username = "test@example.com";
  const password = "test-password-123";

  const credential = credentialVault.addCredential(channel_id, service, username, password);

  // Wait a bit to ensure timestamp changes
  await new Promise(resolve => setTimeout(resolve, 2));

  const newPassword = "updated-password-456";

  const updatedCredential = credentialVault.updateCredential(channel_id, credential.id, {
    username: "updated@example.com",
    password: newPassword
  });

  expect(updatedCredential).not.toBeNull();
  expect(updatedCredential?.username).toBe("updated@example.com");
  expect(updatedCredential?.updated_at).not.toBe(credential.updated_at);
});

test("should delete credential", () => {
  const channel_id = "test-channel-123";
  const service = "gmail";
  const username = "test@example.com";
  const password = "test-password-123";

  const credential = credentialVault.addCredential(channel_id, service, username, password);
  const deleteResult = credentialVault.deleteCredential(channel_id, credential.id);

  expect(deleteResult).toBe(true);

  const retrievedCredential = credentialVault.getCredential(channel_id, credential.id);
  expect(retrievedCredential).toBeNull();
});

test("should get audit log", () => {
  const channel_id = "test-channel-123";
  const auditLog = credentialVault.getAuditLog();

  expect(Array.isArray(auditLog)).toBe(true);
  expect(auditLog.length).toBeGreaterThan(0);
});

test("should filter audit log by channel", () => {
  const channel_id = "test-channel-123";
  const channelAuditLog = credentialVault.getAuditLog(channel_id);

  expect(Array.isArray(channelAuditLog)).toBe(true);
  expect(channelAuditLog.length).toBeGreaterThan(0);
  expect(channelAuditLog.every(entry => entry.channel_id === channel_id)).toBe(true);
});