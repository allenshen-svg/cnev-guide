"""Deploy changed files directly to server via SFTP"""
import paramiko, os, time

host = '47.83.165.131'
user = 'root'
pwd = 'Allen1989716!'
local_dir = '/Users/allen.shen/ev-car-web'
remote_dir = '/opt/cnev-guide'

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect(host, username=user, password=pwd, timeout=10)
sftp = ssh.open_sftp()

# Files to sync
files = [
    'server.py',
    'admin.html',
    'index.html',
    'js/app.js',
    'js/pages.js',
]

for f in files:
    local = os.path.join(local_dir, f)
    remote = remote_dir + '/' + f
    print(f'Uploading {f}...')
    sftp.put(local, remote)

sftp.close()
print('Files uploaded.')

# Restart service
stdin, stdout, stderr = ssh.exec_command('systemctl restart cnev-guide', timeout=10)
stdout.read()
time.sleep(2)
stdin, stdout, stderr = ssh.exec_command('systemctl is-active cnev-guide', timeout=5)
status = stdout.read().decode().strip()
print(f'Service: {status}')

# Quick test
stdin, stdout, stderr = ssh.exec_command('curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:8090/', timeout=10)
code = stdout.read().decode().strip()
print(f'HTTP: {code}')

# Test messages API
stdin, stdout, stderr = ssh.exec_command('curl -s -o /dev/null -w "%{http_code}" "http://127.0.0.1:8090/api/message-token?email=test@example.com"', timeout=10)
code = stdout.read().decode().strip()
print(f'Message token API: {code}')

ssh.close()
print('Deploy done!')
