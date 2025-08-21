// tests/k6/scenarios/split/soak.js
import http from 'k6/http';
import { check, sleep } from 'k6';
import { FormData } from 'https://jslib.k6.io/formdata/0.0.2/index.js';
import { BASE_URL, THRESHOLDS, testPDFs } from '../../config.js';

export let options = {
  scenarios: {
    soak_split: {
      executor: 'constant-vus',
      vus: 60,           // carga constante baja/media
      duration: '30m',   // larga duración
    },
  },
  thresholds: THRESHOLDS,
};

export default function () {
  const fd = new FormData();
  const pdf = testPDFs[__VU % testPDFs.length];

  fd.append('pdf', http.file(pdf, `split-soak-${__VU}-${__ITER}.pdf`, 'application/pdf'));
  fd.append('split_in_page', '2');
  fd.append('output', `output1-${__VU}-${__ITER}.pdf`);
  fd.append('output', `output2-${__VU}-${__ITER}.pdf`);

  const res = http.post(`${BASE_URL}/api/pdf-handler/split/`, fd.body(), {
    headers: { 'Content-Type': 'multipart/form-data; boundary=' + fd.boundary },
    timeout: '45s',
  });

  check(res, {
    'status is 2xx or 3xx': (r) => r.status >= 200 && r.status < 400,
    'response time < 3s': (r) => r.timings.duration < 3000,
    'no server errors': (r) => r.status < 500,
    'memory stable': (r) => r.status !== 503 && r.status !== 507,
  });

  sleep(1.5);
}
