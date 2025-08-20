
// tests/k6/scenarios/protect/soak.js
import http from 'k6/http';
import { check, sleep } from 'k6';
import { FormData } from 'https://jslib.k6.io/formdata/0.0.2/index.js';
import { BASE_URL, THRESHOLDS, createTestPDF } from '../../config.js';

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
  fd.append('pdf', createTestPDF(`protect-soak-${__VU}-${__ITER}.pdf`));
  fd.append('password', `soak-password-${__VU}-${__ITER}`);

  const response = http.post(`${BASE_URL}/api/pdf-handler/secure/block/`, fd.body(), {
    headers: { 'Content-Type': 'multipart/form-data; boundary=' + fd.boundary },
    timeout: '45s',
  });

  check(response, {
    'protect soak: status is success': (r) => r.status >= 200 && r.status < 400,
    'protect soak: response time acceptable': (r) => r.timings.duration < 5000,
    'protect soak: no server errors': (r) => r.status < 500,
    'protect soak: memory stable': (r) => r.status !== 503 && r.status !== 507,
  });

  sleep(2);
}
