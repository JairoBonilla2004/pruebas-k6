// tests/k6/config/base-config.js
export const baseConfig = {
  thresholds: {
    'http_req_duration{expected_response:true}': ['p(95)<500'], // 95% of requests under 500ms
    'http_req_failed': ['rate<0.01'], // Less than 1% failure rate
    'checks': ['rate>0.99'], // 99% of checks pass
  },
  summaryTrendStats: ['avg', 'min', 'med', 'max', 'p(90)', 'p(95)'],
};

export const endpoints = {
  upload: '/api/pdf-handler/upload/',
  split: '/api/pdf-handler/split/',
  merge: '/api/pdf-handler/merge/',
  watermark: '/api/pdf-handler/watermark/',
  intercalate: '/api/pdf-handler/intercalate/',
  block: '/api/pdf-handler/secure/block/',
  unblock: '/api/pdf-handler/secure/unblock/',
  enumerate: '/api/pdf-handler/enumerate/',
};

// tests/k6/utils/pdf-data.js
import { FormData } from 'https://jslib.k6.io/formdata/0.0.2/index.js';

// Sample PDF content (minimal PDF structure)
export const samplePDFContent = `%PDF-1.4
1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
>>
endobj

2 0 obj
<<
/Type /Pages
/Kids [3 0 R]
/Count 1
>>
endobj

3 0 obj
<<
/Type /Page
/Parent 2 0 R
/MediaBox [0 0 612 792]
/Contents 4 0 R
>>
endobj

4 0 obj
<<
/Length 44
>>
stream
BT
/F1 12 Tf
100 700 Td
(Hello World) Tj
ET
endstream
endobj

xref
0 5
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000206 00000 n 
trailer
<<
/Size 5
/Root 1 0 R
>>
startxref
299
%%EOF`;

export function createPDFFormData(filename = 'test.pdf', additionalFields = {}) {
  const formData = new FormData();
  
  // Create PDF file
  const pdfBlob = new Blob([samplePDFContent], { type: 'application/pdf' });
  formData.append('pdf', pdfBlob, filename);
  
  // Add additional fields
  Object.keys(additionalFields).forEach(key => {
    if (Array.isArray(additionalFields[key])) {
      additionalFields[key].forEach(value => {
        formData.append(key, value);
      });
    } else {
      formData.append(key, additionalFields[key]);
    }
  });
  
  return formData;
}

export function createWatermarkFormData() {
  const formData = new FormData();
  
  // Create sample PDF
  const pdfBlob = new Blob([samplePDFContent], { type: 'application/pdf' });
  formData.append('pdf', pdfBlob, 'document.pdf');
  
  // Create sample PNG watermark (1x1 pixel PNG)
  const pngContent = new Uint8Array([
    0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00, 0x00, 0x0D,
    0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
    0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53, 0xDE, 0x00, 0x00, 0x00,
    0x0C, 0x49, 0x44, 0x41, 0x54, 0x08, 0x57, 0x63, 0xF8, 0x0F, 0x00, 0x00,
    0x01, 0x00, 0x01, 0x5C, 0xCD, 0x90, 0x0A, 0x00, 0x00, 0x00, 0x00, 0x49,
    0x45, 0x4E, 0x44, 0xAE, 0x42, 0x60, 0x82
  ]);
  const watermarkBlob = new Blob([pngContent], { type: 'image/png' });
  formData.append('watermark', watermarkBlob, 'watermark.png');
  formData.append('output', 'watermarked_test.pdf');
  
  return formData;
}

