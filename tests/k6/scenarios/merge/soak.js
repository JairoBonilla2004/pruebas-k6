// tests/k6/scenarios/merge/soak.js
import http from 'k6/http';
import { check, sleep } from 'k6';
import { FormData } from 'https://jslib.k6.io/formdata/0.0.2/index.js';
import { BASE_URL, THRESHOLDS, testPDFs } from '../../config.js';

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

  // Elegir PDFs al azar para merge
  const pdf1 = testPDFs[__VU % testPDFs.length];
  const pdf2 = testPDFs[(__VU + 1) % testPDFs.length];

  fd.append('pdf', http.file(pdf1, `soak-merge1-${__VU}-${__ITER}.pdf`, 'application/pdf'));
  fd.append('pdf', http.file(pdf2, `soak-merge2-${__VU}-${__ITER}.pdf`, 'application/pdf'));
  fd.append('output', `soak-merged-${__VU}-${__ITER}.pdf`);

  const res = http.post(`${BASE_URL}/api/pdf-handler/merge/`, fd.body(), {
    headers: { 'Content-Type': 'multipart/form-data; boundary=' + fd.boundary },
    timeout: '45s',
  });

  check(res, {
    'merge soak: status is 2xx or 3xx': (r) => r.status >= 200 && r.status < 400,
    'merge soak: response time < 5s': (r) => r.timings.duration < 5000,
    'merge soak: no server errors': (r) => r.status < 500,
  });

  sleep(2);
}
