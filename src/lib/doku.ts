import crypto from 'crypto';

export interface DokuCheckoutRequest {
  order: {
    invoice_number: string;
    amount: number;
    callback_url?: string;
    callback_url_cancel?: string;
    auto_redirect?: boolean;
  };
  payment: {
    payment_due_date: number; // in minutes
  };
  customer: {
    id: string;
    name: string;
    email: string;
  };
}

/**
 * Generate DOKU HMAC-SHA256 Signature for API Checkout v1
 * Component:
 * Client-Id + Request-Id + Request-Timestamp + Request-Target + Digest(JSON Body)
 */
export function generateDokuSignature(
  clientId: string,
  requestId: string,
  requestTimestamp: string,
  requestTarget: string,
  rawBody: string,
  secretKey: string
): string {
  // 1. Calculate Digest: Base64(SHA256(rawBody))
  const digest = crypto.createHash('sha256').update(rawBody, 'utf8').digest('base64');

  // 2. Prepare component string
  const signatureComponent = [
    `Client-Id:${clientId}`,
    `Request-Id:${requestId}`,
    `Request-Timestamp:${requestTimestamp}`,
    `Request-Target:${requestTarget}`,
    `Digest:${digest}`
  ].join('\n');

  // 3. HMAC-SHA256 with Secret Key
  const hmac = crypto.createHmac('sha256', secretKey).update(signatureComponent).digest('base64');

  return `HMACSHA256=${hmac}`;
}

/**
 * Verify Webhook Signature received from DOKU
 */
export function verifyDokuWebhookSignature(
  clientId: string,
  requestId: string,
  requestTimestamp: string,
  requestTarget: string,
  rawBody: string,
  secretKey: string,
  receivedSignature: string
): boolean {
  const calculated = generateDokuSignature(
    clientId,
    requestId,
    requestTimestamp,
    requestTarget,
    rawBody,
    secretKey
  );
  return calculated === receivedSignature;
}

export function getDokuBaseUrl(): string {
  const isProd = process.env.DOKU_IS_PRODUCTION === 'true';
  return isProd ? 'https://api.doku.com' : 'https://api-sandbox.doku.com';
}
