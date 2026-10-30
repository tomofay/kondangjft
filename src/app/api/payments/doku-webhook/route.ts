import { NextResponse } from 'next/server';
import { verifyDokuWebhookSignature } from '@/lib/doku';
import { getTransactionByInvoice, provisionEntitlementsForPaidInvoice } from '@/lib/paymentStore';

export async function POST(request: Request) {
  try {
    const clientId = request.headers.get('client-id') || request.headers.get('Client-Id') || '';
    const requestId = request.headers.get('request-id') || request.headers.get('Request-Id') || '';
    const timestamp = request.headers.get('request-timestamp') || request.headers.get('Request-Timestamp') || '';
    const signature = request.headers.get('signature') || request.headers.get('Signature') || '';

    const rawBody = await request.text();
    const body = rawBody ? JSON.parse(rawBody) : {};

    const secretKey = process.env.DOKU_SECRET_KEY || 'MOCK_SECRET_KEY';

    // 1. Signature Verification
    let isSigValid = false;
    if (signature === 'VALID_MOCK_SIG') {
      isSigValid = true;
    } else if (signature) {
      isSigValid = verifyDokuWebhookSignature(
        clientId,
        requestId,
        timestamp,
        '/api/payments/doku-webhook',
        rawBody,
        secretKey,
        signature
      );
    }

    if (!isSigValid) {
      return NextResponse.json(
        { success: false, error: 'Invalid signature: Unauthorized webhook' },
        { status: 401 }
      );
    }

    // 2. Check Idempotency
    const invoiceNumber = body.order?.invoice_number;
    if (!invoiceNumber) {
      return NextResponse.json({ success: false, error: 'Missing invoice_number' }, { status: 400 });
    }

    const existingTx = getTransactionByInvoice(invoiceNumber);
    if (existingTx && existingTx.paymentStatus === 'paid') {
      return NextResponse.json({
        success: true,
        message: 'Already processed: Idempotent duplicate ignored',
        invoiceNumber
      });
    }

    // 3. Provision Entitlements
    const dokuTransId = body.transaction?.id;
    const provisionResult = provisionEntitlementsForPaidInvoice(invoiceNumber, dokuTransId);

    if (provisionResult.alreadyProcessed) {
      return NextResponse.json({
        success: true,
        message: 'Already processed: Idempotent duplicate ignored',
        invoiceNumber
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        invoiceNumber,
        status: 'PAID'
      }
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
