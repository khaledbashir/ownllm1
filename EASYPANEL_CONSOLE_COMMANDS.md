# EasyPanel Console Commands

## 🚀 Essential Commands for Production Troubleshooting

---

## 📦 Container Management

### View All Containers
```bash
docker ps
```

### View All Containers (including stopped)
```bash
docker ps -a
```

### Restart OwnLLM Container
```bash
docker restart <container_name>
```
*Replace `<container_name>` with your actual container name (e.g., `ownllm_server_1`)*

### Stop Container
```bash
docker stop <container_name>
```

### Start Container
```bash
docker start <container_name>
```

### View Container Logs (Real-time)
```bash
docker logs -f <container_name>
```

### View Last 100 Lines of Logs
```bash
docker logs --tail 100 <container_name>
```

### View Container Resource Usage
```bash
docker stats <container_name>
```

---

## 🔍 Debugging & Diagnostics

### Check Database Connection
```bash
docker exec <container_name> psql postgres://postgres:8ff65f5bbe23a1aa31f7@basheer_postgres:5432/ownllm?sslmode=disable
```

### Run Prisma Database Migrations
```bash
docker exec <container_name> npx prisma migrate deploy
```

### Generate Prisma Client
```bash
docker exec <container_name> npx prisma generate
```

### Reset Database (⚠️ DANGER: Deletes All Data)
```bash
docker exec <container_name> npx prisma migrate reset --force
```

### Check Prisma Studio (if accessible)
```bash
docker exec -it <container_name> npx prisma studio
```

---

## 📊 Storage & File Management

### Access Container Shell
```bash
docker exec -it <container_name> bash
```

### Check Storage Directory Size
```bash
docker exec <container_name> du -sh /app/server/storage
```

### List Storage Contents
```bash
docker exec <container_name> ls -la /app/server/storage
```

### Clear Vector Database (LanceDB)
```bash
docker exec <container_name> rm -rf /app/server/storage/vector-db/*
```

### Clear Documents
```bash
docker exec <container_name> rm -rf /app/server/storage/documents/*
```

### Clear All Storage (⚠️ DANGER: Deletes All Documents & Vectors)
```bash
docker exec <container_name> rm -rf /app/server/storage/*
```

---

## 🔄 Build & Deployment

### Pull Latest Image
```bash
docker pull <your_image_name>
```

### Rebuild Container
```bash
docker-compose build ownllm
```
*From your docker-compose.yml directory*

### Rebuild with No Cache
```bash
docker-compose build --no-cache ownllm
```

### View Build Logs
```bash
docker-compose logs -f ownllm
```

---

## 🌐 Network & Connectivity

### Check Container Ports
```bash
docker port <container_name>
```

### Check Network Configuration
```bash
docker network inspect <network_name>
```

### Test Database Connectivity
```bash
docker exec <container_name> nc -zv basheer_postgres 5432
```

### Test Redis (if used)
```bash
docker exec <container_name> nc -zv redis 6379
```

---

## 🔐 Environment & Configuration

### View Environment Variables
```bash
docker exec <container_name> env | grep -E "LLM|DB|STORAGE"
```

### Restart with Temporary Environment Override
```bash
docker run -e LLM_PROVIDER="zai" -e DEBUG="true" <image_name>
```

### Update Environment Variable in EasyPanel
1. Go to EasyPanel > Your Service > Environment
2. Add/Edit variable
3. Click "Save & Deploy"

---

## 📝 Log Management

### Export Logs to File
```bash
docker logs <container_name> > ownllm-logs.txt
```

### Follow Specific Log Pattern
```bash
docker logs -f <container_name> | grep "ERROR"
```

### View Errors Only
```bash
docker logs <container_name> 2>&1 | grep -i error
```

### Clear Docker Logs
```bash
sudo sh -c "truncate -s 0 /var/lib/docker/containers/*/*-json.log"
```

---

## 🧹 Cleanup & Maintenance

### Remove Unused Docker Images
```bash
docker image prune -a
```

### Remove Stopped Containers
```bash
docker container prune
```

