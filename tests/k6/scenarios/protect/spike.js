// tests/k6/scenarios/protect/spike.js

import http from 'k6/http';
import { check, sleep } from 'k6';
import { FormData } from 'https://jslib.k6.io/formdata/0.0.2/index.js';
import { BASE_URL, THRESHOLDS, createTestPDF } from '../../config.js';

export let options = {
  scenarios: {
    spike_test: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '15s', target: 300 },
        { duration: '2m', target: 300 },
        { duration: '15s', target: 0 },
      ],
    },
  },
  thresholds: THRESHOLDS,
};

export default function () {
  const fd = new FormData();
  fd.append('pdf', createTestPDF(`protect-spike-${__VU}.pdf`));
  fd.append('password', `spike-pass-${__VU}`);

  const response = http.post(`${BASE_URL}/api/pdf-handler/secure/block/`, fd.body(), {
    headers: { 'Content-Type': 'multipart/form-data; boundary=' + fd.boundary },
    timeout: '30s',
  });

  check(response, {
    'protect spike: status is success': (r) => r.status >= 200 && r.status < 400,
    'protect spike: response time acceptable': (r) => r.timings.duration < 3000,
    'protect spike: no server errors': (r) => r.status < 500,
  });

  sleep(0.5);
}
