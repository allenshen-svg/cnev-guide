import paramiko, time

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('47.83.165.131', username='root', password='Allen1989716!', timeout=10)

def run(cmd, t=20):
    print(f'>>> {cmd}')
    stdin, stdout, stderr = ssh.exec_command(cmd, timeout=t)
    o = stdout.read().decode().strip()
    e = stderr.read().decode().strip()
    if o: print(o)
    if e: print(e)
    print()
    return o

run('cd /opt/cnev-guide && git pull origin main 2>&1', 30)
run('systemctl restart cnev-guide', 10)
time.sleep(2)
run('systemctl is-active cnev-guide', 5)
run('curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:8090/', 10)
run('curl -s http://127.0.0.1:8090/robots.txt', 10)
run('curl -s http://127.0.0.1:8090/sitemap.xml | head -10', 10)

print('Deploy done!')
ssh.close()
