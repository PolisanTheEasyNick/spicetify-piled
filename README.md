# Spicetify PiLED Extension

This is a Extension, which takes current song color and sends it to PiLED HTML server!

## Installing  
Copy file dist/spicetify-piled.js to .config/spicetify/Extensions/.  
Enable extension by typing:  
`spicetify config extensions spicetify-piled.js`
Also you can build extension from source code by:  
`npm install`
`npm build`  
it should automatically copy file to needed Extensions folder.  

## Configuring  
For proper work, you need an PiLED server with HTML support builded.  
PiLED will open HTML server at port `3386` and will wait for GET requests with this structure:  
`http://ip:3386/?R={red_color}&G={green_color}&B={blue_color}&DURATION={duration_seconds}`.  
BUT. Problem is that Spotify works at https but PiLED opens http server, so directly this extension CANNOT send packages.  
What to do?  
Proxy using Nginx. AFAIK, you will need static IP address for creating SSL sertificate for proper https work.  
After proxying, setup at `src/settings.ts` your domain address.  
Example Nginx Config:  
```
server {
    listen 80;
    server_name your.ddns.com;

    allow whitelist_ip_1; #SET HERE YOUR IP
    allow whitelist_ip_2; #THIS IS IMPORTANT BECAUSE HTML AND WS SERVERS WILL SKIP ALL SECURITY CHECKS
    allow whitelist_ip_3; #BECAUSE HTML AND WS ARE DESIGNED FOR LOCAL NETWORK ONLY
    deny all;

    location /.well-known/acme-challenge/ { #acme-challenge setting for getting certificate from Let's Encrypt
        root /var/www/html/;
        try_files $uri =404;
    }

    location / {
        return 301 https://$host$request_uri;
    }

}

server {
    listen 443 ssl;
    server_name your.ddns.com;

    allow whitelist_ip_1; #SET HERE YOUR IP
    allow whitelist_ip_2; #THIS IS IMPORTANT BECAUSE HTML AND WS SERVERS WILL SKIP ALL SECURITY CHECKS
    allow whitelist_ip_3; #BECAUSE HTML AND WS ARE DESIGNED FOR LOCAL NETWORK ONLY
    deny all;

    ssl_certificate /etc/letsencrypt/live/your.ddns.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your.ddns.com/privkey.pem;

    location /.well-known/acme-challenge/ {
        root /var/www/html;
        try_files $uri =404;
    }

    location / {
        proxy_pass http://192.168.0.5:3386; #proxy to Raspberry Pi with PiLED installed and running
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```


