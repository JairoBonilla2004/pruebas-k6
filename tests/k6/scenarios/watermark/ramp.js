// tests/k6/scenarios/watermark/ramp.js
import http from 'k6/http';
import { check, sleep } from 'k6';
import { FormData } from 'https://jslib.k6.io/formdata/0.0.2/index.js';
import { BASE_URL, THRESHOLDS, testPDFs, watermark } from '../../config.js';

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
  fd.append('pdf', http.file(pdf, `ramp-watermark-${__VU}-${__ITER}.pdf`, 'application/pdf'));
  fd.append('watermark', http.file(watermark, `ramp-logo-${__VU}-${__ITER}.jpg`, 'image/jpeg'));
  fd.append('output', `ramp-watermarked-${__VU}-${__ITER}.pdf`);

  const res = http.post(`${BASE_URL}/api/pdf-handler/watermark/`, fd.body(), {
    headers: { 'Content-Type': 'multipart/form-data; boundary=' + fd.boundary },
    timeout: '30s',
  });

  check(res, {
    'status is 2xx or 3xx': (r) => r.status >= 200 && r.status < 400,
    'response time < 2s': (r) => r.timings.duration < 2000,
    'has response body': (r) => r.body.length > 0,
    'content-disposition header exists': (r) => 
      r.headers['Content-Disposition'] && r.headers['Content-Disposition'].includes('attachment'),
  });

  sleep(1);
}
