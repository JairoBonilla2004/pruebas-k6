// tests/k6/scenarios/watermark/ramp.js
import http from 'k6/http';
import { check, sleep } from 'k6';
import { FormData } from 'https://jslib.k6.io/formdata/0.0.2/index.js';
import { BASE_URL, THRESHOLDS, createTestPDF, createTestImage } from '../../config.js';

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
  fd.append('pdf', createTestPDF('watermark-test.pdf'));
  fd.append('watermark', createTestImage('logo.png'));
  fd.append('output', 'watermarked-result.pdf');

  const response = http.post(`${BASE_URL}/api/pdf-handler/watermark/`, fd.body(), {
    headers: { 'Content-Type': 'multipart/form-data; boundary=' + fd.boundary },
    timeout: '30s',
  });

  check(response, {
    'watermark: status is 200': (r) => r.status === 200,
    'watermark: response time < 2s': (r) => r.timings.duration < 2000,
    'watermark: has response body': (r) => r.body.length > 0,
    'watermark: content-disposition header': (r) => 
      r.headers['Content-Disposition'] && r.headers['Content-Disposition'].includes('attachment'),
  });

  sleep(1);
}