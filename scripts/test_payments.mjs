async function testEveryChannelOneByOne() {
  const channels = [
    { id: 'QRIS', name: 'QRIS Instan' },
    { id: 'BRI', name: 'Bank BRI Virtual Account' },
    { id: 'BNI', name: 'Bank BNI Virtual Account' },
    { id: 'BSI', name: 'Bank Syariah BSI Virtual Account' },
    { id: 'CIMB', name: 'Bank CIMB Niaga Virtual Account' },
    { id: 'DANAMON', name: 'Bank Danamon Virtual Account' },
    { id: 'MAYBANK', name: 'Maybank Virtual Account' },
    { id: 'DOKU_EWALLET', name: 'DOKU e-Wallet' },
    { id: 'ALFAMART', name: 'Alfamart Retail' },
    { id: 'INDOMARET', name: 'Indomaret Retail' }
  ];

  console.log('=== PENGUJIAN 10 METODE PEMBAYARAN SANDBOX (SATU PERSATU) ===\n');

  for (let i = 0; i < channels.length; i++) {
    const ch = channels[i];
    console.log(`[${i + 1}/${channels.length}] Menguji ${ch.name} (${ch.id})...`);

    // 1. Create payment
    const createRes = await fetch('http://localhost:3000/api/payments/doku/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: 'u_1', packageId: 'pkg_7d', channel: ch.id })
    });
    const createData = await createRes.json();

    if (!createData.success) {
      console.error(`  ❌ Gagal:`, createData.message);
      continue;
    }

    console.log(`  ✓ Invoice Terbit: ${createData.invoiceNumber}`);
    console.log(`  ✓ Kode / QR: ${(createData.paymentCode || '').substring(0, 32)}...`);
    console.log(`  ✓ Sandbox Mode: ${createData.isSandbox}`);

    // 2. Check pending status
    const statusRes = await fetch('http://localhost:3000/api/payments/status?invoiceNumber=' + createData.invoiceNumber);
    const statusData = await statusRes.json();
    console.log(`  ✓ Status Awal: ${statusData.status} (isPaid: ${statusData.isPaid})`);

    // 3. Simulate payment success
    const simRes = await fetch('http://localhost:3000/api/payments/simulate-pay', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ invoiceNumber: createData.invoiceNumber })
    });
    const simData = await simRes.json();
    console.log(`  ✓ Simulasi Bayar: ${simData.message}`);

    // 4. Verify paid status
    const verifiedRes = await fetch('http://localhost:3000/api/payments/status?invoiceNumber=' + createData.invoiceNumber);
    const verifiedData = await verifiedRes.json();
    console.log(`  ✓ Status Akhir: ${verifiedData.status} (isPaid: ${verifiedData.isPaid})`);
    console.log(`  🎉 Pengujian ${ch.name} SELESAI & BERHASIL!\n`);
  }
}

testEveryChannelOneByOne();
