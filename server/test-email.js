import { isEmailConfigured, sendOrderStatusEmail } from './lib/email.js';

async function runTests() {
  console.log('--- Testing Email Service ---');
  console.log('isEmailConfigured():', isEmailConfigured());

  const sampleOrder = {
    orderNumber: 'JMT-TST10-9876',
    fullName: 'Chandan Varshney',
    phone: '9528158690',
    email: 'chandanv1134@gmail.com',
    dropCity: 'Jammu',
    dropState: 'Jammu & Kashmir',
    dropAddress: 'Bari Brahmana Industrial Area, Phase II',
    dropPin: '181133',
    arrivedByDate: '2026-12-05',
    vehicleType: '12-Wheel Heavy Cargo Truck (RJ-19-GA-1234)',
    dispatchLocation: 'Makrana RIICO Industrial Area Yard #4',
    stones: [
      {
        stoneName: 'Makrana Pure White Marble',
        slabSize: '8 x 4 ft',
        slabCount: '150',
        quantityTonnes: '18',
      },
      {
        stoneName: 'Makrana Albeta Marble',
        slabSize: '7 x 3.5 ft',
        slabCount: '100',
        quantityTonnes: '12',
      },
    ],
  };

  const statusesToTest = ['placed', 'confirmed', 'shipped', 'delivered'];

  for (const status of statusesToTest) {
    console.log(`\nTesting status: "${status}"...`);
    const res = await sendOrderStatusEmail(sampleOrder, status, 'Driver: Mukesh (+91 94140 12345) en route via NH-52');
    console.log(`Result for ${status}:`, res);
    if (!res.success) {
      throw new Error(`Failed test for status ${status}: ${res.error || res.reason}`);
    }
  }

  // Test invalid email handling
  console.log('\nTesting invalid order (no email)...');
  const invalidRes = await sendOrderStatusEmail({ orderNumber: 'BAD-01' }, 'confirmed');
  console.log('Result for bad order:', invalidRes);
  if (invalidRes.success !== false) {
    throw new Error('Expected failure for order without email');
  }

  console.log('\nAll email tests PASSED successfully!');
}

runTests().catch((err) => {
  console.error('Test run failed:', err);
  process.exit(1);
});
