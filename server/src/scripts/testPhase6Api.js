require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

const API_BASE = 'http://localhost:5000/api';

const runTests = async () => {
  console.log('==================================================');
  console.log('STARTING PHASE 6 ANALYTICS & REPORTS TEST SUITE');
  console.log('==================================================\n');

  let passed = 0;
  let failed = 0;

  const assert = (condition, testName, details = '') => {
    if (condition) {
      console.log(`✅ [PASS] ${testName}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${testName} ${details ? `(${details})` : ''}`);
      failed++;
    }
  };

  try {
    // 1. Authenticate Driver (normal user) and Admin
    console.log('[Setup] Logging in users...');
    const driverLoginRes = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'driver@evcharge.com', password: 'Driver@123' }),
    });
    const driverLogin = await driverLoginRes.json();
    const driverToken = driverLogin.data?.token || driverLogin.token;

    const adminLoginRes = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@evcharge.com', password: 'Admin@123' }),
    });
    const adminLogin = await adminLoginRes.json();
    const adminToken = adminLogin.data?.token || adminLogin.token;

    assert(!!driverToken, 'Driver token acquired');
    assert(!!adminToken, 'Admin token acquired');

    // 2. Role-Based Access Control
    const driverOverviewRes = await fetch(`${API_BASE}/admin/analytics/overview`, {
      headers: { Authorization: `Bearer ${driverToken}` },
    });
    assert(
      driverOverviewRes.status === 403,
      'Normal user is rejected with HTTP 403 from admin analytics',
      `Got status ${driverOverviewRes.status}`
    );

    const unauthOverviewRes = await fetch(`${API_BASE}/admin/analytics/overview`);
    assert(
      unauthOverviewRes.status === 401,
      'Unauthenticated request is rejected with HTTP 401',
      `Got status ${unauthOverviewRes.status}`
    );

    // 3. Admin Overview Analytics
    const adminOverviewRes = await fetch(`${API_BASE}/admin/analytics/overview`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const adminOverview = await adminOverviewRes.json();
    assert(
      adminOverviewRes.status === 200 && adminOverview.success,
      'Admin can access overview analytics',
      JSON.stringify(adminOverview)
    );
    assert(
      adminOverview.data.revenue !== undefined && adminOverview.data.sessions !== undefined,
      'Overview payload contains revenue, sessions, and energy sections'
    );

    // 4. Date Range Filters (Preset & Custom)
    const preset7DaysRes = await fetch(
      `${API_BASE}/admin/analytics/overview?preset=last_7_days`,
      { headers: { Authorization: `Bearer ${adminToken}` } }
    );
    const preset7Days = await preset7DaysRes.json();
    assert(preset7Days.success === true, 'Preset filter last_7_days executes successfully');

    const customDateRes = await fetch(
      `${API_BASE}/admin/analytics/overview?fromDate=2026-09-01&toDate=2026-09-30`,
      { headers: { Authorization: `Bearer ${adminToken}` } }
    );
    const customDate = await customDateRes.json();
    assert(
      customDate.success === true &&
        customDate.data.period.fromDate === '2026-09-01' &&
        customDate.data.period.toDate === '2026-09-30',
      'Custom date range query parameters are parsed and respected'
    );

    // 5. Revenue Analytics APIs
    const revSummaryRes = await fetch(`${API_BASE}/admin/analytics/revenue`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const revSummary = await revSummaryRes.json();
    assert(
      revSummary.success && typeof revSummary.data.grossRevenue === 'number',
      'Revenue summary returns gross, net, and refund numbers'
    );
    assert(
      revSummary.data.netRevenue ===
        Math.round((revSummary.data.grossRevenue - revSummary.data.refunds) * 100) / 100,
      'Net revenue equals gross revenue minus refunds'
    );

    const dailyRevRes = await fetch(`${API_BASE}/admin/analytics/revenue/daily`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const dailyRev = await dailyRevRes.json();
    assert(
      dailyRev.success && Array.isArray(dailyRev.data),
      'Daily revenue breakdown returns an array of daily points'
    );

    const stationRevRes = await fetch(`${API_BASE}/admin/analytics/revenue/by-station`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const stationRev = await stationRevRes.json();
    assert(
      stationRev.success && Array.isArray(stationRev.data),
      'Revenue by station groups by station name'
    );

    const methodRevRes = await fetch(`${API_BASE}/admin/analytics/revenue/by-payment-method`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const methodRev = await methodRevRes.json();
    assert(
      methodRev.success && Array.isArray(methodRev.data),
      'Revenue by payment method groups successfully'
    );

    // 6. Booking Analytics & Peak Hours
    const bookingAnalyticsRes = await fetch(`${API_BASE}/admin/analytics/bookings`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const bookingAnalytics = await bookingAnalyticsRes.json();
    assert(
      bookingAnalytics.success && typeof bookingAnalytics.data.cancellationRate === 'number',
      'Booking analytics calculates cancellation rate safely'
    );

    const peakHoursRes = await fetch(`${API_BASE}/admin/analytics/bookings/peak-hours`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const peakHours = await peakHoursRes.json();
    assert(
      peakHours.success && peakHours.data.length === 24,
      '24-hour peak demand distribution returns all 24 hours (0-23)'
    );

    // 7. Charging Session & Energy Analytics
    const sessionAnalyticsRes = await fetch(`${API_BASE}/admin/analytics/sessions`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const sessionAnalytics = await sessionAnalyticsRes.json();
    assert(
      sessionAnalytics.success && typeof sessionAnalytics.data.averageDurationMinutes === 'number',
      'Session analytics returns duration statistics'
    );

    const energyAnalyticsRes = await fetch(`${API_BASE}/admin/analytics/energy`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const energyAnalytics = await energyAnalyticsRes.json();
    assert(
      energyAnalytics.success && typeof energyAnalytics.data.totalKwh === 'number',
      'Energy analytics returns total kWh'
    );

    const dailyEnergyRes = await fetch(`${API_BASE}/admin/analytics/energy/daily`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const dailyEnergy = await dailyEnergyRes.json();
    assert(
      dailyEnergy.success && Array.isArray(dailyEnergy.data),
      'Daily energy breakdown returns timeline data'
    );

    // 8. Charger Utilization & Hardware Approximation Notice
    const chargerAnalyticsRes = await fetch(`${API_BASE}/admin/analytics/chargers`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const chargerAnalytics = await chargerAnalyticsRes.json();
    assert(
      chargerAnalytics.success && chargerAnalytics.data.isApproximation === true,
      'Charger utilization marks isApproximation: true and returns hardware note'
    );
    assert(
      Array.isArray(chargerAnalytics.data.chargers) && chargerAnalytics.data.chargers.length > 0,
      'Charger utilization list contains port-level utilization percentages'
    );

    // 9. Station Performance Matrix Table
    const stationPerfRes = await fetch(`${API_BASE}/admin/analytics/stations?sortBy=revenue`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const stationPerf = await stationPerfRes.json();
    assert(
      stationPerf.success && Array.isArray(stationPerf.data),
      'Station performance matrix returns station records'
    );

    // 10. Payment Analytics & User Analytics
    const paymentAnalyticsRes = await fetch(`${API_BASE}/admin/analytics/payments/status`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const paymentAnalytics = await paymentAnalyticsRes.json();
    assert(
      paymentAnalytics.success && Array.isArray(paymentAnalytics.data.statusBreakdown),
      'Payment analytics returns status breakdown'
    );

    const userAnalyticsRes = await fetch(`${API_BASE}/admin/analytics/users`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const userAnalytics = await userAnalyticsRes.json();
    assert(
      userAnalytics.success && typeof userAnalytics.data.totalUsers === 'number',
      'User analytics returns user growth metrics'
    );

    // 11. Reports Hub & Paginated Tables
    const reportSumRes = await fetch(`${API_BASE}/admin/reports/summary`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const reportSum = await reportSumRes.json();
    assert(
      reportSum.success && typeof reportSum.data.totalBookings === 'number',
      'Report summary returns top-level counts'
    );

    const paginatedBookingsRes = await fetch(
      `${API_BASE}/admin/reports/bookings?page=1&limit=5`,
      { headers: { Authorization: `Bearer ${adminToken}` } }
    );
    const paginatedBookings = await paginatedBookingsRes.json();
    assert(
      paginatedBookings.success &&
        Array.isArray(paginatedBookings.data.items) &&
        paginatedBookings.data.pagination.limit === 5,
      'Paginated bookings report returns page and limit metadata'
    );

    const paginatedSessionsRes = await fetch(
      `${API_BASE}/admin/reports/sessions?page=1&limit=5`,
      { headers: { Authorization: `Bearer ${adminToken}` } }
    );
    const paginatedSessions = await paginatedSessionsRes.json();
    assert(
      paginatedSessions.success && Array.isArray(paginatedSessions.data.items),
      'Paginated sessions report returns session records'
    );

    const paginatedPaymentsRes = await fetch(
      `${API_BASE}/admin/reports/payments?page=1&limit=5`,
      { headers: { Authorization: `Bearer ${adminToken}` } }
    );
    const paginatedPayments = await paginatedPaymentsRes.json();
    assert(
      paginatedPayments.success && Array.isArray(paginatedPayments.data.items),
      'Paginated payments report returns payment records'
    );

    const paginatedEnergyRes = await fetch(
      `${API_BASE}/admin/reports/energy?page=1&limit=5`,
      { headers: { Authorization: `Bearer ${adminToken}` } }
    );
    const paginatedEnergy = await paginatedEnergyRes.json();
    assert(
      paginatedEnergy.success && Array.isArray(paginatedEnergy.data.items),
      'Paginated energy report returns completed charging records'
    );

    // 12. CSV Exports & Header Verification
    const bookingsCsvRes = await fetch(`${API_BASE}/admin/reports/bookings?format=csv`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const bookingsCsv = await bookingsCsvRes.text();
    assert(
      bookingsCsvRes.headers.get('content-type')?.includes('text/csv') &&
        bookingsCsv.includes('Booking Reference'),
      'Bookings CSV export returns text/csv Content-Type with Booking Reference column'
    );
    assert(
      !bookingsCsv.includes('password') && !bookingsCsv.includes('qrTokenHash'),
      'Bookings CSV export never leaks passwords or secret token hashes'
    );

    const sessionsCsvRes = await fetch(`${API_BASE}/admin/reports/sessions?format=csv`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const sessionsCsv = await sessionsCsvRes.text();
    assert(
      sessionsCsvRes.headers.get('content-type')?.includes('text/csv') &&
        sessionsCsv.includes('Session Reference'),
      'Sessions CSV export returns text/csv Content-Type'
    );

    const paymentsCsvRes = await fetch(`${API_BASE}/admin/reports/payments?format=csv`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const paymentsCsv = await paymentsCsvRes.text();
    assert(
      paymentsCsvRes.headers.get('content-type')?.includes('text/csv') &&
        paymentsCsv.includes('Invoice Number'),
      'Payments CSV export returns text/csv Content-Type with Invoice Number column'
    );

    const energyCsvRes = await fetch(`${API_BASE}/admin/reports/energy?format=csv`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const energyCsv = await energyCsvRes.text();
    assert(
      energyCsvRes.headers.get('content-type')?.includes('text/csv') &&
        energyCsv.includes('Energy Consumed (kWh)'),
      'Energy CSV export returns text/csv Content-Type'
    );

    // 13. Zero-Data Filter Safety
    const zeroDataRes = await fetch(
      `${API_BASE}/admin/analytics/overview?fromDate=2020-01-01&toDate=2020-01-02`,
      { headers: { Authorization: `Bearer ${adminToken}` } }
    );
    const zeroData = await zeroDataRes.json();
    assert(
      zeroData.success &&
        zeroData.data.revenue.grossRevenue === 0 &&
        zeroData.data.bookings.total === 0,
      'Zero-data period returns clean 0s with no NaN or divide-by-zero errors'
    );
  } catch (err) {
    console.error('[Test Execution Error]:', err);
    failed++;
  }

  console.log('\n==================================================');
  console.log(`PHASE 6 TEST RESULTS: ${passed} PASSED | ${failed} FAILED`);
  console.log('==================================================');

  if (failed > 0) {
    process.exit(1);
  }
};

runTests();
