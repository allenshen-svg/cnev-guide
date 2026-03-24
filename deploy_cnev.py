import paramiko, time

host = '47.83.165.131'
user = 'root'
pwd = 'Allen1989716!'

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect(host, username=user, password=pwd, timeout=10)

def run_cmd(cmd, timeout=30):
    print(f'>>> {cmd}')
    chan = ssh.get_transport().open_session()
    chan.settimeout(timeout)
    chan.exec_command(cmd)
    out = b''
    try:
        while True:
            chunk = chan.recv(4096)
            if not chunk:
                break
            out += chunk
    except Exception:
        pass
    exit_code = chan.recv_exit_status()
    result = out.decode(errors='replace').strip()
    if result:
        print(result)
    print(f'[exit: {exit_code}]')
    return result

# 1. Write systemd service file
service_content = """[Unit]
Description=CNEV Guide Web App
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/opt/cnev-guide
Environment=PYTHONUNBUFFERED=1
ExecStart=/usr/local/bin/gunicorn -w 2 -b 127.0.0.1:8090 --timeout 120 server:app
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
"""

sftp = ssh.open_sftp()
with sftp.open('/etc/systemd/system/cnev-guide.service', 'w') as f:
    f.write(service_content)
print('=== systemd service written ===')

# 2. Write nginx config
nginx_conf = """server {
    listen 80;
    server_name cnevguide.com www.cnevguide.com;

    location / {
        proxy_pass http://127.0.0.1:8090;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
"""

with sftp.open('/etc/nginx/sites-available/cnev-guide', 'w') as f:
    f.write(nginx_conf)
sftp.close()
print('=== nginx config written ===')

# 3. Enable nginx site
run_cmd('ln -sf /etc/nginx/sites-available/cnev-guide /etc/nginx/sites-enabled/cnev-guide')
run_cmd('nginx -t 2>&1')

# 4. Start services
run_cmd('systemctl daemon-reload')
run_cmd('systemctl enable cnev-guide 2>&1')
run_cmd('systemctl start cnev-guide 2>&1')
time.sleep(2)
run_cmd('systemctl is-active cnev-guide')

# 5. Reload nginx
run_cmd('systemctl reload nginx 2>&1')

# 6. Test
time.sleep(1)
run_cmd('curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:8090/')
run_cmd('curl -s http://127.0.0.1:8090/ | head -5')

print('\n=== Deployment complete! ===')
print('Next: Add DNS A record for cnevguide.com -> 47.83.165.131')

ssh.close()
