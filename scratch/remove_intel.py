path = 'frontend/src/components/AdminMaterialDashboard.jsx'
with open(path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

new_lines = []
skip = False
for line in lines:
    if 'onClick={onOpenIntel}' in line:
        # We need to remove the enclosing <li>...</li>
        # Pop the previous lines belonging to this <li>
        while new_lines and not new_lines[-1].strip().startswith('<li>'):
            new_lines.pop()
        if new_lines and new_lines[-1].strip().startswith('<li>'):
            new_lines.pop()
        skip = True
        continue
    if skip:
        if line.strip() == '</li>':
            skip = False
        continue
    new_lines.append(line)

with open(path, 'w', encoding='utf-8') as f:
    f.writelines(new_lines)

print("SUCCESS: Removed Model Intelligence button from AdminMaterialDashboard.jsx")
