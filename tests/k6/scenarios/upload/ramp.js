// tests/k6/scenarios/upload/ramp.js
import http from 'k6/http';
import { check, sleep } from 'k6';
import { FormData } from 'https://jslib.k6.io/formdata/0.0.2/index.js';
import { BASE_URL, THRESHOLDS, createTestPDF } from '../../config.js';

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
  fd.append('pdf', createTestPDF(`upload-test-${__VU}-${__ITER}.pdf`));

  const response = http.post(`${BASE_URL}/api/pdf-handler/upload/`, fd.body(), {
    headers: { 'Content-Type': 'multipart/form-data; boundary=' + fd.boundary },
    timeout: '30s',
  });

  check(response, {
    'upload: status is 201': (r) => r.status === 201,
    'upload: response time < 1s': (r) => r.timings.duration < 1000,
    'upload: has success message': (r) => r.body && r.body.includes('File Upload'),
  });

  sleep(1);
}
