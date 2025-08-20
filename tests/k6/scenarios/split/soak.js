// tests/k6/scenarios/split/soak.js
import http from 'k6/http';
import { check, sleep } from 'k6';
import { FormData } from 'https://jslib.k6.io/formdata/0.0.2/index.js';
import { BASE_URL, THRESHOLDS, createTestPDF } from '../../config.js';

export let options = {
  scenarios: {
    soak_test: {
      executor: 'constant-vus',
      vus: 50,
      duration: '30m', // 30 minutos de carga sostenida
    },
  },
  thresholds: THRESHOLDS,
};

export default function () {
  const fd = new FormData();
  fd.append('pdf', createTestPDF(`split-soak-${__VU}-${__ITER}.pdf`));
  fd.append('split_in_page', '1');
  fd.append('output', JSON.stringify([`soak1-${__VU}.pdf`, `soak2-${__VU}.pdf`]));

  const response = http.post(`${BASE_URL}/api/pdf-handler/split/`, fd.body(), {
    headers: { 'Content-Type': 'multipart/form-data; boundary=' + fd.boundary },
    timeout: '45s',
  });

  check(response, {
    'split soak: status is success': (r) => r.status >= 200 && r.status < 400,
    'split soak: response time acceptable': (r) => r.timings.duration < 5000,
    'split soak: no server errors': (r) => r.status < 500,
    'split soak: memory stable': (r) => r.status !== 503 && r.status !== 507,
  });

  sleep(2);
}