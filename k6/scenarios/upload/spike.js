
// tests/k6/scenarios/upload/spike.js
import http from 'k6/http';
import { check, sleep } from 'k6';
import { baseConfig, endpoints } from '../../config/base-config.js';
import { createPDFFormData } from '../../utils/pdf-data.js';

export let options = {
  ...baseConfig,
  stages: [
    { duration: '10s', target: 300 }, // Spike to 300 VUs
    { duration: '1m', target: 300 }, // Maintain spike
    { duration: '10s', target: 0 }, // Drop back to 0
  ],
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:8000';

export default function() {
  const formData = createPDFFormData(`spike-test-${__VU}-${__ITER}.pdf`);
  
  const response = http.post(`${BASE_URL}${endpoints.upload}`, formData.body(), {
    headers: {
      'Content-Type': formData.contentType,
    },
  });

  check(response, {
    'status is 201': (r) => r.status === 201,
    'response time < 1s during spike': (r) => r.timings.duration < 1000,
    'no server errors': (r) => r.status < 500,
  });

  sleep(0.1);
}
