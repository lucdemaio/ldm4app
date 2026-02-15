path = r'c:\Users\picking-beo\Desktop\turni enterprise\script.js'
with open(path, 'r', encoding='utf-8') as f:
    cum = 0
    for i, line in enumerate(f, start=1):
        cum += line.count('{') - line.count('}')
        if cum < 0:
            print('Imbalance at line', i)
            print(line.rstrip())
            break
    else:
        print('No early imbalance; final cum=', cum)
