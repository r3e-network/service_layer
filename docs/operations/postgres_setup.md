# PostgreSQL Setup

This guide explains how to connect the refactored Service Layer to PostgreSQL
and how to apply the embedded migrations that create the new `app_*` tables.

## 1. Create a Database

Provision a PostgreSQL instance (v13+) and create a database/user:

```sql
CREATE DATABASE service_layer;
CREATE USER service_layer WITH ENCRYPTED PASSWORD 'change-me';
GRANT ALL PRIVILEGES ON DATABASE service_layer TO service_layer;
```

If you already have an instance, reuse it and ensure the user has privileges to
create tables and indexes.

## 2. Choose a Connection Strategy

The new `cmd/appserver` binary accepts configuration from **flags**, **environment
variables**, or **JSON/YAML** config files. The DSN precedence is:

1. `-dsn` flag (optional)
2. `DATABASE_URL` environment variable
3. `database.dsn` from config JSON/YAML
4. `database.host`/`port`/`user`/`password`/`name` fallback (converted into a DSN)

### Example Config Files

JSON sample (`configs/examples/appserver.json`):

```json
{
  "database": {
    "dsn": "postgres://service_layer:service_layer@localhost:5432/service_layer?sslmode=disable"
  }
}
```

YAML sample (`configs/config.yaml`):

```yaml
database:
  dsn: "postgres://service_layer:service_layer@localhost:5432/service_layer?sslmode=disable"
  max_open_conns: 25
  max_idle_conns: 5
  conn_max_lifetime: 300
```

### Environment Variable

```
export DATABASE_URL="postgres://service_layer:service_layer@localhost:5432/service_layer?sslmode=disable"
```

## 3. Running Migrations

Migrations are bundled with the binary. On startup, pass `-migrate` to apply the
SQL files (idempotent thanks to `IF NOT EXISTS` guards):

```
go run ./cmd/appserver \
  -config configs/examples/appserver.json \
  -migrate \
  -addr :8080
```

After the database schema is ready you can omit `-migrate`. The server stays
running after migrations complete; use Ctrl+C to exit if you only needed to run
the schema update.

## 4. Connection Pool Tuning

Pool settings (`max_open_conns`, `max_idle_conns`, `conn_max_lifetime`) are read
from the config file when provided. Adjust them for your deployment target, e.g.
lower values for development, higher for production.

## 5. Verifying the Setup

1. Start the server (with `-migrate` on first run).
2. Confirm it logs `service layer listening on ...`.
3. Inspect the database to verify tables such as `app_accounts` and
   `app_gas_accounts` exist.

You can tear down the database by dropping the tables or truncating them if you
need a clean slate for testing.
