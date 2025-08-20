# tests/k6/Makefile
.PHONY: install test clean help

BASE_URL ?= http://localhost:8000
RESULTS_DIR = results
DURATION ?= 5m
VUS ?= 50

help: ## Show this help message
	@echo "Available commands:"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  %-20s %s\n", $$1, $$2}'

install: ## Install k6 (Linux)
	sudo apt-key adv --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
	echo "deb https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
	sudo apt-get update
	sudo apt-get install k6

setup: ## Create results directory
	mkdir -p $(RESULTS_DIR)

test-upload-ramp: setup ## Run upload ramp load test
	BASE_URL=$(BASE_URL) k6 run --out json=$(RESULTS_DIR)/upload-ramp.json scenarios/upload/ramp-load.js

test-upload-spike: setup ## Run upload spike test  
	BASE_URL=$(BASE_URL) k6 run --out json=$(RESULTS_DIR)/upload-spike.json scenarios/upload/spike.js

test-upload-soak: setup ## Run upload soak test
	BASE_URL=$(BASE_URL) k6 run --out json=$(RESULTS_DIR)/upload-soak.json scenarios/upload/soak.js

test-split-ramp: setup ## Run split ramp load test
	BASE_URL=$(BASE_URL) k6 run --out json=$(RESULTS_DIR)/split-ramp.json scenarios/split/ramp-load.js

test-merge-ramp: setup ## Run merge ramp load test
	BASE_URL=$(BASE_URL) k6 run --out json=$(RESULTS_DIR)/merge-ramp.json scenarios/merge/ramp-load.js

test-watermark-soak: setup ## Run watermark soak test
	BASE_URL=$(BASE_URL) k6 run --out json=$(RESULTS_DIR)/watermark-soak.json scenarios/watermark/soak.js

test-protect-spike: setup ## Run protection spike test
	BASE_URL=$(BASE_URL) k6 run --out json=$(RESULTS_DIR)/protect-spike.json scenarios/protect/spike.js

test-all: setup ## Run all performance tests
	$(MAKE) test-upload-ramp
	$(MAKE) test-split-ramp  
	$(MAKE) test-merge-ramp
	$(MAKE) test-protect-spike

test-quick: setup ## Run quick performance test
	BASE_URL=$(BASE_URL) k6 run --duration=$(DURATION) --vus=$(VUS) --out json=$(RESULTS_DIR)/quick-test.json scenarios/upload/ramp-load.js

generate-report: ## Generate HTML report from results
	k6 run --out html=$(RESULTS_DIR)/report.html run-all-tests.js

clean: ## Clean up results directory
	rm -rf $(RESULTS_DIR)/*

docker-up: ## Start k6 with monitoring stack
	docker-compose up -d

docker-down: ## Stop monitoring stack
	docker-compose down

docker-test: ## Run tests in docker
	docker-compose run k6 run /scripts/scenarios/upload/ramp-load.js

