

// tests/k6/scenarios/protect/spike.js
import http from 'k6/http';
import { check, sleep } from 'k6';
import { baseConfig, endpoints } from '../../config/base-config.js';
import { createPDFFormData } from '../../utils/pdf-data.js';

export let options = {
  ...baseConfig,
  stages: [
    { duration: '15s', target: 200 },
    { duration: '2m', target: 200 },
    { duration: '15s', target: 0 },
  ],
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:8000';

export default function() {
  const formData = createPDFFormData(`protect-${__VU}-${__ITER}.pdf`, {
    password: 'testpass123'
  });
  
  const response = http.post(`${BASE_URL}${endpoints.block}`, formData.body(), {
    headers: {
      'Content-Type': formData.contentType,
    },
  });

  check(response, {
    'status is 200': (r) => r.status === 200,
    'response time < 2s during spike': (r) => r.timings.duration < 2000,
    'PDF protection successful': (r) => r.headers['Content-Disposition'] && r.headers['Content-Disposition'].includes('protected'),
  });

  sleep(0.5);
}