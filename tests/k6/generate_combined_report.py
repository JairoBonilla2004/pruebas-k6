#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Script to generate combined HTML report for K6 test results
Usage: python3 generate_combined_report.py <results_dir> <test_type>
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


def generate_combined_report(test_type, all_results, output_file):
    """Generate combined HTML report"""
    html_content = f'''<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>K6 Combined Report - {test_type.title()} Tests</title>
    <style>
        * {{ margin: 0; padding: 0; box-sizing: border-box; }}
        body {{ font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); min-height: 100vh; padding: 20px; }}
        .container {{ max-width: 1200px; margin: 0 auto; }}
        .header {{ background: white; border-radius: 15px; padding: 30px; margin-bottom: 25px; box-shadow: 0 15px 35px rgba(0,0,0,0.1); text-align: center; }}
        .header h1 {{ color: #2c3e50; font-size: 2.5rem; margin-bottom: 10px; }}
        .test-grid {{ display: grid; grid-template-columns: repeat(auto-fit, minmax(400px, 1fr)); gap: 20px; }}
        .test-card {{ background: white; border-radius: 15px; padding: 25px; box-shadow: 0 15px 35px rgba(0,0,0,0.1); transition: transform 0.3s ease; }}
        .test-card:hover {{ transform: translateY(-5px); }}
        .test-card h2 {{ color: #2c3e50; margin-bottom: 20px; font-size: 1.4rem; border-bottom: 3px solid #3498db; padding-bottom: 10px; }}
        .metrics-row {{ display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 15px; }}
        .metric-box {{ background: linear-gradient(135deg, #74b9ff 0%, #0984e3 100%); color: white; padding: 15px; border-radius: 8px; text-align: center; }}
        .metric-value {{ font-size: 1.5rem; font-weight: bold; display: block; }}
        .metric-label {{ font-size: 0.8rem; opacity: 0.9; }}
        .summary {{ background: white; border-radius: 15px; padding: 25px; margin-bottom: 25px; box-shadow: 0 15px 35px rgba(0,0,0,0.1); }}
        .summary-grid {{ display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; }}
        .summary-stat {{ background: linear-gradient(135deg, #00b894 0%, #00a085 100%); color: white; padding: 20px; border-radius: 10px; text-align: center; }}
        .summary-number {{ font-size: 2rem; font-weight: bold; display: block; }}
        .summary-label {{ font-size: 0.9rem; opacity: 0.9; }}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>📊 K6 {test_type.title()} Tests Report</h1>
            <p>Generated: {datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")}</p>
        </div>'''
    
    if all_results:
        total_tests = len(all_results)
        total_requests = sum(result.get('http_reqs', {}).get('count', 0) for result in all_results.values())
        avg_response_time = sum(result.get('http_req_duration', {}).get('avg', 0) for result in all_results.values()) / total_tests if total_tests > 0 else 0
        
        html_content += f'''
        <div class="summary">
            <h2>📈 Summary</h2>
            <div class="summary-grid">
                <div class="summary-stat">
                    <span class="summary-number">{total_tests}</span>
                    <span class="summary-label">Tests Executed</span>
                </div>
                <div class="summary-stat">
                    <span class="summary-number">{total_requests:,}</span>
                    <span class="summary-label">Total Requests</span>
                </div>
                <div class="summary-stat">
                    <span class="summary-number">{avg_response_time:.2f}ms</span>
                    <span class="summary-label">Avg Response Time</span>
                </div>
            </div>
        </div>
        <div class="test-grid">'''
        
        for test_name, stats in all_results.items():
            clean_name = test_name.replace('-', ' ').title()
            html_content += f'''
            <div class="test-card">
                <h2>{clean_name}</h2>
                <div class="metrics-row">'''
            
            if 'http_reqs' in stats:
                count = int(stats['http_reqs']['count'])
                html_content += f'''
                    <div class="metric-box">
                        <span class="metric-value">{count:,}</span>
                        <span class="metric-label">Requests</span>
                    </div>'''
            
            if 'http_req_duration' in stats:
                avg_time = stats['http_req_duration']['avg']
                html_content += f'''
                    <div class="metric-box">
                        <span class="metric-value">{avg_time:.2f}ms</span>
                        <span class="metric-label">Avg Time</span>
                    </div>'''
            
            if 'vus_max' in stats:
                max_vus = int(stats['vus_max']['max'])
                html_content += f'''
                    <div class="metric-box">
                        <span class="metric-value">{max_vus}</span>
                        <span class="metric-label">Max VUs</span>
                    </div>'''
            
            html_content += '''
                </div>
            </div>'''
        
        html_content += '''
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
        print(f"✅ Combined {test_type} report generated: {output_file}")
        return True
    except Exception as e:
        print(f"Error writing HTML file: {e}")
        return False


def main():
    if len(sys.argv) != 3:
        print("Usage: python3 generate_combined_report.py <results_dir> <test_type>")
        sys.exit(1)
    
    results_dir = sys.argv[1]
    test_type = sys.argv[2]
    
    print(f"📊 Generating combined {test_type} report...")
    
    # Find all JSON files for this test type
    pattern = os.path.join(results_dir, f"*-{test_type}.json")
    json_files = glob.glob(pattern)
    
    all_results = {}
    
    for json_file in json_files:
        test_name = os.path.basename(json_file).replace('.json', '')
        metrics = process_k6_results(json_file)
        summary_stats = calculate_summary(metrics)
        all_results[test_name] = summary_stats
    
    output_file = os.path.join(results_dir, f"combined-{test_type}-report.html")
    
    if generate_combined_report(test_type, all_results, output_file):
        print(f"📋 Combined report available at: {output_file}")
    else:
        print("❌ Failed to generate combined report")
        sys.exit(1)


if __name__ == "__main__":
    main()