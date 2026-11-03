"""Rasterize the existing pixel icon without third-party dependencies."""
from pathlib import Path
import struct
import zlib

ROOT = Path(__file__).resolve().parents[1]
BACKGROUND = (17, 27, 27)
SUN = (214, 232, 183)
CLOUD = (126, 171, 161)

def pixel(x, y, maskable):
    if maskable:
        x, y = (x - 32) / .75 + 32, (y - 32) / .75 + 32
    color = BACKGROUND
    for left, top, width, height in [(26,13,12,4),(17,22,4,12),(43,22,4,12),(26,39,12,4),(24,20,16,16)]:
        if left <= x < left + width and top <= y < top + height:
            color = SUN
    for left, top, width, height in [(17,33,22,14),(39,27,10,20),(49,33,5,14),(12,37,5,10)]:
        if left <= x < left + width and top <= y < top + height:
            color = CLOUD
    return bytes(color)

def chunk(kind, data):
    return struct.pack('>I', len(data)) + kind + data + struct.pack('>I', zlib.crc32(kind + data) & 0xffffffff)

def create(name, size, maskable=False):
    rows = b''.join(b'\x00' + b''.join(pixel((x+.5)*64/size, (y+.5)*64/size, maskable) for x in range(size)) for y in range(size))
    png = b'\x89PNG\r\n\x1a\n' + chunk(b'IHDR', struct.pack('>IIBBBBB', size, size, 8, 2, 0, 0, 0)) + chunk(b'IDAT', zlib.compress(rows)) + chunk(b'IEND', b'')
    (ROOT / 'icons' / name).write_bytes(png)

(ROOT / 'icons').mkdir(exist_ok=True)
create('icon-192.png', 192)
create('icon-512.png', 512)
create('maskable-512.png', 512, True)
create('apple-touch-180.png', 180)
print('Generated four home-screen icons from the existing pixel design.')
