.PHONY: k6-setup k6-clean k6-split k6-merge k6-protect k6-watermark k6-upload k6-all k6-report k6-ci-performance k6-ci-artifacts

# Variables
BASE_URL ?= http://localhost:8000
K6_IMAGE = grafana/k6:latest
K6_SCRIPT_DIR := /home/jairo/Escritorio/pruebas-k6/tests/k6
K6_RESULTS_DIR := $(K6_SCRIPT_DIR)/results

# --- Setup & Clean ---
k6-setup:
	@mkdir -p $(K6_RESULTS_DIR)
	@echo " K6 setup complete"

k6-clean:
	@rm -rf $(K6_RESULTS_DIR)/*
	@echo " Results cleaned"

# --- Helper function to run a K6 script ---
define RUN_K6
	@echo "🚀 Starting K6 test: $(1)"
	-docker run --rm -u 1000:1000 -v "$(K6_SCRIPT_DIR):/scripts" -v "$(K6_RESULTS_DIR):/results" \
		-e BASE_URL=$(BASE_URL) --network host $(K6_IMAGE) run /scripts/$(1) --out json=/results/$(2).json
	@echo " K6 test completed (exit code ignored), generating HTML report..."
	$(call GENERATE_HTML_REPORT,$(2))
endef

# --- Helper function to generate HTML report for a single test ---
define GENERATE_HTML_REPORT
	@echo " Generating HTML report for $(1)..."
	@python3 $(K6_SCRIPT_DIR)/generate_report.py "$(K6_RESULTS_DIR)" "$(1)"
	@echo " Report available at: $(K6_RESULTS_DIR)/$(1)-report.html"
endef

# --- Split PDF tests ---
k6-split-ramp: k6-setup
	@echo " Running Split PDF Ramp Test..."
	$(call RUN_K6,scenarios/split/ramp.js,split-ramp)

k6-split-spike: k6-setup
	@echo " Running Split PDF Spike Test..."
	$(call RUN_K6,scenarios/split/spike.js,split-spike)

k6-split-soak: k6-setup
	@echo " Running Split PDF Soak Test..."
	$(call RUN_K6,scenarios/split/soak.js,split-soak)

# --- Merge PDF tests ---
k6-merge-ramp: k6-setup
	@echo " Running Merge PDF Ramp Test..."
	$(call RUN_K6,scenarios/merge/ramp.js,merge-ramp)

k6-merge-spike: k6-setup
	@echo "⚡ Running Merge PDF Spike Test..."
	$(call RUN_K6,scenarios/merge/spike.js,merge-spike)

k6-merge-soak: k6-setup
	@echo " Running Merge PDF Soak Test..."
	$(call RUN_K6,scenarios/merge/soak.js,merge-soak)

# --- Protect PDF tests ---
k6-protect-ramp: k6-setup
	@echo " Running Protect PDF Ramp Test..."
	$(call RUN_K6,scenarios/protect/ramp.js,protect-ramp)

k6-protect-spike: k6-setup
	@echo "⚡ Running Protect PDF Spike Test..."
	$(call RUN_K6,scenarios/protect/spike.js,protect-spike)

k6-protect-soak: k6-setup
	@echo " Running Protect PDF Soak Test..."
	$(call RUN_K6,scenarios/protect/soak.js,protect-soak)

# --- Watermark PDF tests ---
k6-watermark-ramp: k6-setup
	@echo " Running Watermark PDF Ramp Test..."
	$(call RUN_K6,scenarios/watermark/ramp.js,watermark-ramp)

k6-watermark-spike: k6-setup
	@echo "⚡ Running Watermark PDF Spike Test..."
	$(call RUN_K6,scenarios/watermark/spike.js,watermark-spike)

k6-watermark-soak: k6-setup
	@echo " Running Watermark PDF Soak Test..."
	$(call RUN_K6,scenarios/watermark/soak.js,watermark-soak)

# --- Upload PDF tests ---
k6-upload-ramp: k6-setup
	@echo " Running Upload PDF Ramp Test..."
	$(call RUN_K6,scenarios/upload/ramp.js,upload-ramp)

k6-upload-spike: k6-setup
	@echo " Running Upload PDF Spike Test..."
	$(call RUN_K6,scenarios/upload/spike.js,upload-spike)

k6-upload-soak: k6-setup
	@echo " Running Upload PDF Soak Test..."
	$(call RUN_K6,scenarios/upload/soak.js,upload-soak)

# --- Run all ramp tests ---
k6-ramp-all: k6-split-ramp k6-merge-ramp k6-protect-ramp k6-watermark-ramp k6-upload-ramp
	@echo " All ramp tests completed"
	@python3 $(K6_SCRIPT_DIR)/generate_combined_report.py "$(K6_RESULTS_DIR)" "ramp"

# --- Run all spike tests ---
k6-spike-all: k6-split-spike k6-merge-spike k6-protect-spike k6-watermark-spike k6-upload-spike
	@echo " All spike tests completed"
	@python3 $(K6_SCRIPT_DIR)/generate_combined_report.py "$(K6_RESULTS_DIR)" "spike"

# --- Run all soak tests ---
k6-soak-all: k6-split-soak k6-merge-soak k6-protect-soak k6-watermark-soak k6-upload-soak
	@echo " All soak tests completed"
	@python3 $(K6_SCRIPT_DIR)/generate_combined_report.py "$(K6_RESULTS_DIR)" "soak"

# --- Run absolutely everything ---
k6-all: k6-ramp-all k6-spike-all k6-soak-all
	@echo " All performance tests completed"
	@python3 $(K6_SCRIPT_DIR)/generate_master_report.py "$(K6_RESULTS_DIR)"

# --- CI Artifacts ---
k6-ci-artifacts:
	@echo " Generating CI artifacts..."
	@mkdir -p $(K6_RESULTS_DIR)/ci/artifacts
	@python3 $(K6_SCRIPT_DIR)/generate_ci_artifacts.py "$(K6_RESULTS_DIR)"
	@echo " CI Artifacts ready"

# --- Simple Report for development ---
k6-report: k6-setup
	@echo "Generating HTML & JUnit reports..."
	@npx k6-reporter $(K6_RESULTS_DIR)/*.json || echo "⚠️ k6-reporter not found, skipping HTML generation"
	@npx k6-junit $(K6_RESULTS_DIR)/*.json -o $(K6_RESULTS_DIR)/k6-results.xml || echo "⚠️ k6-junit not found, skipping JUnit generation"
	@echo "Reports generated in $(K6_RESULTS_DIR)"