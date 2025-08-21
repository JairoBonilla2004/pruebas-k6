// tests/k6/scenarios/watermark/soak.js
import http from 'k6/http';
import { check, sleep } from 'k6';
import { FormData } from 'https://jslib.k6.io/formdata/0.0.2/index.js';
import { BASE_URL, THRESHOLDS, testPDFs, watermark } from '../../config.js';

export let options = {
  scenarios: {
    soak_test: {
      executor: 'constant-vus',
      vus: 50,
      duration: '30m',
    },
  },
  thresholds: THRESHOLDS,
};

export default function () {
  const fd = new FormData();

  // Elegir un PDF al azar para cada VU
  const pdf = testPDFs[__VU % testPDFs.length];
  fd.append('pdf', http.file(pdf, `watermark-soak-${__VU}-${__ITER}.pdf`, 'application/pdf'));
  fd.append('watermark', http.file(watermark, `soak-logo-${__VU}-${__ITER}.jpg`, 'image/jpeg'));
  fd.append('output', `soak-watermarked-${__VU}-${__ITER}.pdf`);

  const res = http.post(`${BASE_URL}/api/pdf-handler/watermark/`, fd.body(), {
    headers: { 'Content-Type': 'multipart/form-data; boundary=' + fd.boundary },
    timeout: '45s',
  });

  check(res, {
    'status is 2xx or 3xx': (r) => r.status >= 200 && r.status < 400,
    'response time < 5s': (r) => r.timings.duration < 5000,
    'no server errors': (r) => r.status < 500,
  });

  sleep(2);
}
