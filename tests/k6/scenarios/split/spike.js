// tests/k6/scenarios/split/spike.js
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
        { duration: '15s', target: 300 }, // Spike rápido
        { duration: '2m', target: 300 },  // Mantener carga
        { duration: '15s', target: 0 },   // Bajar rápido
      ],
    },
  },
  thresholds: THRESHOLDS,
};

export default function () {
  const fd = new FormData();
  fd.append('pdf', createTestPDF('split-spike-test.pdf'));
  fd.append('split_in_page', '1');
  fd.append('output', JSON.stringify(['spike1.pdf', 'spike2.pdf']));

  const response = http.post(`${BASE_URL}/api/pdf-handler/split/`, fd.body(), {
    headers: { 'Content-Type': 'multipart/form-data; boundary=' + fd.boundary },
    timeout: '30s',
  });

  check(response, {
    'split spike: status is success': (r) => r.status >= 200 && r.status < 400,
    'split spike: response time acceptable': (r) => r.timings.duration < 3000,
    'split spike: no server errors': (r) => r.status < 500,
  });

  sleep(0.5);
}