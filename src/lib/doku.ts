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

/**
 * Generate DOKU HMAC-SHA256 Signature for HTTP GET requests (without Digest)
 */
export function generateDokuGetSignature(
  clientId: string,
  requestId: string,
  requestTimestamp: string,
  requestTarget: string,
  secretKey: string
): string {
  const signatureComponent = [
    `Client-Id:${clientId}`,
    `Request-Id:${requestId}`,
    `Request-Timestamp:${requestTimestamp}`,
    `Request-Target:${requestTarget}`
  ].join('\n');
  const hmac = crypto.createHmac('sha256', secretKey).update(signatureComponent).digest('base64');
  return `HMACSHA256=${hmac}`;
}

/**
 * Query official DOKU order status via Jokul/Checkout API
 */
export async function checkDokuOrderStatus(invoiceNumber: string): Promise<{
  isSuccess: boolean;
  status: string;
  data?: any;
}> {
  try {
    const clientId = process.env.DOKU_CLIENT_ID || 'BRN-0217-1792292490991';
    const secretKey = process.env.DOKU_SECRET_KEY || 'SK-exfHwYOtzTIzZi16bxSz';
    const baseUrl = getDokuBaseUrl();
    const requestTarget = `/orders/v1/status/${invoiceNumber}`;
    const requestId = `REQ-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const requestTimestamp = new Date().toISOString().replace(/\.\d{3}Z$/, 'Z');

    const signature = generateDokuGetSignature(
      clientId,
      requestId,
      requestTimestamp,
      requestTarget,
      secretKey
    );

    const res = await fetch(`${baseUrl}${requestTarget}`, {
      method: 'GET',
      headers: {
        'Client-Id': clientId,
        'Request-Id': requestId,
        'Request-Timestamp': requestTimestamp,
        Signature: signature
      }
    });

    if (!res.ok) {
      return { isSuccess: false, status: 'NOT_FOUND' };
    }

    const json = await res.json();
    const transactionStatus = json?.transaction?.status; // e.g. "SUCCESS"
    const isSuccess = transactionStatus === 'SUCCESS';

    return {
      isSuccess,
      status: transactionStatus || json?.order?.status || 'UNKNOWN',
      data: json
    };
  } catch (error) {
    console.warn('Error checking DOKU order status:', error);
    return { isSuccess: false, status: 'ERROR' };
  }
}
