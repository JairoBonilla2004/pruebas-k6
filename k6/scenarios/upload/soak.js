// tests/k6/scenarios/upload/soak.js
import http from 'k6/http';
import { check, sleep } from 'k6';
import { baseConfig, endpoints } from '../../config/base-config.js';
import { createPDFFormData } from '../../utils/pdf-data.js';

export let options = {
  ...baseConfig,
  stages: [
    { duration: '5m', target: 50 }, // Ramp up
    { duration: '30m', target: 50 }, // Soak test - 30 minutes
    { duration: '5m', target: 0 }, // Ramp down
  ],
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:8000';

export default function() {
  const formData = createPDFFormData(`soak-test-${__VU}-${__ITER}.pdf`);
  
  const response = http.post(`${BASE_URL}${endpoints.upload}`, formData.body(), {
    headers: {
      'Content-Type': formData.contentType,
    },
  });

  check(response, {
    'status is 201': (r) => r.status === 201,
    'response time stable during soak': (r) => r.timings.duration < 500,
    'memory not leaking (status ok)': (r) => r.status < 500,
  });

  sleep(2);
}