.PHONY: k6-setup k6-clean k6-split k6-merge k6-protect k6-watermark k6-upload k6-all k6-report k6-install-reporters

# Variables
BASE_URL ?= http://localhost:8000
K6_IMAGE = grafana/k6:latest
K6_SCRIPT_DIR := /home/jairo/Escritorio/pruebas-k6/tests/k6
K6_RESULTS_DIR := $(K6_SCRIPT_DIR)/results

# --- Setup & Clean ---
k6-setup:
	@mkdir -p $(K6_RESULTS_DIR)
	@echo "✅ K6 setup complete"

k6-clean:
	@rm -rf $(K6_RESULTS_DIR)/*
	@echo "🧹 Results cleaned"

# --- Install report generators locally ---
k6-install-reporters:
	@echo "📦 Installing report generators locally..."
	@npm init -y 2>/dev/null || true
	@npm install k6-html-reporter k6-to-junit
	@echo "✅ Report generators installed locally"

# --- Helper function to run a K6 script ---
define RUN_K6
	docker run --rm -u 1000:1000 -v "$(K6_SCRIPT_DIR):/scripts" -v "$(K6_RESULTS_DIR):/results" \
		-e BASE_URL=$(BASE_URL) --network host $(K6_IMAGE) run /scripts/$(1) --out json=/results/$(2).json
endef

# --- Split PDF tests ---
k6-split-ramp: k6-setup
	@echo "📈 Running Split PDF Ramp Test..."
	$(call RUN_K6,scenarios/split/ramp.js,split-ramp)

k6-split-spike: k6-setup
	@echo "⚡ Running Split PDF Spike Test..."
	$(call RUN_K6,scenarios/split/spike.js,split-spike)

k6-split-soak: k6-setup
	@echo "🔄 Running Split PDF Soak Test..."
	$(call RUN_K6,scenarios/split/soak.js,split-soak)

# --- Merge PDF tests ---
k6-merge-ramp: k6-setup
	@echo "📈 Running Merge PDF Ramp Test..."
	$(call RUN_K6,scenarios/merge/ramp.js,merge-ramp)

k6-merge-spike: k6-setup
	@echo "⚡ Running Merge PDF Spike Test..."
	$(call RUN_K6,scenarios/merge/spike.js,merge-spike)

k6-merge-soak: k6-setup
	@echo "🔄 Running Merge PDF Soak Test..."
	$(call RUN_K6,scenarios/merge/soak.js,merge-soak)

# --- Protect PDF tests ---
k6-protect-ramp: k6-setup
	@echo "📈 Running Protect PDF Ramp Test..."
	$(call RUN_K6,scenarios/protect/ramp.js,protect-ramp)

k6-protect-spike: k6-setup
	@echo "⚡ Running Protect PDF Spike Test..."
	$(call RUN_K6,scenarios/protect/spike.js,protect-spike)

k6-protect-soak: k6-setup
	@echo "🔄 Running Protect PDF Soak Test..."
	$(call RUN_K6,scenarios/protect/soak.js,protect-soak)

# --- Watermark PDF tests ---
k6-watermark-ramp: k6-setup
	@echo "📈 Running Watermark PDF Ramp Test..."
	$(call RUN_K6,scenarios/watermark/ramp.js,watermark-ramp)

k6-watermark-spike: k6-setup
	@echo "⚡ Running Watermark PDF Spike Test..."
	$(call RUN_K6,scenarios/watermark/spike.js,watermark-spike)

k6-watermark-soak: k6-setup
	@echo "🔄 Running Watermark PDF Soak Test..."
	$(call RUN_K6,scenarios/watermark/soak.js,watermark-soak)

# --- Upload PDF tests ---
k6-upload-ramp: k6-setup
	@echo "📈 Running Upload PDF Ramp Test..."
	$(call RUN_K6,scenarios/upload/ramp.js,upload-ramp)

k6-upload-spike: k6-setup
	@echo "⚡ Running Upload PDF Spike Test..."
	$(call RUN_K6,scenarios/upload/spike.js,upload-spike)

k6-upload-soak: k6-setup
	@echo "🔄 Running Upload PDF Soak Test..."
	$(call RUN_K6,scenarios/upload/soak.js,upload-soak)

# --- Run all ramp tests ---
k6-ramp-all: k6-split-ramp k6-merge-ramp k6-protect-ramp k6-watermark-ramp k6-upload-ramp
	@echo "🎉 All ramp tests completed"

# --- Run all spike tests ---
k6-spike-all: k6-split-spike k6-merge-spike k6-protect-spike k6-watermark-spike k6-upload-spike
	@echo "🎉 All spike tests completed"

# --- Run all soak tests ---
k6-soak-all: k6-split-soak k6-merge-soak k6-protect-soak k6-watermark-soak k6-upload-soak
	@echo "🎉 All soak tests completed"

# --- Run absolutely everything ---
k6-all: k6-ramp-all k6-spike-all k6-soak-all
	@echo "🎉 All performance tests completed"

# --- Post-process JSON results to HTML/JUnit ---
k6-report: k6-setup
	@echo "📊 Generating HTML & JUnit reports..."
	@if [ ! -f "package.json" ]; then \
		echo "📦 Initializing npm project..."; \
		npm init -y; \
	fi
	@if [ ! -d "node_modules/k6-html-reporter" ]; then \
		echo "⚠️  k6-html-reporter not found. Installing locally..."; \
		npm install k6-html-reporter; \
	fi
	@if [ ! -d "node_modules/k6-to-junit" ]; then \
		echo "⚠️  k6-to-junit not found. Installing locally..."; \
		npm install k6-to-junit; \
	fi
	@echo "🔍 Looking for JSON files in $(K6_RESULTS_DIR)..."
	@if ls $(K6_RESULTS_DIR)/*.json 1> /dev/null 2>&1; then \
		for json_file in $(K6_RESULTS_DIR)/*.json; do \
			echo "📊 Processing $json_file..."; \
			npx k6-html-reporter --json-file "$json_file" --output "$(K6_RESULTS_DIR)/$(basename "$json_file" .json).html"; \
			npx k6-to-junit "$json_file" -o "$(K6_RESULTS_DIR)/$(basename "$json_file" .json).xml"; \
		done; \
	else \
		echo "⚠️  No JSON files found in $(K6_RESULTS_DIR)"; \
		echo "💡 Run some tests first (e.g., make k6-split-ramp)"; \
	fi
	@echo "✅ Reports generated in $(K6_RESULTS_DIR)"

# --- Generate simple summary report using Python script ---
k6-report-simple: k6-setup
	@echo "📊 Generating simple HTML report using Python..."
	@if ls $(K6_RESULTS_DIR)/*.json 1> /dev/null 2>&1; then \
		echo "import json, os, glob, datetime" > /tmp/k6_report.py; \
		echo "results_dir = '$(K6_RESULTS_DIR)'" >> /tmp/k6_report.py; \
		echo "json_files = glob.glob(os.path.join(results_dir, '*.json'))" >> /tmp/k6_report.py; \
		echo "html_start = '''<html><head><title>K6 Test Results</title>" >> /tmp/k6_report.py; \
		echo "<style>" >> /tmp/k6_report.py; \
		echo "body{font-family:Arial,sans-serif;margin:20px;}" >> /tmp/k6_report.py; \
		echo "table{border-collapse:collapse;width:100%;margin:20px 0;}" >> /tmp/k6_report.py; \
		echo "th,td{border:1px solid #ddd;padding:12px;text-align:left;}" >> /tmp/k6_report.py; \
		echo "th{background-color:#f2f2f2;}" >> /tmp/k6_report.py; \
		echo ".pass{color:green;}.fail{color:red;}" >> /tmp/k6_report.py; \
		echo ".summary{background-color:#f9f9f9;padding:15px;margin:20px 0;border-radius:5px;}" >> /tmp/k6_report.py; \
		echo "</style></head><body>" >> /tmp/k6_report.py; \
		echo "<h1>K6 Performance Test Results</h1>" >> /tmp/k6_report.py; \
		echo "<div class=summary><h2>Test Summary</h2>" >> /tmp/k6_report.py; \
		echo "<p>Generated: ''' + str(datetime.datetime.now()) + '''</p></div>'''" >> /tmp/k6_report.py; \
		echo "html_content = html_start" >> /tmp/k6_report.py; \
		echo "for json_file in json_files:" >> /tmp/k6_report.py; \
		echo "    with open(json_file, 'r') as f:" >> /tmp/k6_report.py; \
		echo "        lines = f.readlines()" >> /tmp/k6_report.py; \
		echo "        test_name = os.path.basename(json_file).replace('.json', '')" >> /tmp/k6_report.py; \
		echo "        html_content += f'<h2>Test: {test_name}</h2>'" >> /tmp/k6_report.py; \
		echo "        html_content += '<table><tr><th>Metric</th><th>Value</th><th>Tags</th></tr>'" >> /tmp/k6_report.py; \
		echo "        for line in lines:" >> /tmp/k6_report.py; \
		echo "            try:" >> /tmp/k6_report.py; \
		echo "                data = json.loads(line)" >> /tmp/k6_report.py; \
		echo "                if data.get('type') == 'Point' and 'metric' in data:" >> /tmp/k6_report.py; \
		echo "                    metric_name = data['metric']" >> /tmp/k6_report.py; \
		echo "                    value = data.get('data', {}).get('value', 'N/A')" >> /tmp/k6_report.py; \
		echo "                    tags = str(data.get('data', {}).get('tags', {}))" >> /tmp/k6_report.py; \
		echo "                    html_content += f'<tr><td>{metric_name}</td><td>{value}</td><td>{tags}</td></tr>'" >> /tmp/k6_report.py; \
		echo "            except:" >> /tmp/k6_report.py; \
		echo "                pass" >> /tmp/k6_report.py; \
		echo "        html_content += '</table>'" >> /tmp/k6_report.py; \
		echo "html_content += '</body></html>'" >> /tmp/k6_report.py; \
		echo "with open(os.path.join(results_dir, 'k6-summary.html'), 'w') as f:" >> /tmp/k6_report.py; \
		echo "    f.write(html_content)" >> /tmp/k6_report.py; \
		echo "print('✅ Simple HTML report generated: k6-summary.html')" >> /tmp/k6_report.py; \
		python3 /tmp/k6_report.py; \
		rm /tmp/k6_report.py; \
	else \
		echo "⚠️  No JSON files found in $(K6_RESULTS_DIR)"; \
		echo "💡 Run some tests first (e.g., make k6-split-ramp)"; \
	fi

# --- Generate comprehensive JSON summary ---
k6-summary: k6-setup
	@echo "📊 Generating JSON summary..."
	@if ls $(K6_RESULTS_DIR)/*.json 1> /dev/null 2>&1; then \
		echo "import json, os, glob, datetime" > /tmp/k6_summary.py; \
		echo "results_dir = '$(K6_RESULTS_DIR)'" >> /tmp/k6_summary.py; \
		echo "json_files = glob.glob(os.path.join(results_dir, '*.json'))" >> /tmp/k6_summary.py; \
		echo "summary = {'generated': str(datetime.datetime.now()), 'tests': {}}" >> /tmp/k6_summary.py; \
		echo "for json_file in json_files:" >> /tmp/k6_summary.py; \
		echo "    test_name = os.path.basename(json_file).replace('.json', '')" >> /tmp/k6_summary.py; \
		echo "    summary['tests'][test_name] = {'metrics': {}, 'checks': {}}" >> /tmp/k6_summary.py; \
		echo "    with open(json_file, 'r') as f:" >> /tmp/k6_summary.py; \
		echo "        for line in f:" >> /tmp/k6_summary.py; \
		echo "            try:" >> /tmp/k6_summary.py; \
		echo "                data = json.loads(line)" >> /tmp/k6_summary.py; \
		echo "                if data.get('type') == 'Point' and 'metric' in data:" >> /tmp/k6_summary.py; \
		echo "                    metric_name = data['metric']" >> /tmp/k6_summary.py; \
		echo "                    value = data.get('data', {}).get('value')" >> /tmp/k6_summary.py; \
		echo "                    if value is not None:" >> /tmp/k6_summary.py; \
		echo "                        if metric_name not in summary['tests'][test_name]['metrics']:" >> /tmp/k6_summary.py; \
		echo "                            summary['tests'][test_name]['metrics'][metric_name] = []" >> /tmp/k6_summary.py; \
		echo "                        summary['tests'][test_name]['metrics'][metric_name].append(value)" >> /tmp/k6_summary.py; \
		echo "            except:" >> /tmp/k6_summary.py; \
		echo "                pass" >> /tmp/k6_summary.py; \
		echo "with open(os.path.join(results_dir, 'summary.json'), 'w') as f:" >> /tmp/k6_summary.py; \
		echo "    json.dump(summary, f, indent=2)" >> /tmp/k6_summary.py; \
		echo "print('✅ JSON summary generated: summary.json')" >> /tmp/k6_summary.py; \
		python3 /tmp/k6_summary.py; \
		rm /tmp/k6_summary.py; \
	else \
		echo "⚠️  No JSON files found in $(K6_RESULTS_DIR)"; \
	fi