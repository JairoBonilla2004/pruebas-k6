// tests/k6/scenarios/merge/spike.js
import http from 'k6/http';
import { check, sleep } from 'k6';
import { FormData } from 'https://jslib.k6.io/formdata/0.0.2/index.js';
import { BASE_URL, THRESHOLDS, testPDFs } from '../../config.js';

export let options = {
  scenarios: {
    spike_test: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '15s', target: 20 },
        { duration: '2m', target: 20 },
        { duration: '15s', target: 0 },
      ],
    },
  },
  thresholds: THRESHOLDS,
};

export default function () {
  const fd = new FormData();

  // Elegir PDFs al azar para merge
  const pdf1 = testPDFs[__VU % testPDFs.length];
  const pdf2 = testPDFs[(__VU + 1) % testPDFs.length];

  fd.append('pdf', http.file(pdf1, `spike-merge1-${__VU}.pdf`, 'application/pdf'));
  fd.append('pdf', http.file(pdf2, `spike-merge2-${__VU}.pdf`, 'application/pdf'));
  fd.append('output', `spike-merged-${__VU}.pdf`);

  const res = http.post(`${BASE_URL}/api/pdf-handler/merge/`, fd.body(), {
    headers: { 'Content-Type': 'multipart/form-data; boundary=' + fd.boundary },
    timeout: '30s',
  });

  check(res, {
    'merge spike: status is 2xx or 3xx': (r) => r.status >= 200 && r.status < 400,
    'merge spike: response time < 3s': (r) => r.timings.duration < 3000,
    'merge spike: no server errors': (r) => r.status < 500,
  });

  sleep(0.5);
}
