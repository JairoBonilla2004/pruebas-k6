

// tests/k6/scenarios/watermark/soak.js
import http from 'k6/http';
import { check, sleep } from 'k6';
import { baseConfig, endpoints } from '../../config/base-config.js';
import { createWatermarkFormData } from '../../utils/pdf-data.js';

export let options = {
  ...baseConfig,
  stages: [
    { duration: '3m', target: 20 }, // Lower VUs for watermark processing
    { duration: '30m', target: 20 }, // Soak test
    { duration: '3m', target: 0 },
  ],
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:8000';

export default function() {
  const formData = createWatermarkFormData();
  
  const response = http.post(`${BASE_URL}${endpoints.watermark}`, formData.body(), {
    headers: {
      'Content-Type': formData.contentType,
    },
  });

  check(response, {
    'status is 200': (r) => r.status === 200,
    'response time < 5s': (r) => r.timings.duration < 5000,
    'watermark applied successfully': (r) => r.headers['Content-Disposition'] && r.headers['Content-Disposition'].includes('attachment'),
  });

  sleep(3);
}