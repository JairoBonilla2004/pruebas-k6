#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Script to generate master HTML report for all K6 test results
Usage: python3 generate_master_report.py <results_dir>
"""

import json
import os
import sys
import datetime
import glob


def process_k6_results(json_file):
    """Process K6 JSON results and extract metrics"""
    metrics = {}
    
    if not os.path.exists(json_file):
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


def generate_master_report(all_results, test_types, output_file):
    """Generate master HTML report"""
    html_content = f'''<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>K6 Master Performance Report</title>
    <style>
        * {{ margin: 0; padding: 0; box-sizing: border-box; }}
        body {{ font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); min-height: 100vh; padding: 20px; }}
        .container {{ max-width: 1400px; margin: 0 auto; }}
        .header {{ background: white; border-radius: 15px; padding: 40px; margin-bottom: 30px; box-shadow: 0 15px 35px rgba(0,0,0,0.1); text-align: center; }}
        .header h1 {{ color: #2c3e50; font-size: 3rem; margin-bottom: 15px; }}
        .section {{ background: white; border-radius: 15px; padding: 30px; margin-bottom: 25px; box-shadow: 0 15px 35px rgba(0,0,0,0.1); }}
        .section h2 {{ color: #2c3e50; margin-bottom: 25px; font-size: 1.8rem; border-bottom: 3px solid #3498db; padding-bottom: 10px; }}
        .test-type-grid {{ display: grid; grid-template-columns: repeat(auto-fit, minmax(400px, 1fr)); gap: 20px; margin-bottom: 30px; }}
        .test-type-card {{ background: linear-gradient(135deg, #74b9ff 0%, #0984e3 100%); color: white; padding: 25px; border-radius: 12px; text-align: center; }}
        .test-type-title {{ font-size: 1.5rem; font-weight: bold; margin-bottom: 15px; text-transform: uppercase; }}
        .test-type-stats {{ font-size: 1.1rem; }}
        .tests-grid {{ display: grid; grid-template-columns: repeat(auto-fit, minmax(350px, 1fr)); gap: 15px; }}
        .test-mini-card {{ background: #f8f9fa; border-left: 4px solid #3498db; padding: 15px; border-radius: 8px; }}
        .test-mini-title {{ font-weight: bold; color: #2c3e50; margin-bottom: 8px; }}
        .test-mini-stats {{ display: flex; justify-content: space-between; font-size: 0.9rem; color: #7f8c8d; }}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🚀 K6 Master Performance Report</h1>
            <p style="font-size: 1.2rem; color: #7f8c8d;">Complete Performance Testing Results</p>
            <p style="color: #7f8c8d;">Generated: {datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")}</p>
        </div>'''
    
    if all_results:
        total_tests = len(all_results)
        total_requests = sum(result.get('http_reqs', {}).get('count', 0) for result in all_results.values())
        overall_avg_time = sum(result.get('http_req_duration', {}).get('avg', 0) for result in all_results.values()) / total_tests if total_tests > 0 else 0
        
        html_content += f'''
        <div class="section">
            <h2>📊 Overall Summary</h2>
            <div class="test-type-grid">
                <div class="test-type-card">
                    <div class="test-type-title">Total Tests</div>
                    <div class="test-type-stats">{total_tests} Executed</div>
                </div>
                <div class="test-type-card">
                    <div class="test-type-title">Total Requests</div>
                    <div class="test-type-stats">{total_requests:,} Requests</div>
                </div>
                <div class="test-type-card">
                    <div class="test-type-title">Avg Response</div>
                    <div class="test-type-stats">{overall_avg_time:.2f}ms</div>
                </div>
            </div>
        </div>'''
        
        for test_type, test_list in test_types.items():
            if test_list:
                type_title = test_type.title()
                html_content += f'''
        <div class="section">
            <h2>⚡ {type_title} Tests ({len(test_list)} tests)</h2>
            <div class="tests-grid">'''
                
                for test_name in test_list:
                    if test_name in all_results:
                        stats = all_results[test_name]
                        clean_name = test_name.replace('-', ' ').title()
                        requests = int(stats.get('http_reqs', {}).get('count', 0))
                        avg_time = stats.get('http_req_duration', {}).get('avg', 0)
                        max_vus = int(stats.get('vus_max', {}).get('max', 0))
                        
                        html_content += f'''
                <div class="test-mini-card">
                    <div class="test-mini-title">{clean_name}</div>
                    <div class="test-mini-stats">
                        <span>{requests:,} reqs</span>
                        <span>{avg_time:.2f}ms avg</span>
                        <span>{max_vus} max VUs</span>
                    </div>
                </div>'''
                
                html_content += '''
            </div>
        </div>'''
    else:
        html_content += '''
        <div style="text-align: center; padding: 50px; color: white;">
            <h3>⚠️ No test results found</h3>
        </div>'''
    
    html_content += '''
    </div>
</body>
</html>'''
    
    try:
        with open(output_file, 'w', encoding='utf-8') as f:
            f.write(html_content)
        print(f"✅ Master performance report generated: {output_file}")
        return True
    except Exception as e:
        print(f"Error writing HTML file: {e}")
        return False


def main():
    if len(sys.argv) != 2:
        print("Usage: python3 generate_master_report.py <results_dir>")
        sys.exit(1)
    
    results_dir = sys.argv[1]
    
    print("📊 Generating master performance report...")
    
    # Find all JSON files
    json_files = glob.glob(os.path.join(results_dir, '*.json'))
    all_results = {}
    test_types = {'ramp': [], 'spike': [], 'soak': []}
    
    for json_file in json_files:
        test_name = os.path.basename(json_file).replace('.json', '')
        metrics = process_k6_results(json_file)
        summary_stats = calculate_summary(metrics)
        all_results[test_name] = summary_stats
        
        # Categorize by test type
        for test_type in test_types.keys():
            if test_type in test_name:
                test_types[test_type].append(test_name)
    
    output_file = os.path.join(results_dir, 'master-performance-report.html')
    
    if generate_master_report(all_results, test_types, output_file):
        print(f"📋 Master report available at: {output_file}")
    else:
        print("❌ Failed to generate master report")
        sys.exit(1)


if __name__ == "__main__":
    main()