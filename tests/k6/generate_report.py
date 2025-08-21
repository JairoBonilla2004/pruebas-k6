#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Script to generate HTML report for K6 test results
Usage: python3 generate_report.py <results_dir> <test_name>
"""

import json
import os
import sys
import datetime


def process_k6_results(json_file):
    """Process K6 JSON results and extract metrics"""
    metrics = {}
    
    if not os.path.exists(json_file):
        print(f"Warning: JSON file not found: {json_file}")
        return metrics
    
    try:
        with open(json_file, 'r', encoding='utf-8') as f:
            for line in f:
                try:
                    data = json.loads(line.strip())
                    if data.get('type') == 'Point':
                        metric = data.get('metric', '')
                        value = data.get('data', {}).get('value', 0)
                        if metric not in metrics:
                            metrics[metric] = []
                        metrics[metric].append(value)
                except json.JSONDecodeError:
                    continue
    except Exception as e:
        print(f"Error processing file {json_file}: {e}")
        return {}
    
    return metrics


def calculate_summary(metrics):
    """Calculate summary statistics from metrics"""
    summary = {}
    for metric, values in metrics.items():
        if values:
            summary[metric] = {
                'count': len(values),
                'min': min(values),
                'max': max(values),
                'avg': sum(values) / len(values)
            }
    return summary


def generate_html_report(test_name, summary, output_file):
    """Generate HTML report"""
    total_reqs = summary.get('http_reqs', {}).get('count', 0)
    failed_rate = summary.get('http_req_failed', {}).get('avg', 0)
    success_rate = (1 - failed_rate) * 100 if failed_rate <= 1 else 0
    status = "PASSED" if success_rate > 50 else "FAILED"
    
    status_class = "passed" if status == "PASSED" else "failed"
    status_icon = "✅ PASSED" if status == "PASSED" else "❌ FAILED"
    
    html_content = f'''<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>K6 Report - {test_name}</title>
    <style>
        * {{margin: 0; padding: 0; box-sizing: border-box}}
        body {{font-family: system-ui, sans-serif; background: linear-gradient(135deg, #667eea, #764ba2); min-height: 100vh; padding: 20px}}
        .container {{max-width: 1000px; margin: 0 auto}}
        .card {{background: white; border-radius: 15px; padding: 30px; margin: 20px 0; box-shadow: 0 10px 30px rgba(0,0,0,0.1)}}
        .header {{text-align: center}}
        .status {{display: inline-block; padding: 8px 20px; border-radius: 20px; color: white; font-weight: bold; margin: 10px 0}}
        .passed {{background: #27ae60}}
        .failed {{background: #e74c3c}}
        .grid {{display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px}}
        .metric {{background: linear-gradient(135deg, #74b9ff, #0984e3); color: white; padding: 20px; border-radius: 12px; text-align: center}}
        .metric-value {{font-size: 1.8rem; font-weight: bold; display: block}}
        .metric-label {{font-size: 0.9rem; opacity: 0.9}}
    </style>
</head>
<body>
    <div class="container">
        <div class="card header">
            <h1>📊 K6 Test Report</h1>
            <p><strong>{test_name}</strong></p>
            <div class="status {status_class}">{status_icon}</div>
            <p>{datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")}</p>
        </div>
        <div class="card">
            <div class="grid">'''
    
    # Add metrics
    if 'http_reqs' in summary:
        count = int(summary['http_reqs']['count'])
        html_content += f'''
                <div class="metric">
                    <span class="metric-value">{count:,}</span>
                    <span class="metric-label">Total Requests</span>
                </div>'''
    
    if 'http_req_duration' in summary:
        avg_time = round(summary['http_req_duration']['avg'], 2)
        html_content += f'''
                <div class="metric">
                    <span class="metric-value">{avg_time}ms</span>
                    <span class="metric-label">Avg Response Time</span>
                </div>'''
    
    if 'http_req_failed' in summary:
        fail_rate = summary['http_req_failed']['avg']
        fail_pct = round(fail_rate * 100, 2) if fail_rate <= 1 else round(fail_rate, 2)
        html_content += f'''
                <div class="metric">
                    <span class="metric-value">{fail_pct}%</span>
                    <span class="metric-label">Failed Requests</span>
                </div>'''
    
    if 'vus_max' in summary:
        max_vus = int(summary['vus_max']['max'])
        html_content += f'''
                <div class="metric">
                    <span class="metric-value">{max_vus}</span>
                    <span class="metric-label">Max Virtual Users</span>
                </div>'''
    
    html_content += f'''
            </div>
            <div style="text-align:center;margin-top:20px;padding:20px;background:#f8f9fa;border-radius:10px">
                <h3>📈 Summary</h3>
                <p>Requests: <strong>{int(total_reqs):,}</strong> | Success Rate: <strong>{round(success_rate, 1)}%</strong></p>
            </div>
        </div>
    </div>
</body>
</html>'''
    
    try:
        with open(output_file, 'w', encoding='utf-8') as f:
            f.write(html_content)
        print(f"✅ HTML report generated: {os.path.basename(output_file)}")
        return True
    except Exception as e:
        print(f"Error writing HTML file: {e}")
        return False


def main():
    if len(sys.argv) != 3:
        print("Usage: python3 generate_report.py <results_dir> <test_name>")
        sys.exit(1)
    
    results_dir = sys.argv[1]
    test_name = sys.argv[2]
    
    json_file = os.path.join(results_dir, f"{test_name}.json")
    html_file = os.path.join(results_dir, f"{test_name}-report.html")
    
    print(f"📁 Processing: {json_file}")
    
    # Process K6 results
    metrics = process_k6_results(json_file)
    print(f"✅ Metrics found: {len(metrics)}")
    
    # Calculate summary
    summary = calculate_summary(metrics)
    
    # Generate HTML report
    if generate_html_report(test_name, summary, html_file):
        print(f"📋 Report available at: {html_file}")
    else:
        print("❌ Failed to generate report")
        sys.exit(1)


if __name__ == "__main__":
    main()