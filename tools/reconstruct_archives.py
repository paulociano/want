from pathlib import Path
import base64, hashlib

ROOT = Path(__file__).resolve().parents[1]
TARGETS = {
    'WANT_Public_v6_8.zip': ('archives/WANT_Public_v6_8.zip.b64', '1ccea89d1202cf471e07c560774b5270bd30fc680068c72706cf5dc6959078e5'),
    'WANT_Internal_v6_8.zip': ('archives/WANT_Internal_v6_8.zip.b64', 'b3565fdcb67b1fb7fa7aa86cc8e83539ff68893dbb79f4fbccf17cd2776f1b86'),
}

for name, (folder, expected) in TARGETS.items():
    parts = sorted((ROOT / folder).glob('part-*.txt'))
    if not parts:
        raise SystemExit(f'No parts found for {name}')
    encoded = ''.join(p.read_text(encoding='ascii').strip() for p in parts)
    data = base64.b64decode(encoded)
    digest = hashlib.sha256(data).hexdigest()
    if digest != expected:
        raise SystemExit(f'Checksum mismatch for {name}: {digest} != {expected}')
    out = ROOT / name
    out.write_bytes(data)
    print(f'Wrote {out} ({len(data)} bytes) sha256={digest}')
