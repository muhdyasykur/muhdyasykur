# Prints part N of tools/i18n-todo.json as "index|English" lines (newlines shown as \n), 200 per part.
import json, sys
todo = json.load(open('tools/i18n-todo.json'))
n = int(sys.argv[1]); size = int(sys.argv[2]) if len(sys.argv) > 2 else 200
for i in range(n * size, min(len(todo), (n + 1) * size)):
    print(f"{i}|{todo[i].replace(chr(10), chr(92) + 'n')}")
