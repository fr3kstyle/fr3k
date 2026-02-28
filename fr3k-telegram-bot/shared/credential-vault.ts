import { randomBytes, createCipheriv, createDecipheriv, createHash } from 'crypto';
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';

export interface CredentialEntry {
  id: string;
  service: string;
  username: string;
  encrypted_password: string;
  service_data?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface ChannelCredentials {
  channel_id: string;
  credentials: CredentialEntry[];
}

export interface AuditLogEntry {
  timestamp: string;
  channel_id: string;
  credential_id: string;
  action: 'CREATE' | 'READ' | 'UPDATE' | 'DELETE';
  service: string;
  performed_by: string;
  ip_address: string;
}

export class CredentialVault {
  private readonly vaultPath: string;
  private readonly masterKey: string;
  private readonly algorithm = 'aes-256-gcm';
  private readonly keyLength = 32; // 256 bits
  private readonly ivLength = 16; // 128 bits

  constructor() {
    this.vaultPath = join(homedir(), '.pai-credentials', 'vault.json');
    this.masterKey = process.env.PAI_CREDENTIAL_KEY;

    if (!this.masterKey) {
      throw new Error('PAI_CREDENTIAL_KEY environment variable is required');
    }

    this.initializeVault();
  }

  private initializeVault(): void {
    const vaultDir = join(homedir(), '.pai-credentials');
    if (!existsSync(vaultDir)) {
      mkdirSync(vaultDir, { recursive: true });
    }

    if (!existsSync(this.vaultPath)) {
      const initialVault = {
        version: '1.0.0',
        channels: {},
        audit_log: [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      writeFileSync(this.vaultPath, JSON.stringify(initialVault, null, 2));
    }
  }

  private deriveKey(password: string, salt?: string): { key: Buffer; salt: string } {
    const saltValue = salt || randomBytes(16).toString('hex');
    const key = createHash('sha256').update(password + saltValue).digest();
    return { key, salt: saltValue };
  }

  private encrypt(text: string, key: Buffer): { encrypted: string; iv: string; tag: string } {
    const iv = randomBytes(this.ivLength);
    const cipher = createCipheriv(this.algorithm, key, iv);

    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const tag = cipher.getAuthTag();

    return {
      encrypted,
      iv: iv.toString('hex'),
      tag: tag.toString('hex')
    };
  }

  private decrypt(encrypted: string, key: Buffer, iv: string, tag: string): string {
    const decipher = createDecipheriv(this.algorithm, key, Buffer.from(iv, 'hex'));
    decipher.setAuthTag(Buffer.from(tag, 'hex'));

    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  }

  private getMasterKey(): Buffer {
    const { key } = this.deriveKey(this.masterKey);
    return key;
  }

  private auditLog(action: AuditLogEntry['action'], channel_id: string, credential_id: string, service: string): void {
    const auditEntry: AuditLogEntry = {
      timestamp: new Date().toISOString(),
      channel_id,
      credential_id,
      action,
      service,
      performed_by: 'system',
      ip_address: '127.0.0.1'
    };

    const vault = this.loadVault();
    vault.audit_log.push(auditEntry);
    vault.updated_at = new Date().toISOString();

    this.saveVault(vault);
  }

  private loadVault(): any {
    try {
      const vaultData = readFileSync(this.vaultPath, 'utf8');
      return JSON.parse(vaultData);
    } catch (error) {
      throw new Error(`Failed to load vault: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private saveVault(vault: any): void {
    try {
      writeFileSync(this.vaultPath, JSON.stringify(vault, null, 2));
    } catch (error) {
      throw new Error(`Failed to save vault: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  public addCredential(channel_id: string, service: string, username: string, password: string, service_data?: Record<string, any>): CredentialEntry {
    const vault = this.loadVault();
    const credential_id = randomBytes(8).toString('hex');

    const masterKey = this.getMasterKey();
    const { encrypted: encryptedPassword, iv, tag } = this.encrypt(password, masterKey);

    const credential: CredentialEntry = {
      id: credential_id,
      service,
      username,
      encrypted_password: encryptedPassword,
      service_data,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    if (!vault.channels[channel_id]) {
      vault.channels[channel_id] = [];
    }

    vault.channels[channel_id].push(credential);
    vault.updated_at = new Date().toISOString();

    this.saveVault(vault);
    this.auditLog('CREATE', channel_id, credential_id, service);

    return credential;
  }

  public getCredential(channel_id: string, credential_id: string): CredentialEntry | null {
    const vault = this.loadVault();
    const channelCredentials = vault.channels[channel_id] || [];

    const credential = channelCredentials.find(c => c.id === credential_id);
    if (!credential) {
      return null;
    }

    this.auditLog('READ', channel_id, credential_id, credential.service);
    return credential;
  }

  public getCredentialsByChannel(channel_id: string): CredentialEntry[] {
    const vault = this.loadVault();
    const credentials = vault.channels[channel_id] || [];
    this.auditLog('READ', channel_id, 'all', 'all');
    return credentials;
  }

  public updateCredential(channel_id: string, credential_id: string, updates: Partial<CredentialEntry>): CredentialEntry | null {
    const vault = this.loadVault();
    const channelCredentials = vault.channels[channel_id] || [];

    const credentialIndex = channelCredentials.findIndex(c => c.id === credential_id);
    if (credentialIndex === -1) {
      return null;
    }

    const credential = channelCredentials[credentialIndex];

    if (updates.password) {
      const masterKey = this.getMasterKey();
      const { encrypted: encryptedPassword, iv, tag } = this.encrypt(updates.password, masterKey);
      credential.encrypted_password = encryptedPassword;
    }

    Object.assign(credential, updates, { updated_at: new Date().toISOString() });
    vault.updated_at = new Date().toISOString();

    this.saveVault(vault);
    this.auditLog('UPDATE', channel_id, credential_id, credential.service);

    return credential;
  }

  public deleteCredential(channel_id: string, credential_id: string): boolean {
    const vault = this.loadVault();
    const channelCredentials = vault.channels[channel_id] || [];

    const credentialIndex = channelCredentials.findIndex(c => c.id === credential_id);
    if (credentialIndex === -1) {
      return false;
    }

    const credential = channelCredentials[credentialIndex];
    channelCredentials.splice(credentialIndex, 1);

    if (channelCredentials.length === 0) {
      delete vault.channels[channel_id];
    }

    vault.updated_at = new Date().toISOString();
    this.saveVault(vault);
    this.auditLog('DELETE', channel_id, credential_id, credential.service);

    return true;
  }

  public decryptPassword(encryptedPassword: string, iv: string, tag: string): string {
    const masterKey = this.getMasterKey();
    return this.decrypt(encryptedPassword, masterKey, iv, tag);
  }

  public getAuditLog(channel_id?: string): AuditLogEntry[] {
    const vault = this.loadVault();
    const auditLog = vault.audit_log || [];

    if (channel_id) {
      return auditLog.filter(entry => entry.channel_id === channel_id);
    }

    return auditLog;
  }

  public validateMasterKey(): boolean {
    return this.masterKey !== undefined && this.masterKey.length >= 32;
  }
}

export const credentialVault = new CredentialVault();