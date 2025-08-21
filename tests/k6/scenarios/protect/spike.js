// tests/k6/scenarios/protect/spike.js
import http from 'k6/http';
import { check, sleep } from 'k6';
import { FormData } from 'https://jslib.k6.io/formdata/0.0.2/index.js';
import { BASE_URL, THRESHOLDS, testPDFs } from '../../config.js';

export let options = {
  scenarios: {
    spike_test: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '15s', target: 20 }, // Spike rápido
        { duration: '2m', target: 20 },  // Mantener carga
        { duration: '15s', target: 0 },   // Bajar rápido
      ],
    },
  },
  thresholds: THRESHOLDS,
};

export default function () {
  const fd = new FormData();

  // Elegir un PDF al azar para cada VU
  const pdf = testPDFs[__VU % testPDFs.length];
  fd.append('pdf', http.file(pdf, `protect-spike-${__VU}-${__ITER}.pdf`, 'application/pdf'));
  fd.append('password', `spike-pass-${__VU}-${__ITER}`);

  const res = http.post(`${BASE_URL}/api/pdf-handler/secure/block/`, fd.body(), {
    headers: { 'Content-Type': 'multipart/form-data; boundary=' + fd.boundary },
    timeout: '30s',
  });

  check(res, {
    'status is 2xx or 3xx': (r) => r.status >= 200 && r.status < 400,
    'response time < 3s': (r) => r.timings.duration < 3000,
    'no server errors': (r) => r.status < 500,
  });

  sleep(0.5);
}
