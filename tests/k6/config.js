import { FormData } from 'https://jslib.k6.io/formdata/0.0.2/index.js';

// URL base
export const BASE_URL = __ENV.BASE_URL || 'http://localhost:8000';

// Thresholds
export const THRESHOLDS = {
  'http_req_duration{expected_response:true}': ['p(95)<5000'],
  'http_req_failed': ['rate<0.01'],
  'checks': ['rate>0.99'],
};

//  Cargar PDFs y watermark con open() en init stage
export const pdf1 = open('./test-pdf/BonillaJairoClassActivity.pdf', 'b');
export const pdf2 = open('./test-pdf/Bonilla_Jairo.pdf', 'b');
export const watermark = open('./test-pdf/imagen.jpg', 'b');

export const testPDFs = [pdf1, pdf2];
