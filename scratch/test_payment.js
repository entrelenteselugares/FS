const axios = require('axios');
axios.post('http://localhost:3001/api/checkout/payment', {
  eventId: 'cmo2wjix40001z0vz6elu439d',
  cardToken: 'mock-token-test-' + Date.now(),
  email: 'test@ok.com',
  cpf: '12345678909'
})
.then(r => console.log('Response:', JSON.stringify(r.data, null, 2)))
.catch(e => {
  if (e.response) {
    console.error('Error Status:', e.response.status);
    console.error('Error Details:', JSON.stringify(e.response.data, null, 2));
  } else {
    console.error('Error Message:', e.message);
  }
});
