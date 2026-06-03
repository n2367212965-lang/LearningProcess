const fs = require('fs')
const path = require('path')

const icons = [
  { name: 'bill', color: '#9ca3af' },
  { name: 'bill_active', color: '#f59e0b' },
  { name: 'add', color: '#9ca3af' },
  { name: 'add_active', color: '#f59e0b' },
  { name: 'stats', color: '#9ca3af' },
  { name: 'stats_active', color: '#f59e0b' },
  { name: 'mine', color: '#9ca3af' },
  { name: 'mine_active', color: '#f59e0b' }
]

const dir = path.join(__dirname, '..', 'images')
if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })

// 44x44 纯色 PNG（最小合法 PNG，仅含 IHDR + IDAT + IEND）
function createMinimalPNG(width, height, hexColor) {
  const r = parseInt(hexColor.slice(1, 3), 16)
  const g = parseInt(hexColor.slice(3, 5), 16)
  const b = parseInt(hexColor.slice(5, 7), 16)
  
  // 构造原始像素数据（每行 1 filter byte + 3*width bytes RGB）
  const rawData = []
  for (let y = 0; y < height; y++) {
    rawData.push(0) // filter: none
    for (let x = 0; x < width; x++) {
      rawData.push(r, g, b)
    }
  }
  
  const deflated = Buffer.from(rawData)
  
  // CRC32
  function crc32(buf) {
    let c = 0xffffffff
    const table = new Int32Array(256)
    for (let n = 0; n < 256; n++) {
      let cn = n
      for (let k = 0; k < 8; k++) cn = cn & 1 ? 0xedb88320 ^ (cn >>> 1) : cn >>> 1
      table[n] = cn
    }
    for (let i = 0; i < buf.length; i++) c = table[(c ^ buf[i]) & 0xff] ^ (c >>> 8)
    return (c ^ 0xffffffff) >>> 0
  }
  
  function makeChunk(type, data) {
    const typeBytes = Buffer.from(type, 'ascii')
    const len = Buffer.alloc(4)
    len.writeUInt32BE(data.length, 0)
    const crcData = Buffer.concat([typeBytes, data])
    const crc = Buffer.alloc(4)
    crc.writeUInt32BE(crc32(crcData), 0)
    return Buffer.concat([len, typeBytes, data, crc])
  }
  
  // IHDR
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(width, 0)
  ihdr.writeUInt32BE(height, 4)
  ihdr[8] = 8  // bit depth
  ihdr[9] = 2  // color type: RGB
  ihdr[10] = 0 // compression
  ihdr[11] = 0 // filter
  ihdr[12] = 0 // interlace
  
  // IDAT
  const idatData = Buffer.from(rawData)
  
  // IEND
  const iend = Buffer.alloc(0)
  
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])
  return Buffer.concat([
    signature,
    makeChunk('IHDR', ihdr),
    makeChunk('IDAT', idatData),
    makeChunk('IEND', iend)
  ])
}

icons.forEach(icon => {
  const png = createMinimalPNG(44, 44, icon.color)
  fs.writeFileSync(path.join(dir, icon.name + '.png'), png)
  console.log(`Created images/${icon.name}.png`)
})
