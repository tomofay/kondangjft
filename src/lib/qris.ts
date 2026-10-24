/**
 * QRIS ASPI MPM (Merchant Presented Mode) Dynamic QR Generator
 * Generates valid EMVCo / ASPI compliant QRIS strings with CRC16-CCITT checksum.
 */

export function crc16(str: string): string {
  let crc = 0xffff;
  for (let i = 0; i < str.length; i++) {
    crc ^= str.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      if ((crc & 0x8000) !== 0) {
        crc = ((crc << 1) ^ 0x1021) & 0xffff;
      } else {
        crc = (crc << 1) & 0xffff;
      }
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, '0');
}

export function tlv(tag: string, value: string): string {
  const len = value.length.toString().padStart(2, '0');
  return `${tag}${len}${value}`;
}

export function generateDynamicQris(
  amount: number,
  invoiceNumber: string,
  merchantName = 'KONDANG SENSEI'
): string {
  // Merchant Account Info (DOKU MPM)
  const dokuMerchantInfo =
    tlv('00', 'ID.DOKU.WWW') +
    tlv('01', '936000000000000000') +
    tlv('02', '10000000') +
    tlv('03', 'UMI');
  const merchantAccountInfo = tlv('26', dokuMerchantInfo);

  // Additional Data (Invoice Number)
  const addData = tlv('01', invoiceNumber.substring(0, 25));
  const additionalDataField = tlv('62', addData);

  const payloadWithoutCrc = [
    tlv('00', '01'), // Payload Format Indicator
    tlv('01', '12'), // Point of Initiation Method: 12 = Dynamic QR
    merchantAccountInfo,
    tlv('52', '5411'), // Merchant Category Code
    tlv('53', '360'), // Currency: IDR (360)
    tlv('54', String(Math.round(amount))), // Transaction Amount
    tlv('58', 'ID'), // Country Code
    tlv('59', merchantName.substring(0, 25).toUpperCase()), // Merchant Name
    tlv('60', 'JAKARTA'), // Merchant City
    tlv('61', '10110'), // Postal Code
    additionalDataField,
    '6304' // CRC placeholder
  ].join('');

  const checksum = crc16(payloadWithoutCrc);
  return `${payloadWithoutCrc}${checksum}`;
}
