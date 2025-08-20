// tests/k6/scenarios/split/ramp.js
import http from "k6/http";
import { check, sleep } from "k6";
import { FormData } from "https://jslib.k6.io/formdata/0.0.2/index.js";
import { BASE_URL, THRESHOLDS, createTestPDF } from "../../config.js";

export let options = {
  scenarios: {
    ramp_load: {
      executor: "ramping-vus",
      startVUs: 10,
      stages: [
        { duration: "2m", target: 30 },
        { duration: "2m", target: 60 },
        { duration: "3m", target: 100 },
        { duration: "3m", target: 100 },
        { duration: "2m", target: 0 },
      ],
    },
  },
  thresholds: THRESHOLDS,
};

export default function () {
  const pdfData = createTestPDF(); // ✅ ahora es Uint8Array

  const fd = new FormData();
  fd.append("pdf", pdfData, "split-test.pdf"); // k6 acepta Uint8Array
  fd.append("split_in_page", "1");
  fd.append("output", JSON.stringify(["part1.pdf", "part2.pdf"]));

  const response = http.post(`${BASE_URL}/api/pdf-handler/split/`, fd.body(), {
    headers: { "Content-Type": "multipart/form-data; boundary=" + fd.boundary },
    timeout: "30s",
  });

  check(response, {
    "split: status is 200": (r) => r.status === 200,
    "split: response time < 2s": (r) => r.timings.duration < 2000,
    "split: has response body": (r) => r.body && r.body.length > 0,
    "split: content-type is application/zip": (r) =>
      r.headers["Content-Type"] &&
      r.headers["Content-Type"].includes("application"),
  });

  sleep(1);
}
