// tests/k6/scenarios/merge/ramp.js
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
  fd.append('pdf', createTestPDF('merge1.pdf'));
  fd.append('pdf', createTestPDF('merge2.pdf'));
  fd.append('output', 'merged-result.pdf');

  const response = http.post(`${BASE_URL}/api/pdf-handler/merge/`, fd.body(), {
    headers: { 'Content-Type': 'multipart/form-data; boundary=' + fd.boundary },
    timeout: '30s',
  });

  check(response, {
    'merge: status is 200': (r) => r.status === 200,
    'merge: response time < 2s': (r) => r.timings.duration < 2000,
    'merge: has response body': (r) => r.body.length > 0,
    'merge: content-disposition header': (r) => 
      r.headers['Content-Disposition'] && r.headers['Content-Disposition'].includes('attachment'),
  });

  sleep(1);
}