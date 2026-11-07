# Smart Shop Manager

Smart Shop Manager is a full-stack retail and inventory management application built with a Spring Boot backend and a React/Vite frontend.

---

## Configuration & Secrets Management

To run the backend securely without committing sensitive secrets, configure the following environment variables or create a local properties file:

### Environment Variables

| Variable | Description | Default | Required in Prod |
|---|---|---|---|
| `SERVER_PORT` | Backend HTTP server port | `8081` | No |
| `DB_URL` | JDBC Database URL | `jdbc:mysql://localhost:3306/shop_manager` | No |
| `DB_USERNAME` | Dedicated database application username | `shop_manager_user` | No |
| `DB_PASSWORD` | Database password | None | **Yes** |
| `JWT_SECRET` | Secret key for signing JWTs (must be >= 256 bits / 32 chars) | None | **Yes** |
| `JWT_EXPIRATION_MS` | JWT expiration duration in milliseconds | `86400000` (24h) | No |
| `ADMIN_USERNAME` | Initial administrator username | `admin` | No |
| `ADMIN_PASSWORD` | Initial administrator password (must be >= 8 chars, non-default) | None | **Yes** |
| `CORS_ALLOWED_ORIGINS` | Comma-separated list of allowed CORS origins | `http://localhost:5173,http://localhost:3000,http://127.0.0.1:5173,http://127.0.0.1:3000` | No |
| `BACKUP_RETENTION_DAYS` | Number of days to retain automated database backup files | `14` | No |

### Local Properties Setup (Alternative)

You can create an `application-local.properties` file in `Smart-Shop-Manager/backend/src/main/resources/` (which is gitignored):

```properties
spring.datasource.password=your_db_password
jwt.secret=your_super_secret_jwt_key_at_least_32_characters_long
admin.username=admin
admin.password=your_strong_admin_password_min_8_chars
```

Then run the application with the `local` profile or provide the environment variables directly.

---

## Running Locally

### Backend (Spring Boot)

```bash
cd Smart-Shop-Manager/backend
# Set required env vars or use application-local.properties:
$env:DB_PASSWORD="your_password"
$env:JWT_SECRET="your_secure_256_bit_jwt_secret_key_here_12345"
$env:ADMIN_USERNAME="admin"
$env:ADMIN_PASSWORD="your_strong_admin_password_min_8_chars"
.\mvnw.cmd spring-boot:run
```

Keep the backend terminal running. Verify it is available before opening the frontend:

```text
http://localhost:8081/actuator/health
```

On Windows, `backend\run-local.cmd` performs Java and MySQL reachability checks and starts the backend service. It prompts for `DB_PASSWORD` and `ADMIN_PASSWORD` unless those variables are already exported in the shell.

### Frontend (React + Vite)

```bash
cd Smart-Shop-Manager/frontend
npm install
npm run dev
```

The frontend dev server runs at `http://localhost:5173` and proxies `/api` requests to the backend server.

---

## Production Deployment & Packaging

### Backend Packaging

Build the executable Spring Boot JAR with Maven:

```bash
cd Smart-Shop-Manager/backend
./mvnw clean package -DskipTests
```

The compiled JAR will be located at `target/backend-0.0.1-SNAPSHOT.jar`. Run it with production environment variables:

```bash
export DB_URL="jdbc:mysql://db-host:3306/shop_manager"
export DB_USERNAME="shop_manager_user"
export DB_PASSWORD="production_db_password"
export JWT_SECRET="production_jwt_secret_at_least_32_chars_long"
export ADMIN_USERNAME="admin"
export ADMIN_PASSWORD="strong_production_admin_password"
export SERVER_PORT="8081"
java -jar target/backend-0.0.1-SNAPSHOT.jar
```

### Frontend Packaging

Build the production frontend bundle with Vite:

```bash
cd Smart-Shop-Manager/frontend
npm run build
```

The production assets will be generated in `dist/`. Serve these static files using a reverse proxy (e.g. Nginx or Caddy) configured to route `/api/` and `/actuator/health` to the backend service.

### Security & Health Probes

- The backend exposes only `/actuator/health`, `/actuator/info`, and `/actuator/metrics`.
- Health check `/actuator/health` is public without exposing database or configuration internals (`management.endpoint.health.show-details=never`).
- Information and metrics require admin authentication.
- Access tokens are revocable on `/api/auth/logout` and stored in isolated session storage to minimize browser script exposure.

---

## Database Backup and Recovery

### Creating a Consistent Backup

Use standard `mysqldump` with transactional consistency:

```bash
# Linux / macOS / WSL
set -o pipefail
BACKUP_FILE="shop_manager_backup_$(date +%Y%m%dT%H%M%SZ).sql.gz"
if mysqldump -h localhost -P 3306 -u shop_manager_user -p \
  --single-transaction \
  --quick \
  --routines \
  --triggers \
  shop_manager | gzip > "$BACKUP_FILE"; then
  echo "Backup created successfully: $BACKUP_FILE"
else
  echo "Backup failed; removing incomplete archive." >&2
  rm -f "$BACKUP_FILE"
  exit 1
fi

# Windows PowerShell
& mysqldump.exe -h localhost -P 3306 -u shop_manager_user -p --single-transaction --quick --routines --triggers --result-file="shop_manager_backup_$(Get-Date -Format 'yyyyMMddTHHmmssZ').sql" shop_manager
```

- `--single-transaction` creates a snapshot without locking tables, allowing sales and reads during the dump.
- Store backups in a secure, non-public directory with restricted filesystem permissions (`chmod 600`).
- Retain daily backups for `BACKUP_RETENTION_DAYS` (default 14 days) and prune older archives with an automated scheduled task or cron job.

### Verifying and Restoring a Backup

Always test backup restoration into an isolated test database rather than production:

```bash
# 1. Create a disposable test database
mysql -h localhost -P 3306 -u shop_manager_user -p -e "CREATE DATABASE IF NOT EXISTS shop_manager_restore_test;"

# 2. Restore backup into the test database
# Linux / macOS
gunzip < shop_manager_backup_20261107T120000Z.sql.gz | mysql -h localhost -P 3306 -u shop_manager_user -p shop_manager_restore_test

# Windows PowerShell
cmd.exe /c "mysql -h localhost -P 3306 -u shop_manager_user -p shop_manager_restore_test < shop_manager_backup_20261107T120000Z.sql"

# 3. Clean up the test database after verification
mysql -h localhost -P 3306 -u shop_manager_user -p -e "DROP DATABASE IF EXISTS shop_manager_restore_test;"
```