### Remove Unused Volumes
```bash
docker volume prune
```

### Full System Cleanup
```bash
docker system prune -a --volumes
```

### View Disk Usage
```bash
docker system df
```

---

## 🔒 Backup & Restore

### Backup Database
```bash
docker exec basheer_postgres pg_dump -U postgres ownllm > backup.sql
```

### Restore Database
```bash
docker exec -i basheer_postgres psql -U postgres ownllm < backup.sql
```

### Backup Storage Directory
```bash
docker cp <container_name>:/app/server/storage ./storage-backup
```

### Restore Storage Directory
```bash
docker cp ./storage-backup <container_name>:/app/server/storage
```

---

## 🐛 Common Issues & Solutions

### Issue: Container Won't Start
```bash
# Check logs
docker logs <container_name>

# Check if port is in use
netstat -tulpn | grep 3001

# Kill process using port
kill -9 <pid>
```

### Issue: Database Connection Failed
```bash
# Check if PostgreSQL is running
docker ps | grep postgres

# Check PostgreSQL logs
docker logs basheer_postgres

# Test connection
docker exec <container_name> psql postgres://postgres:8ff65f5bbe23a1aa31f7@basheer_postgres:5432/ownllm?sslmode=disable
```

### Issue: High Memory Usage
```bash
# Check container stats
docker stats <container_name>

# Restart container
docker restart <container_name>

# If persistent, check for memory leaks
docker exec <container_name> node --inspect=0.0.0.0:9229
```

### Issue: Slow Performance
```bash
# Check resource limits
docker inspect <container_name> | grep -A 10 HostConfig

# Increase memory limit in EasyPanel settings
```

### Issue: File Uploads Failing
```bash
# Check storage permissions
docker exec <container_name> ls -la /app/server/storage

# Fix permissions if needed
docker exec <container_name> chown -R 1000:1000 /app/server/storage
```

---

## 📈 Monitoring

### Real-time Resource Monitoring
```bash
watch -n 1 'docker stats --no-stream'
```

### Monitor Specific Metrics
```bash
docker stats <container_name> --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.NetIO}}"
```

### Check Container Health
```bash
docker inspect <container_name> | grep -A 10 Health
```

---

## 🔑 Security Checks

### Check for Vulnerable Images
```bash
docker scan <image_name>
```

### View Running Processes in Container
```bash
docker exec <container_name> ps aux
```

### Check Open Ports
```bash
docker exec <container_name> netstat -tulpn
```

---

## 📞 Getting Container Names

### Find Your Container Names
```bash
docker ps --format "table {{.Names}}\t{{.Image}}\t{{.Status}}"
```

### Typical Container Names in Your Setup:
- `ownllm_server_1` - Main application
- `basheer_postgres` - PostgreSQL database
- `ownllm_collector_1` - Document collector service

---

## ⚡ Quick Reference

| Action | Command |
|---------|---------|
| View logs | `docker logs -f <container>` |
| Restart | `docker restart <container>` |
| Shell access | `docker exec -it <container> bash` |
| Database migration | `docker exec <container> npx prisma migrate deploy` |
| Clear cache | `docker exec <container> rm -rf /app/server/storage/vector-db/*` |
| Backup DB | `docker exec basheer_postgres pg_dump -U postgres ownllm > backup.sql` |
| Resource stats | `docker stats` |
| Check health | `docker ps` |

---

## 🆘 Emergency Commands

### Force Kill Container
```bash
docker kill -s SIGKILL <container_name>
```

### Remove Container Completely
```bash
docker rm -f <container_name>
```

### Rebuild from Scratch
```bash
docker-compose down -v
docker-compose up -d --build
```

### Reset Everything (⚠️ EXTREME DANGER)
```bash
docker-compose down -v
docker system prune -a --volumes
docker-compose up -d
```

---

## 📝 Notes

- Replace `<container_name>` with your actual container name
- Some commands require root access (use `sudo` if needed)
- Always backup data before running destructive commands
- Test commands in development environment first
- Monitor logs after running any maintenance command
