// tests/k6/scenarios/merge/ramp-load.js
import http from 'k6/http';
import { check, sleep } from 'k6';
import { baseConfig, endpoints } from '../../config/base-config.js';
import { FormData } from 'https://jslib.k6.io/formdata/0.0.2/index.js';
import { samplePDFContent } from '../../utils/pdf-data.js';

export let options = {
  ...baseConfig,
  stages: [
    { duration: '2m', target: 10 },
    { duration: '5m', target: 30 }, // Lower target for merge due to processing complexity
    { duration: '2m', target: 50 },
    { duration: '3m', target: 50 },
    { duration: '2m', target: 0 },
  ],
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:8000';

export default function() {
  const formData = new FormData();
  
  // Create multiple PDF files for merging
  const pdf1 = new Blob([samplePDFContent], { type: 'application/pdf' });
  const pdf2 = new Blob([samplePDFContent], { type: 'application/pdf' });
  
  formData.append('pdf', pdf1, 'doc1.pdf');
  formData.append('pdf', pdf2, 'doc2.pdf');
  formData.append('output', `merged-${__VU}-${__ITER}.pdf`);
  
  const response = http.post(`${BASE_URL}${endpoints.merge}`, formData.body(), {
    headers: {
      'Content-Type': formData.contentType,
    },
  });

  check(response, {
    'status is 200': (r) => r.status === 200,
    'response time < 3s': (r) => r.timings.duration < 3000,
    'returns PDF file': (r) => r.headers['Content-Disposition'] && r.headers['Content-Disposition'].includes('attachment'),
  });

  sleep(2);
}