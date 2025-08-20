// tests/k6/scenarios/watermark/soak.js
import http from 'k6/http';
import { check, sleep } from 'k6';
import { FormData } from 'https://jslib.k6.io/formdata/0.0.2/index.js';
import { BASE_URL, THRESHOLDS, createTestPDF, createTestImage } from '../../config.js';

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
  fd.append('pdf', createTestPDF(`watermark-soak-${__VU}-${__ITER}.pdf`));
  fd.append('watermark', createTestImage(`soak-logo-${__VU}-${__ITER}.png`));
  fd.append('output', `soak-watermarked-${__VU}-${__ITER}.pdf`);

  const response = http.post(`${BASE_URL}/api/pdf-handler/watermark/`, fd.body(), {
    headers: { 'Content-Type': 'multipart/form-data; boundary=' + fd.boundary },
    timeout: '45s',
  });

  check(response, {
    'watermark soak: status is success': (r) => r.status >= 200 && r.status < 400,
    'watermark soak: response time acceptable': (r) => r.timings.duration < 5000,
    'watermark soak: no server errors': (r) => r.status < 500,
    'watermark soak: memory stable': (r) => r.status !== 503 && r.status !== 507,
  });

  sleep(2);
}