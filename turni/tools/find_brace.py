import re
path = r"c:\Users\picking-beo\Desktop\turni enterprise\script.js"
with open(path, 'r', encoding='utf-8') as f:
    lines = f.read().splitlines()

cum = 0
for i, line in enumerate(lines):
    opens = line.count('{')
    closes = line.count('}')
    cum += opens - closes
    if cum < 0:
        print(f"IMBALANCE at line {i+1}: cum={cum}")
        print(line)
        break
print('FINAL_CUM=', cum)
