const API_BASE = 'http://localhost:5000/api';

async function request(url, options = {}) {
  try {
    const res = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      },
    });
    const json = await res.json().catch(() => ({}));
    return { status: res.status, ok: res.ok, json };
  } catch (err) {
    console.error(`Fetch error for ${url}:`, err.message);
    return { status: 500, ok: false, json: {} };
  }
}

async function runPhase7Tests() {
  console.log('==================================================');
  console.log('🚀 RUNNING PHASE 7 COMPREHENSIVE AUTOMATED TESTS');
  console.log('==================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, message, debugInfo = null) {
    if (condition) {
      console.log(`  ✅ PASS: ${message}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${message}`, debugInfo ? JSON.stringify(debugInfo) : '');
      failed++;
    }
  }

  try {
    // 1. Authenticate Admin and Driver
    console.log('1. Authenticating test users...');
    const adminRes = await request(`${API_BASE}/auth/login`, {
      method: 'POST',
      body: JSON.stringify({ email: 'admin@evcharge.com', password: 'Admin@123' }),
    });
    const adminToken = adminRes.json?.data?.token;
    const adminHeaders = { Authorization: `Bearer ${adminToken}` };
    assert(!!adminToken, 'Admin login succeeded and token generated', adminRes.json);

    const userRes = await request(`${API_BASE}/auth/login`, {
      method: 'POST',
      body: JSON.stringify({ email: 'driver@evcharge.com', password: 'Driver@123' }),
    });
    const userToken = userRes.json?.data?.token;
    const userHeaders = { Authorization: `Bearer ${userToken}` };
    assert(!!userToken, 'User login succeeded and token generated', userRes.json);

    // 2. Health & System Status
    console.log('\n2. Testing Health & Server Hardening...');
    const healthRes = await request('http://localhost:5000/health');
    assert(healthRes.json?.status === 'healthy', 'Server health check returns healthy status', healthRes.json);
    assert(healthRes.json?.featureFlags !== undefined, 'Feature flags exported in health check', healthRes.json);

    // 3. Nearby Stations & Distance Calculations
    console.log('\n3. Testing Map Nearby Stations API...');
    const nearbyRes = await request(`${API_BASE}/stations/nearby?latitude=16.5062&longitude=80.6480&radiusKm=50`);
    assert(nearbyRes.json?.success === true, 'Nearby stations query succeeded', nearbyRes.json);
    const nearbyStations = nearbyRes.json?.data?.stations || nearbyRes.json?.data || [];
    assert(Array.isArray(nearbyStations), 'Returns array of nearby stations');
    if (nearbyStations.length > 0) {
      assert(nearbyStations[0].distanceKm !== undefined, 'Station includes calculated distance in km');
    }

    // 4. Smart Recommendations API
    console.log('\n4. Testing Smart Recommendation Engine...');
    const recRes = await request(`${API_BASE}/recommendations/stations?latitude=16.5062&longitude=80.6480`, {
      headers: userHeaders,
    });
    assert(recRes.json?.success === true, 'Smart recommendation query succeeded', recRes.json);
    const recList = recRes.json?.data?.recommendations || recRes.json?.data || [];
    assert(Array.isArray(recList), 'Returns ranked recommendations array');
    if (recList.length > 0) {
      const firstRec = recList[0];
      assert(firstRec.recommendationScore !== undefined && firstRec.reasons !== undefined, 'Recommendation includes score and explainable reasons');
    }

    // 5. Demand Prediction Forecast
    console.log('\n5. Testing AI Demand Prediction Engine...');
    const allStationsRes = await request(`${API_BASE}/stations`);
    const stations = allStationsRes.json?.data?.stations || allStationsRes.json?.data || [];
    const sampleStation = stations[0];

    if (sampleStation) {
      const demandRes = await request(`${API_BASE}/stations/${sampleStation._id}/demand`);
      assert(demandRes.json?.success === true, 'Station demand forecast succeeded', demandRes.json);
      assert(demandRes.json?.data?.hourlyForecast?.length === 24, 'Forecast contains 24 hourly bins (0-23h)');
      assert(demandRes.json?.data?.isEstimate === true, 'Demand prediction is clearly marked as isEstimate');
    }

    // 6. In-App Notifications API
    console.log('\n6. Testing Notification Center & Read State...');
    const notifRes = await request(`${API_BASE}/notifications`, { headers: userHeaders });
    assert(notifRes.json?.success === true, 'Fetched user notifications', notifRes.json);
    const unreadCountRes = await request(`${API_BASE}/notifications/unread-count`, { headers: userHeaders });
    assert(unreadCountRes.json?.data?.unreadCount !== undefined, 'Unread notification count retrieved', unreadCountRes.json);

    if (notifRes.json?.data?.length > 0) {
      const firstNotifId = notifRes.json.data[0]._id;
      const readRes = await request(`${API_BASE}/notifications/${firstNotifId}/read`, {
        method: 'PATCH',
        headers: userHeaders,
      });
      assert(readRes.json?.success === true, 'Marked single notification as read', readRes.json);
    }

    // 7. Dynamic Pricing Engine
    console.log('\n7. Testing Dynamic Pricing Rules & Tariff Resolution...');
    if (sampleStation) {
      const activePricingRes = await request(`${API_BASE}/pricing/active?stationId=${sampleStation._id}`);
      assert(activePricingRes.json?.success === true, 'Active dynamic pricing rules query succeeded', activePricingRes.json);
    }

    const adminPricingRes = await request(`${API_BASE}/admin/pricing`, { headers: adminHeaders });
    assert(adminPricingRes.json?.success === true, 'Admin pricing rules list retrieved', adminPricingRes.json);

    // 8. Reviews & Ratings Moderation
    console.log('\n8. Testing Reviews & Admin Moderation...');
    const adminReviewsRes = await request(`${API_BASE}/admin/reviews`, { headers: adminHeaders });
    assert(adminReviewsRes.json?.success === true, 'Admin reviews list retrieved', adminReviewsRes.json);
    if (adminReviewsRes.json?.data?.length > 0) {
      const rev = adminReviewsRes.json.data[0];
      const modRes = await request(`${API_BASE}/admin/reviews/${rev._id}/status`, {
        method: 'PATCH',
        headers: adminHeaders,
        body: JSON.stringify({ status: 'published' }),
      });
      assert(modRes.json?.success === true, 'Review moderation status updated to published', modRes.json);
    }

    // 9. Fleet Management Operations
    console.log('\n9. Testing Corporate Fleet Operations...');
    const fleetOrgRes = await request(`${API_BASE}/fleet/my-org`, { headers: userHeaders });
    assert(fleetOrgRes.json?.success === true, 'Fleet organization query executed', fleetOrgRes.json);

    // 10. OCPP 1.6-J Hardware Simulator
    console.log('\n10. Testing OCPP Protocol Simulator...');
    const ocppStatusRes = await request(`${API_BASE}/ocpp/status`, { headers: adminHeaders });
    assert(ocppStatusRes.json?.success === true, 'OCPP subsystem status query succeeded', ocppStatusRes.json);

    if (sampleStation && sampleStation.chargers?.length > 0) {
      const chargerId = sampleStation.chargers[0]._id || sampleStation.chargers[0];
      const bootRes = await request(`${API_BASE}/ocpp/chargers/${chargerId}/boot-notification`, {
        method: 'POST',
        headers: adminHeaders,
        body: JSON.stringify({
          chargePointVendor: 'TestVendor',
          chargePointModel: 'Fast-150',
        }),
      });
      assert(bootRes.json?.data?.status === 'Accepted', 'OCPP BootNotification accepted', bootRes.json);

      const hbRes = await request(`${API_BASE}/ocpp/chargers/${chargerId}/heartbeat`, {
        method: 'POST',
        headers: adminHeaders,
      });
      assert(hbRes.json?.data?.currentTime !== undefined, 'OCPP Heartbeat response timestamp returned', hbRes.json);
    }

    // 11. Smart Load Management Grid
    console.log('\n11. Testing Smart Load Management Grid Simulation...');
    if (sampleStation) {
      const loadRes = await request(`${API_BASE}/stations/${sampleStation._id}/load`);
      assert(loadRes.json?.success === true, 'Station electrical load query succeeded', loadRes.json);
      assert(loadRes.json?.data?.maxSitePowerKw !== undefined, 'Station returns max site power capacity', loadRes.json);
    }

    console.log('\n==================================================');
    console.log(`📊 TEST SUITE SUMMARY: ${passed} PASSED, ${failed} FAILED`);
    console.log('==================================================\n');

    if (failed > 0) {
      process.exit(1);
    } else {
      console.log('🎉 ALL PHASE 7 AUTOMATED TESTS PASSED!');
      process.exit(0);
    }
  } catch (err) {
    console.error('❌ Test execution error:', err.message);
    process.exit(1);
  }
}

runPhase7Tests();
