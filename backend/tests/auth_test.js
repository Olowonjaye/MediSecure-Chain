const http = require('http');

async function post(path, body) {
  const data = JSON.stringify(body);
  const opts = {
    hostname: 'localhost',
    port: 4000,
    path,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(data),
    },
  };

  return new Promise((resolve, reject) => {
    const req = http.request(opts, (res) => {
      let buf = '';
      res.on('data', (d) => (buf += d));
      res.on('end', () => {
        try {
          const parsed = JSON.parse(buf || '{}');
          resolve({ status: res.statusCode, body: parsed });
        } catch (err) {
          resolve({ status: res.statusCode, body: buf });
        }
      });
    });
    req.on('error', (err) => reject(err));
    req.write(data);
    req.end();
  });
}

(async () => {
  try {
    console.log('Running signup test...');
    const signupResp = await post('/auth/signup', { name: 'Test User', email: 'testuser+ai@local.dev', password: 'P@ssw0rd!', role: 'consultant' });
    console.log('SIGNUP', signupResp);

    console.log('Running login test...');
    const loginResp = await post('/auth/login', { email: 'testuser+ai@local.dev', password: 'P@ssw0rd!' });
    console.log('LOGIN', loginResp);
  } catch (err) {
    console.error('TEST ERROR', err.stack || err);
    process.exit(1);
  }
})();
