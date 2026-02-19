# Server Preparation (API)

## 1) Base packages
```bash
sudo apt update
sudo apt install -y git curl build-essential nginx
```

## 2) Node + PM2
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
sudo npm i -g pm2
```

## 3) PostgreSQL (if local on same server)
```bash
sudo apt install -y postgresql postgresql-contrib
sudo systemctl enable --now postgresql
```

## 4) App directory + SSH user permissions
```bash
sudo mkdir -p /var/www/stanforteedge
sudo chown -R $USER:$USER /var/www/stanforteedge
```

Use this same path for GitHub secret `API_APP_DIR`.

## 5) Environment file
Create: `/var/www/stanforteedge/api/.env`

Minimum required:
- `DATABASE_URL`
- `JWT_SECRET`
- `JWT_REFRESH_SECRET`
- `APP_BASE_URL`
- SMTP vars:
  - `SMTP_HOST`
  - `SMTP_PORT`
  - `SMTP_USER`
  - `SMTP_PASS`
  - `SMTP_SECURE`

## 6) First deploy smoke (manual one-time)
```bash
cd /var/www/stanforteedge
npm ci
npm run prisma:generate -w api
npm run build -w api
npm run prisma:migrate -w api
npm run seed:release-baseline -w api
pm2 start api/ecosystem.config.cjs --env production
pm2 save
pm2 startup
```

## 7) Nginx reverse proxy
Create `/etc/nginx/sites-available/stanforte-api`:
```nginx
server {
  listen 80;
  server_name api.yourdomain.com;

  location / {
    proxy_pass http://127.0.0.1:3000;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_set_header Host $host;
    proxy_cache_bypass $http_upgrade;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
  }
}
```

Enable:
```bash
sudo ln -s /etc/nginx/sites-available/stanforte-api /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

## 8) TLS
```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d api.yourdomain.com
```
