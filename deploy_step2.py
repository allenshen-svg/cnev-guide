import paramiko, time

host = '47.83.165.131'
user = 'root'
pwd = 'Allen1989716!'

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect(host, username=user, password=pwd, timeout=10)

def run(cmd, t=20):
    print(f'>>> {cmd}')
    stdin, stdout, stderr = ssh.exec_command(cmd, timeout=t)
    o = stdout.read().decode().strip()
    e = stderr.read().decode().strip()
    if o: print(o)
    if e: print(e)
    print()
    return o

run('systemctl enable cnev-guide', 10)
run('systemctl start cnev-guide', 10)
time.sleep(2)
run('systemctl is-active cnev-guide', 5)
run('systemctl reload nginx', 10)
time.sleep(1)
run('curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:8090/', 10)
run('curl -s http://127.0.0.1:8090/ | head -3', 10)

print('Done!')
ssh.close()
