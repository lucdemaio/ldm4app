import sys
s=open('script.js','r',encoding='utf-8').read().splitlines()
stack=0
for i,line in enumerate(s,1):
    for ch in line:
        if ch=='{':
            stack+=1
        elif ch=='}':
            stack-=1
            if stack<0:
                print('UNMATCHED_CLOSING',i)
                sys.exit(2)
print('BALANCE',stack)