path = 'frontend/src/components/BatchPrediction.jsx'
with open(path, 'r', encoding='utf-8') as f:
    c = f.read()

c = c.replace(
    '<div className="glass-panel" style={{ padding: \'2rem\' }}>',
    '<div className="mat-card" style={{ padding: \'2.5rem\', background: \'#ffffff\', border: \'1.5px solid #e2e8f0\', borderRadius: \'18px\', boxShadow: \'0 4px 20px rgba(0,0,0,0.04)\' }}>'
)
c = c.replace(
    '<div className="glass-panel table-card">',
    '<div className="table-card">'
)
c = c.replace(
    "background: 'var(--bg-input)', padding: '0.4rem 0.8rem', borderRadius: '8px', border: '1px solid var(--border-subtle)', width: '240px'",
    "background: '#ffffff', padding: '0.45rem 0.85rem', borderRadius: '10px', border: '1.5px solid #cbd5e1', width: '260px'"
)
c = c.replace(
    'color="#fff"',
    'color="#0f172a"'
)
c = c.replace(
    "color: '#fff'",
    "color: '#0f172a'"
)

with open(path, 'w', encoding='utf-8') as f:
    f.write(c)

print("SUCCESS: Updated BatchPrediction.jsx styling")
