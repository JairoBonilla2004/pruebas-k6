// tests/k6/scenarios/split/ramp-load.js
import http from 'k6/http';
import { check, sleep } from 'k6';
import { baseConfig, endpoints } from '../../config/base-config.js';
import { createPDFFormData } from '../../utils/pdf-data.js';

export let options = {
  ...baseConfig,
  stages: [
    { duration: '2m', target: 10 },
    { duration: '5m', target: 50 },
    { duration: '2m', target: 100 },
    { duration: '3m', target: 100 },
    { duration: '2m', target: 0 },
  ],
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:8000';

export default function() {
  const formData = createPDFFormData(`split-test-${__VU}-${__ITER}.pdf`, {
    split_in_page: '1',
    output: ['part1.pdf', 'part2.pdf']
  });
  
  const response = http.post(`${BASE_URL}${endpoints.split}`, formData.body(), {
    headers: {
      'Content-Type': formData.contentType,
    },
  });

  check(response, {
    'status is 200': (r) => r.status === 200,
    'response time < 2s': (r) => r.timings.duration < 2000,
    'returns zip file': (r) => r.headers['Content-Type'] && r.headers['Content-Type'].includes('application'),
  });

  sleep(1);
}