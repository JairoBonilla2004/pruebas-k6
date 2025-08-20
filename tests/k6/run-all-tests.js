// run-all-tests.js
import { htmlReport } from 'https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js';
import { jUnit, textSummary } from 'https://jslib.k6.io/k6-summary/0.0.1/index.js';

export function handleSummary(data) {
  return {
    'tests/k6/results/summary.html': htmlReport(data),
    'tests/k6/results/summary.json': JSON.stringify(data, null, 2),
    'tests/k6/results/junit.xml': jUnit(data),
    stdout: textSummary(data, { indent: ' ', enableColors: true }),
  };
}