import Database from 'better-sqlite3';
import fs from 'node:fs';
import path from 'node:path';

export interface DataStoreSnapshot {
  tenants: any[];
  forms: any[];
  submissions: any[];
  integrations: any[];
  domains: any[];
  users: any[];
  notifications: any[];
  formDefinitions: Array<[string, any]>;
  formVersions: Array<[string, any]>;
  webhookEvents: any[];
  createdAt: string;
  version: number;
}

interface PersistedRecord {
  id: string;
  payload: string;
  created_at: string;
  updated_at: string;
}

const SNAPSHOT_ID = 'formflow_state';

export class SqliteStateStore {
  private db: Database.Database;

  constructor(
    private readonly filePath: string,
    private readonly backupDir: string = path.resolve(process.cwd(), 'backups')
  ) {
    const dataDir = path.dirname(filePath);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    if (!fs.existsSync(this.backupDir)) {
      fs.mkdirSync(this.backupDir, { recursive: true });
    }

    this.db = new Database(filePath);
    this.db.pragma('journal_mode = WAL');

    this.db
      .prepare(
        `
        CREATE TABLE IF NOT EXISTS app_state (
          id TEXT PRIMARY KEY,
          payload TEXT NOT NULL,
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL
        )
      `
      )
      .run();
  }

  load(): DataStoreSnapshot | null {
    const row = this.db.prepare('SELECT payload FROM app_state WHERE id = ?').get(SNAPSHOT_ID) as PersistedRecord | undefined;

    if (!row?.payload) {
      return null;
    }

    try {
      return JSON.parse(row.payload) as DataStoreSnapshot;
    } catch {
      return null;
    }
  }

  save(snapshot: DataStoreSnapshot): void {
    const payload = JSON.stringify(snapshot);
    const now = new Date().toISOString();

    this.db
      .prepare(
        `
        INSERT INTO app_state (id, payload, created_at, updated_at)
        VALUES (@id, @payload, @createdAt, @updatedAt)
        ON CONFLICT(id) DO UPDATE SET
          payload = EXCLUDED.payload,
          updated_at = EXCLUDED.updated_at
      `
      )
      .run({
        id: SNAPSHOT_ID,
        payload,
        createdAt: now,
        updatedAt: now,
      });
  }

  createJsonBackup(snapshot: DataStoreSnapshot): string {
    const fileName = `formflow-backup-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
    const targetPath = path.join(this.backupDir, fileName);
    fs.writeFileSync(targetPath, JSON.stringify(snapshot, null, 2), 'utf8');
    return targetPath;
  }

  listJsonBackups(): string[] {
    const files = fs.readdirSync(this.backupDir);
    return files
      .filter((file) => file.startsWith('formflow-backup-') && file.endsWith('.json'))
      .sort()
      .reverse();
  }

  removeBackup(fileName: string): boolean {
    const normalized = path.basename(fileName);
    const targetPath = path.join(this.backupDir, normalized);
    if (!fs.existsSync(targetPath)) return false;
    fs.unlinkSync(targetPath);
    return true;
  }
}
