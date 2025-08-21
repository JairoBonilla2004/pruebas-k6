// tests/k6/scenarios/split/spike.js
import http from 'k6/http';
import { check, sleep } from 'k6';
import { FormData } from 'https://jslib.k6.io/formdata/0.0.2/index.js';
import { BASE_URL, THRESHOLDS, testPDFs } from '../../config.js';

export let options = {
  scenarios: {
    spike_load: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '15s', target: 45 },
        { duration: '2m', target: 45 },
        { duration: '15s', target: 0 },
      ],
    },
  },
  thresholds: THRESHOLDS,
};

export default function () {
  const fd = new FormData();
  const pdf = testPDFs[1]; // siempre pdf2

  fd.append('pdf', http.file(pdf, `split-spike-${__VU}-${__ITER}.pdf`, 'application/pdf'));
  fd.append('split_in_page', '2');
  fd.append('output', `output1-${__VU}-${__ITER}.pdf`);
  fd.append('output', `output2-${__VU}-${__ITER}.pdf`);

  const res = http.post(`${BASE_URL}/api/pdf-handler/split/`, fd.body(), {
    headers: { 'Content-Type': 'multipart/form-data; boundary=' + fd.boundary },
    timeout: '30s',
  });

  check(res, {
    'status is 200': (r) => r.status === 200,
    'response time < 5s': (r) => r.timings.duration < 5000,
    'has ZIP content': (r) => r.body && r.body.startsWith('PK'),
  });

  sleep(1);
}
