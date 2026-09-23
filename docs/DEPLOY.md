# Deploy I-MODE Plus Service & Maintenance on nginx

This application is a static site: nginx serves the repository files directly. There is
no Node.js process, build command, application server, or database running on this host.
Supabase remains the backend.

## Before the first deployment

- Choose the final hostname, for example `service.example.com`, and point its DNS `A`
  record at the server.
- Allow inbound TCP 80 and 443 in the firewall. Port 80 is needed for the initial
  Let's Encrypt challenge and redirects to HTTPS afterwards.
- Install nginx and Certbot using the operating system's supported packages.
- Put a reviewed release under `/srv/imode-service/releases/<release-name>` and point
  `/srv/imode-service/current` at that release. The nginx worker must have read access.
- Do not copy `.git`, backups, local scratch files, or SQL files into the public web root.
  The browser only needs the application HTML, `auth/`, `assets/`, `css/`, `js/`, `pages/`
  and `vendor/` content.

Use a new release directory for every deployment. Change the `current` symlink only after
the new directory is complete; this prevents users receiving half of one release and half
of another while files are being copied.

## HTTPS is mandatory

The customer QR scanner uses `BarcodeDetector` / `getUserMedia`. Browser camera access is
restricted to a secure context, and the scanner control may not be rendered when that
requirement is not met. Production must therefore use HTTPS; plain HTTP is only the
redirect and must not be the address given to customers.

After DNS resolves and the HTTP nginx block is active, request a certificate:

```bash
sudo certbot --nginx -d service.example.com
```

Enable the distribution's Certbot renewal timer and verify it with a dry run. Replace the
example hostname everywhere below with the real one.

## nginx configuration

Save this as `/etc/nginx/sites-available/imode-service.conf`, enable it using the normal
nginx mechanism for the server, then run `sudo nginx -t` before reloading nginx.

```nginx
server {
    listen 80;
    listen [::]:80;
    server_name service.example.com;

    location ^~ /.well-known/acme-challenge/ {
        root /var/www/letsencrypt;
    }

    location / {
        return 301 https://$host$request_uri;
    }
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name service.example.com;

    ssl_certificate     /etc/letsencrypt/live/service.example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/service.example.com/privkey.pem;

    root /srv/imode-service/current;
    index index.html;
    charset utf-8;

    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # There are 92+ ordered patch scripts and no filename cache-busting. HTML, JS and
    # CSS must be revalidated on every visit so a device cannot combine a new patch with
    # stale earlier files. That mixed state is extremely difficult to diagnose.
    location ~* \.(?:html?|js|css)$ {
        expires -1;
        add_header Cache-Control "no-cache, must-revalidate" always;
        try_files $uri =404;
    }

    # Versioned/reviewed binary assets may be cached. A changed asset should get a new
    # filename, or the cache must be purged intentionally.
    location ~* \.(?:png|jpe?g|gif|webp|svg|ico|woff2?|ttf|otf)$ {
        expires 30d;
        add_header Cache-Control "public, max-age=2592000" always;
        try_files $uri =404;
    }

    location / {
        try_files $uri $uri/ =404;
    }
}
```

The `no-cache` directive does not mean “never store”. It means the browser must ask nginx
whether the file changed before reusing it. This matters because later numbered scripts
override earlier scripts; one stale file can silently change the active implementation.

Do not add a single-page-app fallback such as `try_files $uri /index.html`. This project
does not use URL routing and should return a real 404 for missing assets.

## Release procedure

1. Confirm the Git revision being released and that the worktree contains no unintended
   files.
2. Copy that exact revision into a new release directory.
3. Verify file ownership/read permissions and confirm the required relative paths retain
   their exact letter casing.
4. Point `/srv/imode-service/current` at the completed release.
5. Run `sudo nginx -t`, then reload nginx.
6. Open the site in a private window and confirm there are no 404s or JavaScript errors.
7. Test at desktop, tablet and phone widths. On a real HTTPS phone, test the camera QR
   scanner, Customer Home, login, one assigned job and the case detail page.

Useful response checks after reload:

```bash
curl -I https://service.example.com/
curl -I https://service.example.com/js/92-v70CaseUpdatedScript.js
curl -I https://service.example.com/assets/Iconservice.png
curl -I https://service.example.com/pages/customer-home.html
```

The HTML/JS responses should include `Cache-Control: no-cache, must-revalidate`; the image
should show a 30-day cache lifetime. Every URL must return the expected content type and
must not redirect back to the old GitHub Pages deployment.

## Application settings after deployment

In **ตั้งค่าระบบ → LINE OA สำหรับลูกค้า → Public App URL**, replace
`https://imodeservice.github.io/ImodeService/` with the final HTTPS origin, including its
trailing slash, for example:

```text
https://service.example.com/
```

No machine QR labels have been printed yet, so there is no legacy customer URL to preserve.
Generate/print QR labels only after this value and the final hostname have been verified.

If Supabase Auth is enabled, also add the final HTTPS origin to the project's allowed Site
URL / redirect URLs before testing password reset.

## Never deploy with `file://`

Opening `index.html` by double-clicking it is not a valid deployment. `pages/pages.js`
loads `pages/customer-home.html` over HTTP(S); a `file://` page cannot reliably read that
fragment and falls back to an error notice. Always access the application through nginx
(or a local HTTP server during development).

## Rollback

Keep at least the previous reviewed release directory. To roll back, repoint `current` to
that complete release, run `sudo nginx -t`, reload nginx, and repeat the private-window
checks. A rollback changes only static files; database/schema rollback is a separate,
explicit operation and must never be inferred from a web-file rollback.

## Offline mode — the service worker (added 2026-09-23)

`sw.js` at the site root lets a technician OPEN the app with no signal. It must be served
from the same directory as `index.html`, because a service worker can only control the scope
it is served from; `js/111` registers it as `./sw.js` so the sub-path deployment
(`https://imodeservice.github.io/ImodeService/`) scopes correctly.

**It does not conflict with the `no-cache` policy above, and must not be made to.** Serve
`sw.js` itself with `no-cache, must-revalidate` like the other files — a stale service worker
is the one thing here that is genuinely hard to recover from on a phone. The worker is
network-first for every same-origin file, so an online device always runs one consistent set
of scripts and the HTTP cache headers still decide freshness; the stored copy is used only
when the network fails outright.

Requests to `supabase.co` are passed straight through and never stored.

After a release, the first online load of each device rebuilds its copy. To force every
device to rebuild, bump `VERSION` in `sw.js`; old caches are deleted on activate. To remove
offline mode from one device, run `imodeDisableOffline()` in its console and reload once.
