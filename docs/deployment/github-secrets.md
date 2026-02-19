# GitHub Secrets for Deployment

## PWA (Server SSH)
- `PWA_SSH_HOST` (example: `203.0.113.10`)
- `PWA_SSH_USER` (example: `ubuntu`)
- `PWA_SSH_PRIVATE_KEY` (private key content)
- `PWA_WEB_DIR` (example: `/var/www/portal.stanforteedge.com`)

## API (Server SSH)
- `API_SSH_HOST` (example: `203.0.113.10`)
- `API_SSH_USER` (example: `ubuntu`)
- `API_SSH_PRIVATE_KEY` (private key content)
- `API_APP_DIR` (example: `/var/www/stanforteedge`)

## Notes
- Keep production `.env` only on server, not in repository.
- API deploy workflow expects `pm2` installed on server.
