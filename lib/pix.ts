type PixConfig = { key: string; name: string; city: string };
const tlv = (id: string, value: string) => `${id}${String(Buffer.byteLength(value)).padStart(2, '0')}${value}`;
const clean = (text: string, max: number) => text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase().replace(/[^A-Z0-9 ]/g, '').slice(0, max).trim();

export function pixConfig(): PixConfig | null {
  const key = process.env.PIX_KEY?.trim();
  const name = clean(process.env.PIX_MERCHANT_NAME ?? '', 25);
  const city = clean(process.env.PIX_MERCHANT_CITY ?? '', 15);
  if (!key || Buffer.byteLength(key) > 77 || !name || !city) return null;
  return { key, name, city };
}

export function pixPayload(config: PixConfig, cents: number, reference: string) {
  if (!Number.isSafeInteger(cents) || cents <= 0 || cents > 999999999) throw new Error('Valor inválido.');
  const txid = reference.replace(/[^a-zA-Z0-9]/g, '').slice(0, 25);
  const payload = tlv('00', '01') + tlv('26', tlv('00', 'br.gov.bcb.pix') + tlv('01', config.key)) +
    tlv('52', '0000') + tlv('53', '986') + tlv('54', (cents / 100).toFixed(2)) + tlv('58', 'BR') +
    tlv('59', clean(config.name, 25)) + tlv('60', clean(config.city, 15)) + tlv('62', tlv('05', txid)) + '6304';
  let crc = 0xffff;
  for (const byte of Buffer.from(payload)) {
    crc ^= byte << 8;
    for (let bit = 0; bit < 8; bit++) crc = ((crc << 1) ^ ((crc & 0x8000) ? 0x1021 : 0)) & 0xffff;
  }
  return payload + crc.toString(16).toUpperCase().padStart(4, '0');
}
