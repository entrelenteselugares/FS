const axios = require('axios');
axios.get('http://localhost:3001/api/public/events/cmo2wjix40001z0vz6elu439d')
  .then(r => console.log(JSON.stringify(r.data, null, 2)))
  .catch(e => console.error(e.message));
