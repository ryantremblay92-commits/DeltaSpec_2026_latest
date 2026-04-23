import redis
r = redis.Redis(host='localhost', port=6379, decode_responses=True)
keys = r.keys('delta_*')
print('Delta streams found:', keys)
for k in keys:
    length = r.xlen(k)
    print(f'  {k}: len={length}')
    if length > 0:
        entries = r.xrange(k, count=1)
        print(f'    Latest: {entries[0][1]}')
