#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use chrono::Utc;
use rusqlite::{params, Connection, OptionalExtension};
use serde::Serialize;
use serde_json::Value;
use std::{fs, path::PathBuf, sync::Mutex};
use tauri::{Manager, State};

struct AppState {
    db: Mutex<Connection>,
    db_path: PathBuf,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct DesktopStatus {
    desktop: bool,
    database_path: String,
    journal_mode: String,
    pending_operations: i64,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct OutboxEntry {
    id: i64,
    operation: String,
    entity: String,
    record_id: String,
    payload: Value,
    created_at: String,
    attempts: i64,
    last_error: Option<String>,
}

fn initialize_database(path: &PathBuf) -> Result<Connection, String> {
    let connection = Connection::open(path).map_err(|error| error.to_string())?;
    connection
        .execute_batch(
            r#"
            PRAGMA journal_mode = WAL;
            PRAGMA synchronous = NORMAL;
            PRAGMA foreign_keys = ON;
            PRAGMA busy_timeout = 5000;

            CREATE TABLE IF NOT EXISTS records (
                entity TEXT NOT NULL,
                record_id TEXT NOT NULL,
                data_json TEXT NOT NULL,
                updated_at TEXT NOT NULL,
                dirty INTEGER NOT NULL DEFAULT 0,
                deleted INTEGER NOT NULL DEFAULT 0,
                PRIMARY KEY (entity, record_id)
            );

            CREATE INDEX IF NOT EXISTS idx_records_entity_updated
                ON records(entity, updated_at DESC);

            CREATE TABLE IF NOT EXISTS sync_outbox (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                operation TEXT NOT NULL,
                entity TEXT NOT NULL,
                record_id TEXT NOT NULL,
                payload_json TEXT NOT NULL,
                created_at TEXT NOT NULL,
                attempts INTEGER NOT NULL DEFAULT 0,
                last_error TEXT
            );

            CREATE INDEX IF NOT EXISTS idx_sync_outbox_created
                ON sync_outbox(created_at ASC);

            CREATE TABLE IF NOT EXISTS app_meta (
                meta_key TEXT PRIMARY KEY,
                meta_value TEXT NOT NULL,
                updated_at TEXT NOT NULL
            );
            "#,
        )
        .map_err(|error| error.to_string())?;
    Ok(connection)
}

fn with_connection<T>(
    state: State<'_, AppState>,
    work: impl FnOnce(&Connection) -> Result<T, String>,
) -> Result<T, String> {
    let connection = state
        .db
        .lock()
        .map_err(|_| "تعذر قفل قاعدة البيانات المحلية".to_string())?;
    work(&connection)
}

#[tauri::command]
fn desktop_status(state: State<'_, AppState>) -> Result<DesktopStatus, String> {
    let database_path = state.db_path.to_string_lossy().to_string();
    with_connection(state, move |connection| {
        let pending_operations = connection
            .query_row("SELECT COUNT(*) FROM sync_outbox", [], |row| row.get(0))
            .map_err(|error| error.to_string())?;
        let journal_mode = connection
            .query_row("PRAGMA journal_mode", [], |row| row.get::<_, String>(0))
            .unwrap_or_else(|_| "WAL".to_string());
        Ok(DesktopStatus {
            desktop: true,
            database_path,
            journal_mode,
            pending_operations,
        })
    })
}

#[tauri::command(rename_all = "camelCase")]
fn cache_upsert(
    state: State<'_, AppState>,
    entity: String,
    record_id: String,
    data: Value,
    dirty: Option<bool>,
) -> Result<(), String> {
    with_connection(state, |connection| {
        connection
            .execute(
                r#"
                INSERT INTO records(entity, record_id, data_json, updated_at, dirty, deleted)
                VALUES (?1, ?2, ?3, ?4, ?5, 0)
                ON CONFLICT(entity, record_id) DO UPDATE SET
                    data_json = excluded.data_json,
                    updated_at = excluded.updated_at,
                    dirty = excluded.dirty,
                    deleted = 0
                "#,
                params![
                    entity,
                    record_id,
                    data.to_string(),
                    Utc::now().to_rfc3339(),
                    if dirty.unwrap_or(false) { 1 } else { 0 }
                ],
            )
            .map_err(|error| error.to_string())?;
        Ok(())
    })
}

#[tauri::command(rename_all = "camelCase")]
fn cache_upsert_many(
    state: State<'_, AppState>,
    entity: String,
    rows: Vec<Value>,
    dirty: Option<bool>,
) -> Result<usize, String> {
    let mut connection = state
        .db
        .lock()
        .map_err(|_| "تعذر قفل قاعدة البيانات المحلية".to_string())?;
    let transaction = connection.transaction().map_err(|error| error.to_string())?;
    let now = Utc::now().to_rfc3339();
    let dirty_value = if dirty.unwrap_or(false) { 1 } else { 0 };
    let mut count = 0usize;

    for row in rows {
        let Some(record_id) = row.get("id").and_then(Value::as_str).map(str::to_string) else {
            continue;
        };
        transaction
            .execute(
                r#"
                INSERT INTO records(entity, record_id, data_json, updated_at, dirty, deleted)
                VALUES (?1, ?2, ?3, ?4, ?5, 0)
                ON CONFLICT(entity, record_id) DO UPDATE SET
                    data_json = excluded.data_json,
                    updated_at = excluded.updated_at,
                    dirty = excluded.dirty,
                    deleted = 0
                "#,
                params![&entity, record_id, row.to_string(), &now, dirty_value],
            )
            .map_err(|error| error.to_string())?;
        count += 1;
    }

    transaction.commit().map_err(|error| error.to_string())?;
    Ok(count)
}

#[tauri::command(rename_all = "camelCase")]
fn cache_get(
    state: State<'_, AppState>,
    entity: String,
    record_id: String,
) -> Result<Option<Value>, String> {
    with_connection(state, |connection| {
        let raw: Option<String> = connection
            .query_row(
                "SELECT data_json FROM records WHERE entity = ?1 AND record_id = ?2 AND deleted = 0",
                params![entity, record_id],
                |row| row.get(0),
            )
            .optional()
            .map_err(|error| error.to_string())?;
        raw.map(|value| serde_json::from_str(&value).map_err(|error| error.to_string()))
            .transpose()
    })
}

#[tauri::command(rename_all = "camelCase")]
fn cache_list(state: State<'_, AppState>, entity: String) -> Result<Vec<Value>, String> {
    with_connection(state, |connection| {
        let mut statement = connection
            .prepare(
                "SELECT data_json FROM records WHERE entity = ?1 AND deleted = 0 ORDER BY updated_at DESC",
            )
            .map_err(|error| error.to_string())?;
        let mapped = statement
            .query_map(params![entity], |row| row.get::<_, String>(0))
            .map_err(|error| error.to_string())?;
        let mut rows = Vec::new();
        for item in mapped {
            let raw = item.map_err(|error| error.to_string())?;
            if let Ok(value) = serde_json::from_str::<Value>(&raw) {
                rows.push(value);
            }
        }
        Ok(rows)
    })
}

#[tauri::command(rename_all = "camelCase")]
fn cache_delete(
    state: State<'_, AppState>,
    entity: String,
    record_id: String,
) -> Result<(), String> {
    with_connection(state, |connection| {
        connection
            .execute(
                "UPDATE records SET deleted = 1, dirty = 1, updated_at = ?3 WHERE entity = ?1 AND record_id = ?2",
                params![entity, record_id, Utc::now().to_rfc3339()],
            )
            .map_err(|error| error.to_string())?;
        Ok(())
    })
}

#[tauri::command(rename_all = "camelCase")]
fn cache_mark_clean(
    state: State<'_, AppState>,
    entity: String,
    record_id: String,
) -> Result<(), String> {
    with_connection(state, |connection| {
        connection
            .execute(
                "UPDATE records SET dirty = 0 WHERE entity = ?1 AND record_id = ?2",
                params![entity, record_id],
            )
            .map_err(|error| error.to_string())?;
        Ok(())
    })
}

#[tauri::command(rename_all = "camelCase")]
fn outbox_enqueue(
    state: State<'_, AppState>,
    operation: String,
    entity: String,
    record_id: String,
    payload: Value,
) -> Result<i64, String> {
    with_connection(state, |connection| {
        connection
            .execute(
                r#"
                INSERT INTO sync_outbox(operation, entity, record_id, payload_json, created_at)
                VALUES (?1, ?2, ?3, ?4, ?5)
                "#,
                params![
                    operation,
                    entity,
                    record_id,
                    payload.to_string(),
                    Utc::now().to_rfc3339()
                ],
            )
            .map_err(|error| error.to_string())?;
        Ok(connection.last_insert_rowid())
    })
}

#[tauri::command]
fn outbox_list(
    state: State<'_, AppState>,
    limit: Option<i64>,
) -> Result<Vec<OutboxEntry>, String> {
    with_connection(state, |connection| {
        let mut statement = connection
            .prepare(
                r#"
                SELECT id, operation, entity, record_id, payload_json, created_at, attempts, last_error
                FROM sync_outbox
                ORDER BY created_at ASC, id ASC
                LIMIT ?1
                "#,
            )
            .map_err(|error| error.to_string())?;
        let mapped = statement
            .query_map(params![limit.unwrap_or(100).clamp(1, 500)], |row| {
                let payload_raw: String = row.get(4)?;
                Ok(OutboxEntry {
                    id: row.get(0)?,
                    operation: row.get(1)?,
                    entity: row.get(2)?,
                    record_id: row.get(3)?,
                    payload: serde_json::from_str(&payload_raw).unwrap_or(Value::Null),
                    created_at: row.get(5)?,
                    attempts: row.get(6)?,
                    last_error: row.get(7)?,
                })
            })
            .map_err(|error| error.to_string())?;
        let mut entries = Vec::new();
        for item in mapped {
            entries.push(item.map_err(|error| error.to_string())?);
        }
        Ok(entries)
    })
}

#[tauri::command(rename_all = "camelCase")]
fn outbox_mark_done(state: State<'_, AppState>, id: i64) -> Result<(), String> {
    with_connection(state, |connection| {
        connection
            .execute("DELETE FROM sync_outbox WHERE id = ?1", params![id])
            .map_err(|error| error.to_string())?;
        Ok(())
    })
}

#[tauri::command(rename_all = "camelCase")]
fn outbox_mark_failed(
    state: State<'_, AppState>,
    id: i64,
    error: String,
) -> Result<(), String> {
    with_connection(state, |connection| {
        connection
            .execute(
                "UPDATE sync_outbox SET attempts = attempts + 1, last_error = ?2 WHERE id = ?1",
                params![id, error],
            )
            .map_err(|db_error| db_error.to_string())?;
        Ok(())
    })
}

#[tauri::command(rename_all = "camelCase")]
fn meta_set(
    state: State<'_, AppState>,
    key: String,
    value: String,
) -> Result<(), String> {
    with_connection(state, |connection| {
        connection
            .execute(
                r#"
                INSERT INTO app_meta(meta_key, meta_value, updated_at)
                VALUES (?1, ?2, ?3)
                ON CONFLICT(meta_key) DO UPDATE SET
                    meta_value = excluded.meta_value,
                    updated_at = excluded.updated_at
                "#,
                params![key, value, Utc::now().to_rfc3339()],
            )
            .map_err(|error| error.to_string())?;
        Ok(())
    })
}

#[tauri::command(rename_all = "camelCase")]
fn meta_get(state: State<'_, AppState>, key: String) -> Result<Option<String>, String> {
    with_connection(state, |connection| {
        connection
            .query_row(
                "SELECT meta_value FROM app_meta WHERE meta_key = ?1",
                params![key],
                |row| row.get(0),
            )
            .optional()
            .map_err(|error| error.to_string())
    })
}

fn main() {
    tauri::Builder::default()
        .setup(|app| {
            let app_data_dir = app.path().app_data_dir()?;
            fs::create_dir_all(&app_data_dir)?;
            let db_path = app_data_dir.join("helm-office.sqlite3");
            let connection = initialize_database(&db_path)
                .map_err(|error| std::io::Error::new(std::io::ErrorKind::Other, error))?;
            app.manage(AppState {
                db: Mutex::new(connection),
                db_path,
            });
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            desktop_status,
            cache_upsert,
            cache_upsert_many,
            cache_get,
            cache_list,
            cache_delete,
            cache_mark_clean,
            outbox_enqueue,
            outbox_list,
            outbox_mark_done,
            outbox_mark_failed,
            meta_set,
            meta_get
        ])
        .run(tauri::generate_context!())
        .expect("تعذر تشغيل برنامج HELM Legal Office");
}
