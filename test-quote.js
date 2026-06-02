const fetch = require('node-fetch');

(async () => {
  try {
    const res = await fetch('http://localhost:3000/api/public/quotes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: "Test User",
        email: "test_quote_123@example.com",
        whatsapp: "11999999999",
        attendees: 50,
        locationType: "OTHER",
        usageType: "PESSOAL",
        selectedPartnerId: "",
        customCep: "13010000",
        eventDate: "2026-10-10",
        eventHours: 2,
        eventDays: 1,
        description: "",
        selectedServices: ["foto", "video"],
        totalPrice: 1500,
        preferredProfessionalId: "",
        category: "CASAMENTO"
      })
    });
    const text = await res.text();
    console.log(`Status: ${res.status}`);
    console.log(`Response: ${text}`);
  } catch (err) {
    console.error(err);
  }
})();
