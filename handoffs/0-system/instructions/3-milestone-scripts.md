# Milestone Reorganization Functions

These one-liner functions create a new milestone folder within handoffs/ and move all numbered handoff files into it.

## Bash
```bash
next_num=$(find handoffs/ -maxdepth 1 -type d -name "[0-9]*-*" 2>/dev/null | wc -l | xargs test "0" -eq && echo "1" || find handoffs/ -maxdepth 1 -type d -name "[0-9]*-*" | sort -V | tail -n1 | sed -E 's/.*\/([0-9]+).*/\1/' | awk '{print $1+1}'); mkdir -p "handoffs/${next_num}-milestone-name"; find handoffs/ -maxdepth 1 -type f -name "[1-9]*.md" -exec mv {} "handoffs/${next_num}-milestone-name/" \;
```

## PowerShell
```powershell
$next_num = if (!(Get-ChildItem "handoffs" -Directory | Where {$_.Name -match "^\d+-"})) {1} else {(Get-ChildItem "handoffs" -Directory | Where {$_.Name -match "^\d+-"} | ForEach {[int]($_.Name -split "-")[0]} | Measure -Max).Maximum + 1}; New-Item -Path "handoffs/${next_num}-milestone-name" -ItemType Directory -Force; Get-ChildItem -Path "handoffs" -Filter "[1-9]*.md" | Move-Item -Destination "handoffs/${next_num}-milestone-name/"
```

## Python
```python
import os, re, shutil; next_num = 1 if not [d for d in os.listdir("handoffs") if os.path.isdir(os.path.join("handoffs", d)) and re.match(r"\d+-", d)] else max([int(re.match(r"(\d+)-", d).group(1)) for d in os.listdir("handoffs") if os.path.isdir(os.path.join("handoffs", d)) and re.match(r"\d+-", d)]) + 1; os.makedirs(f"handoffs/{next_num}-milestone-name", exist_ok=True); [shutil.move(os.path.join("handoffs", f), os.path.join(f"handoffs/{next_num}-milestone-name", f)) for f in os.listdir("handoffs") if re.match(r"[1-9]", f) and f.endswith(".md") and os.path.isfile(os.path.join("handoffs", f))]
```

## Node.js
```javascript
const fs = require('fs'), path = require('path'); const dirs = fs.readdirSync('handoffs').filter(d => fs.statSync(path.join('handoffs', d)).isDirectory() && /^\d+-/.test(d)); const next_num = dirs.length === 0 ? 1 : Math.max(...dirs.map(d => parseInt(d.match(/^(\d+)-/)[1]) || 0)) + 1; fs.mkdirSync(path.join('handoffs', `${next_num}-milestone-name`), { recursive: true }); fs.readdirSync('handoffs').filter(f => /^[1-9].*\.md$/.test(f) && fs.statSync(path.join('handoffs', f)).isFile()).forEach(f => fs.renameSync(path.join('handoffs', f), path.join('handoffs', `${next_num}-milestone-name`, f)));
```

Replace "milestone-name" with the actual milestone name before executing.