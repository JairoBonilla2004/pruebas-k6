// tests/k6/run-all-tests.js
import { htmlReport } from "https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js";
import { textSummary } from "https://jslib.k6.io/k6-summary/0.0.1/index.js";

export function handleSummary(data) {
  return {
    "summary.html": htmlReport(data),
    "summary.json": JSON.stringify(data),
    stdout: textSummary(data, { indent: " ", enableColors: true }),
  };
}