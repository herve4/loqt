# Deployment guide for sglci.sajholding.org

## 1) Environment file

Copy `.env.prod.example` to `.env` and edit values:

```bash
cp /home/herve/loqt/.env.prod.example /home/herve/loqt/.env
nano /home/herve/loqt/.env
```

Ensure at least:

```
SECRET_KEY=<generate-a-strong-random-secret>
DEBUG=False
DJANGO_ALLOWED_HOSTS=sglci.sajholding.org
DB_NAME=loqt
DB_USER=loqt
DB_PASSWORD=loqt264
DB_HOST=localhost
DB_PORT=5432
```

## 2) Collect static

```bash
source /home/herve/loqt/venv/bin/activate
python manage.py collectstatic --noinput
```

## 3) Gunicorn as a systemd service

Install gunicorn if not present:

```bash
source /home/herve/loqt/venv/bin/activate
pip install gunicorn
```

Create unit files from templates:

```bash
sudo cp /home/herve/loqt/deploy/gunicorn-loqt.service.template /etc/systemd/system/gunicorn-loqt.service
sudo cp /home/herve/loqt/deploy/gunicorn-loqt.socket.template /etc/systemd/system/gunicorn-loqt.socket
```

Enable and start:

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now gunicorn-loqt.socket
sudo systemctl enable --now gunicorn-loqt.service
sudo systemctl status gunicorn-loqt.service
```

## 4) Nginx

Install Nginx if needed and create site config:

```bash
sudo cp /home/herve/loqt/deploy/nginx-sglci.conf.template /etc/nginx/sites-available/sglci.sajholding.org
sudo ln -s /etc/nginx/sites-available/sglci.sajholding.org /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

## 5) TLS with Let’s Encrypt

After Nginx works over HTTP, request a certificate:

```bash
sudo certbot --nginx -d sglci.sajholding.org
```

Certbot will add the 443 server block and HTTP->HTTPS redirects automatically. If you prefer manual configuration, adapt the template to listen on 443 with the provided cert paths.

## 6) Useful commands

- Restart app:
  ```bash
  sudo systemctl restart gunicorn-loqt
  ```
- View logs:
  ```bash
  journalctl -u gunicorn-loqt -f
  ```
- Reload Nginx:
  ```bash
  sudo systemctl reload nginx
  ```

## Notes

- `loqt/settings.py` already sets `USE_X_FORWARDED_HOST=True` and `SECURE_PROXY_SSL_HEADER=('HTTP_X_FORWARDED_PROTO','https')` which is correct behind Nginx.
- Keep `collectstatic` in your deployment steps whenever static files change.
- For Celery or other workers, ensure they load the same `.env` and are restarted on deployments.
