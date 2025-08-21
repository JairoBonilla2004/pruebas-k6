// tests/k6/scenarios/split/spike.js
import http from 'k6/http';
import { check, sleep } from 'k6';
import { FormData } from 'https://jslib.k6.io/formdata/0.0.2/index.js';
import { BASE_URL, THRESHOLDS, testPDFs } from '../../config.js';

export let options = {
  scenarios: {
    spike_split: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '15s', target: 300 }, // subida rápida
        { duration: '2m', target: 300 },  // mantener pico
        { duration: '15s', target: 0 },   // bajada rápida
      ],
    },
  },
  thresholds: THRESHOLDS,
};

export default function () {
  const fd = new FormData();
  const pdf = testPDFs[__VU % testPDFs.length];

  fd.append('pdf', http.file(pdf, `split-spike-${__VU}-${__ITER}.pdf`, 'application/pdf'));
  fd.append('split_in_page', '2');
  fd.append('output', `output1-${__VU}-${__ITER}.pdf`);
  fd.append('output', `output2-${__VU}-${__ITER}.pdf`);

  const res = http.post(`${BASE_URL}/api/pdf-handler/split/`, fd.body(), {
    headers: { 'Content-Type': 'multipart/form-data; boundary=' + fd.boundary },
    timeout: '30s',
  });

  check(res, {
    'status is 2xx or 3xx': (r) => r.status >= 200 && r.status < 400,
    'response time < 2s': (r) => r.timings.duration < 2000,
    'no server errors': (r) => r.status < 500,
  });

  sleep(0.3);
}
