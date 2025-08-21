// tests/k6/scenarios/protect/ramp.js
import http from 'k6/http';
import { check, sleep } from 'k6';
import { FormData } from 'https://jslib.k6.io/formdata/0.0.2/index.js';
import { BASE_URL, THRESHOLDS, testPDFs } from '../../config.js';

export let options = {
  scenarios: {
    ramp_load: {
      executor: 'ramping-vus',
      startVUs: 10,
      stages: [
        { duration: '2m', target: 30 },
        { duration: '2m', target: 60 },
        { duration: '3m', target: 100 },
        { duration: '3m', target: 100 },
        { duration: '2m', target: 0 },
      ],
    },
  },
  thresholds: THRESHOLDS,
};

export default function () {
  const fd = new FormData();

  // Elegir un PDF al azar para cada VU
  const pdf = testPDFs[__VU % testPDFs.length];
  fd.append('pdf', http.file(pdf, `protect-ramp-${__VU}-${__ITER}.pdf`, 'application/pdf'));
  fd.append('password', 'test123password');

  const res = http.post(`${BASE_URL}/api/pdf-handler/secure/block/`, fd.body(), {
    headers: { 'Content-Type': 'multipart/form-data; boundary=' + fd.boundary },
    timeout: '30s',
  });

  check(res, {
    'status is 2xx or 3xx': (r) => r.status >= 200 && r.status < 400,
    'response time < 2s': (r) => r.timings.duration < 2000,
    'has response body': (r) => r.body && r.body.length > 0,
    'content-disposition header includes protected.pdf': (r) => 
      r.headers['Content-Disposition'] && r.headers['Content-Disposition'].includes('protected.pdf'),
  });

  sleep(1);
}
