const http = require('http');

http.get('http://localhost:3001/api/profissional/unidades/convites', (res) => {
  console.log('Status:', res.statusCode);
  res.on('data', (d) => process.stdout.write(d));
}).on('error', (e) => {
  console.error(e);
});
