# SSL Certificate Setup for smartlearn.io.vn

## Option 1: Using Let's Encrypt (Recommended - Free)

### Step 1: Install Certbot
```bash
# On Ubuntu/Debian
sudo apt update
sudo apt install certbot python3-certbot-nginx

# On CentOS/RHEL
sudo yum install certbot python3-certbot-nginx
```

### Step 2: Get SSL Certificate
```bash
# Stop nginx temporarily
docker compose stop frontend

# Get certificate
sudo certbot certonly --standalone -d smartlearn.io.vn -d www.smartlearn.io.vn

# Certificates will be saved to:
# /etc/letsencrypt/live/smartlearn.io.vn/fullchain.pem
# /etc/letsencrypt/live/smartlearn.io.vn/privkey.pem
```

### Step 3: Copy Certificates
```bash
# Create ssl directory
mkdir -p ssl

# Copy certificates
sudo cp /etc/letsencrypt/live/smartlearn.io.vn/fullchain.pem ssl/smartlearn.io.vn.crt
sudo cp /etc/letsencrypt/live/smartlearn.io.vn/privkey.pem ssl/smartlearn.io.vn.key

# Set permissions
sudo chmod 644 ssl/smartlearn.io.vn.crt
sudo chmod 600 ssl/smartlearn.io.vn.key
```

### Step 4: Auto-Renewal Setup
```bash
# Test renewal
sudo certbot renew --dry-run

# Add cron job for auto-renewal
sudo crontab -e

# Add this line (runs twice daily):
0 0,12 * * * certbot renew --quiet && cp /etc/letsencrypt/live/smartlearn.io.vn/fullchain.pem /path/to/project/ssl/smartlearn.io.vn.crt && cp /etc/letsencrypt/live/smartlearn.io.vn/privkey.pem /path/to/project/ssl/smartlearn.io.vn.key && docker compose restart frontend
```

## Option 2: Using Cloudflare (Easy + Free)

1. Add your domain to Cloudflare
2. Point A record to your server IP
3. Enable "Full (strict)" SSL/TLS encryption mode
4. Cloudflare handles SSL automatically
5. Keep nginx on port 80 (Cloudflare terminates HTTPS)

## Option 3: Self-Signed Certificate (Development Only)

```bash
# Create ssl directory
mkdir -p ssl

# Generate self-signed certificate
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout ssl/smartlearn.io.vn.key \
  -out ssl/smartlearn.io.vn.crt \
  -subj "/C=VN/ST=HCM/L=HCMC/O=SmartLearn/CN=smartlearn.io.vn"
```

⚠️ **Warning:** Self-signed certificates will show security warnings in browsers.

## Restart Services

After setting up SSL certificates:

```bash
# Rebuild and restart
docker compose up -d --build frontend

# Check logs
docker compose logs -f frontend
```

## DNS Configuration

Make sure your DNS records point to your server:

```
A    smartlearn.io.vn         -> YOUR_SERVER_IP
A    www.smartlearn.io.vn     -> YOUR_SERVER_IP
```

## Firewall Configuration

```bash
# Allow HTTPS traffic
sudo ufw allow 443/tcp
sudo ufw allow 80/tcp
```

## Testing

1. HTTP redirect: `http://smartlearn.io.vn` → should redirect to HTTPS
2. HTTPS: `https://smartlearn.io.vn` → should work with valid certificate
3. Test SSL: https://www.ssllabs.com/ssltest/

## Troubleshooting

### Certificate not found
- Check if ssl directory exists: `ls -la ssl/`
- Verify file permissions: `ls -l ssl/`

### Port 443 already in use
```bash
# Find process using port 443
sudo lsof -i :443
# or
sudo netstat -tulpn | grep :443
```

### Browser shows "Not Secure"
- Certificate might be self-signed or expired
- Check certificate validity: `openssl x509 -in ssl/smartlearn.io.vn.crt -text -noout`

## Update .env

Update your `.env` file:

```bash
# Frontend Configuration
FRONTEND_PORT=80
VITE_API_BASE_URL=https://smartlearn.io.vn/api/v1
```
