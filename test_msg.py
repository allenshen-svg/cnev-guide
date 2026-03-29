import paramiko
ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('47.83.165.131', username='root', password='Allen1989716!', timeout=10)

def run(cmd, t=10):
    stdin, stdout, stderr = ssh.exec_command(cmd, timeout=t)
    o = stdout.read().decode().strip()
    e = stderr.read().decode().strip()
    print(f'>>> {cmd}')
    if o: print(o)
    if e: print(e)
    print()

# Test token endpoint
run('curl -s "http://127.0.0.1:8090/api/message-token?email=test@example.com"')

# Admin registrations count
run('curl -s http://127.0.0.1:8090/api/admin/registrations -H "X-Admin-Key: bf20663c94d3203ab82fd64677d5bb6a" | python3 -c "import sys,json; d=json.load(sys.stdin); print(len(d[\'data\']),\'registrations\')"')

# Test admin send message (to reg id 1)
run('''curl -s -X POST http://127.0.0.1:8090/api/admin/messages -H "Content-Type: application/json" -H "X-Admin-Key: bf20663c94d3203ab82fd64677d5bb6a" -d '{"registration_id":1,"content":"Welcome! Thanks for registering. We will arrange your test drive soon."}\'''')

# Test admin get messages
run('curl -s http://127.0.0.1:8090/api/admin/messages/1 -H "X-Admin-Key: bf20663c94d3203ab82fd64677d5bb6a"')

# Admin page
run('curl -s -o /dev/null -w "%{http_code}" https://cnevguide.com/admin')

ssh.close()
print('All tests done!')
