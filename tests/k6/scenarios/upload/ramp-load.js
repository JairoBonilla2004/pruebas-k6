
// tests/k6/scenarios/upload/ramp-load.js
import http from 'k6/http';
import { check, sleep } from 'k6';
import { baseConfig, endpoints } from '../../config/base-config.js';
import { createPDFFormData } from '../../utils/pdf-data.js';

export let options = {
  ...baseConfig,
  stages: [
    { duration: '2m', target: 10 }, // Ramp up to 10 VUs
    { duration: '5m', target: 50 }, // Stay at 50 VUs
    { duration: '2m', target: 100 }, // Ramp up to 100 VUs
    { duration: '3m', target: 100 }, // Stay at 100 VUs
    { duration: '2m', target: 0 }, // Ramp down
  ],
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:8000';

export default function() {
  const formData = createPDFFormData(`test-${__VU}-${__ITER}.pdf`);
  
  const response = http.post(`${BASE_URL}${endpoints.upload}`, formData.body(), {
    headers: {
      'Content-Type': formData.contentType,
    },
  });

  check(response, {
    'status is 201': (r) => r.status === 201,
    'response time < 500ms': (r) => r.timings.duration < 500,
    'response contains success message': (r) => r.body.includes('File Upload'),
  });

  sleep(1);
}