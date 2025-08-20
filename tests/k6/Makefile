.PHONY: k6-setup k6-clean k6-split k6-merge k6-protect k6-watermark k6-all

# Variables
BASE_URL ?= http://localhost:8000
K6_IMAGE = grafana/k6:latest
K6_SCRIPT_DIR := /home/jairo/Escritorio/pruebas-k6/tests/k6
K6_RESULTS_DIR := $(K6_SCRIPT_DIR)/results

# Setup
k6-setup:
	@mkdir -p $(K6_RESULTS_DIR)
	@echo "✅ K6 setup complete"

k6-clean:
	@rm -rf $(K6_RESULTS_DIR)/*
	@echo "🧹 Results cleaned"

# --- Split PDF tests ---
k6-split-ramp: k6-setup
	@echo "📈 Running Split PDF Ramp Test..."
	@docker run --rm \
		-v "$(K6_SCRIPT_DIR):/scripts" \
		-v "$(K6_RESULTS_DIR):/results" \
		-e BASE_URL=$(BASE_URL) \
		--network host \
		$(K6_IMAGE) run \
		/scripts/scenarios/split/ramp.js

k6-split-spike: k6-setup
	@echo "⚡ Running Split PDF Spike Test..."
	@docker run --rm \
		-v "$(K6_SCRIPT_DIR):/scripts" \
		-v "$(K6_RESULTS_DIR):/results" \
		-e BASE_URL=$(BASE_URL) \
		--network host \
		$(K6_IMAGE) run \
		/scripts/scenarios/split/spike.js

k6-split-soak: k6-setup
	@echo "🔄 Running Split PDF Soak Test..."
	@docker run --rm \
		-v "$(K6_SCRIPT_DIR):/scripts" \
		-v "$(K6_RESULTS_DIR):/results" \
		-e BASE_URL=$(BASE_URL) \
		--network host \
		$(K6_IMAGE) run \
		/scripts/scenarios/split/soak.js

# --- Merge PDF tests ---
k6-merge-ramp: k6-setup
	@echo "📈 Running Merge PDF Ramp Test..."
	@docker run --rm \
		-v "$(K6_SCRIPT_DIR):/scripts" \
		-v "$(K6_RESULTS_DIR):/results" \
		-e BASE_URL=$(BASE_URL) \
		--network host \
		$(K6_IMAGE) run \
		/scripts/scenarios/merge/ramp.js

k6-merge-spike: k6-setup
	@echo "⚡ Running Merge PDF Spike Test..."
	@docker run --rm \
		-v "$(K6_SCRIPT_DIR):/scripts" \
		-v "$(K6_RESULTS_DIR):/results" \
		-e BASE_URL=$(BASE_URL) \
		--network host \
		$(K6_IMAGE) run \
		/scripts/scenarios/merge/spike.js

k6-merge-soak: k6-setup
	@echo "🔄 Running Merge PDF Soak Test..."
	@docker run --rm \
		-v "$(K6_SCRIPT_DIR):/scripts" \
		-v "$(K6_RESULTS_DIR):/results" \
		-e BASE_URL=$(BASE_URL) \
		--network host \
		$(K6_IMAGE) run \
		/scripts/scenarios/merge/soak.js

# --- Protect PDF tests ---
k6-protect-ramp: k6-setup
	@echo "📈 Running Protect PDF Ramp Test..."
	@docker run --rm \
		-v "$(K6_SCRIPT_DIR):/scripts" \
		-v "$(K6_RESULTS_DIR):/results" \
		-e BASE_URL=$(BASE_URL) \
		--network host \
		$(K6_IMAGE) run \
		/scripts/scenarios/protect/ramp.js

# --- Watermark PDF tests ---
k6-watermark-ramp: k6-setup
	@echo "📈 Running Watermark PDF Ramp Test..."
	@docker run --rm \
		-v "$(K6_SCRIPT_DIR):/scripts" \
		-v "$(K6_RESULTS_DIR):/results" \
		-e BASE_URL=$(BASE_URL) \
		--network host \
		$(K6_IMAGE) run \
		/scripts/scenarios/watermark/ramp.js

# --- Upload PDF tests ---
k6-upload-ramp: k6-setup
	@echo "📈 Running Upload PDF Ramp Test..."
	@docker run --rm \
		-v "$(K6_SCRIPT_DIR):/scripts" \
		-v "$(K6_RESULTS_DIR):/results" \
		-e BASE_URL=$(BASE_URL) \
		--network host \
		$(K6_IMAGE) run \
		/scripts/scenarios/upload/ramp-load.js

# --- Run all ramp tests ---
k6-ramp-all: k6-split-ramp k6-merge-ramp k6-protect-ramp k6-watermark-ramp k6-upload-ramp
	@echo "🎉 All ramp tests completed"

# --- Run all spike tests ---
k6-spike-all: k6-split-spike k6-merge-spike
	@echo "🎉 All spike tests completed"

# --- Run all soak tests ---
k6-soak-all: k6-split-soak k6-merge-soak
	@echo "🎉 All soak tests completed"

# --- Run all tests ---
k6-all: k6-ramp-all k6-spike-all k6-soak-all
	@echo "🎉 All performance tests completed"
