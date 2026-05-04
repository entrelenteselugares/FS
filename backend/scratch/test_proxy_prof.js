const http = require('http');

http.get('http://localhost:5173/api/profissional/unidades/convites', (res) => {
  console.log('Status via Proxy:', res.statusCode);
  res.on('data', (d) => process.stdout.write(d));
}).on('error', (e) => {
  console.error(e);
});
