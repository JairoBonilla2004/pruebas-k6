#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Script to generate CI artifacts for K6 test results
Usage: python3 generate_ci_artifacts.py <results_dir>
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


def generate_ci_summary(all_results, output_file):
    """Generate CI summary JSON"""
    summary_data = {
        'timestamp': datetime.datetime.now().isoformat(),
        'total_tests': len(all_results),
        'tests': [],
        'metrics': {
            'total_requests': 0,
            'avg_response_time': 0,
            'total_failures': 0,
            'success_rate': 0
        }
    }
    
    total_requests = 0
    total_response_time = 0
    total_failures = 0
    
    for test_name, stats in all_results.items():
        test_requests = stats.get('http_reqs', {}).get('count', 0)
        test_avg_time = stats.get('http_req_duration', {}).get('avg', 0)
        test_fail_rate = stats.get('http_req_failed', {}).get('avg', 0)
        test_failures = int(test_requests * test_fail_rate) if test_fail_rate <= 1 else int(test_fail_rate)
        
        total_requests += test_requests
        total_response_time += test_avg_time
        total_failures += test_failures
        
        test_data = {
            'name': test_name,
            'requests': int(test_requests),
            'avg_response_time': round(test_avg_time, 2),
            'failures': test_failures,
            'success_rate': round((1 - test_fail_rate) * 100, 2) if test_fail_rate <= 1 else 0,
            'max_vus': int(stats.get('vus_max', {}).get('max', 0))
        }
        summary_data['tests'].append(test_data)
    
    # Calculate overall metrics
    if len(all_results) > 0:
        summary_data['metrics']['total_requests'] = int(total_requests)
        summary_data['metrics']['avg_response_time'] = round(total_response_time / len(all_results), 2)
        summary_data['metrics']['total_failures'] = int(total_failures)
        summary_data['metrics']['success_rate'] = round(((total_requests - total_failures) / total_requests) * 100, 2) if total_requests > 0 else 0
    
    try:
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(summary_data, f, indent=2)
        print(f"✅ CI summary generated: {output_file}")
        return True
    except Exception as e:
        print(f"Error writing summary file: {e}")
        return False


def generate_ci_html_report(all_results, output_file):
    """Generate simple HTML report for CI"""
    html_content = f'''<!DOCTYPE html>
<html>
<head>
    <title>K6 Performance Test Results</title>
    <meta charset="UTF-8">
    <style>
        body {{ font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }}
        .container {{ max-width: 1000px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }}
        .header {{ text-align: center; margin-bottom: 30px; }}
        .header h1 {{ color: #333; margin-bottom: 10px; }}
        .summary {{ display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 30px; }}
        .summary-card {{ background: #007bff; color: white; padding: 20px; border-radius: 8px; text-align: center; }}
        .summary-card h3 {{ margin: 0 0 10px 0; font-size: 2rem; }}
        .summary-card p {{ margin: 0; opacity: 0.9; }}
        .tests-table {{ width: 100%; border-collapse: collapse; margin-top: 20px; }}
        .tests-table th, .tests-table td {{ padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }}
        .tests-table th {{ background-color: #f8f9fa; font-weight: bold; }}
        .tests-table tr:hover {{ background-color: #f5f5f5; }}
        .success {{ color: #28a745; font-weight: bold; }}
        .warning {{ color: #ffc107; font-weight: bold; }}
        .danger {{ color: #dc3545; font-weight: bold; }}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🚀 K6 Performance Test Results</h1>
            <p>Generated: {datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")}</p>
        </div>'''
    
    if all_results:
        total_tests = len(all_results)
        total_requests = sum(result.get('http_reqs', {}).get('count', 0) for result in all_results.values())
        avg_response_time = sum(result.get('http_req_duration', {}).get('avg', 0) for result in all_results.values()) / total_tests if total_tests > 0 else 0
        total_failures = sum(int(result.get('http_reqs', {}).get('count', 0) * result.get('http_req_failed', {}).get('avg', 0)) for result in all_results.values())
        success_rate = ((total_requests - total_failures) / total_requests) * 100 if total_requests > 0 else 0
        
        html_content += f'''
        <div class="summary">
            <div class="summary-card">
                <h3>{total_tests}</h3>
                <p>Tests Executed</p>
            </div>
            <div class="summary-card">
                <h3>{total_requests:,}</h3>
                <p>Total Requests</p>
            </div>
            <div class="summary-card">
                <h3>{avg_response_time:.2f}ms</h3>
                <p>Avg Response Time</p>
            </div>
            <div class="summary-card">
                <h3>{success_rate:.1f}%</h3>
                <p>Success Rate</p>
            </div>
        </div>
        
        <table class="tests-table">
            <thead>
                <tr>
                    <th>Test Name</th>
                    <th>Requests</th>
                    <th>Avg Response Time</th>
                    <th>Success Rate</th>
                    <th>Max VUs</th>
                </tr>
            </thead>
            <tbody>'''
        
        for test_name, stats in sorted(all_results.items()):
            clean_name = test_name.replace('-', ' ').title()
            requests = int(stats.get('http_reqs', {}).get('count', 0))
            avg_time = stats.get('http_req_duration', {}).get('avg', 0)
            fail_rate = stats.get('http_req_failed', {}).get('avg', 0)
            success_rate = (1 - fail_rate) * 100 if fail_rate <= 1 else 0
            max_vus = int(stats.get('vus_max', {}).get('max', 0))
            
            # Determine status class
            status_class = 'success' if success_rate >= 95 else ('warning' if success_rate >= 80 else 'danger')
            
            html_content += f'''
                <tr>
                    <td>{clean_name}</td>
                    <td>{requests:,}</td>
                    <td>{avg_time:.2f}ms</td>
                    <td class="{status_class}">{success_rate:.1f}%</td>
                    <td>{max_vus}</td>
                </tr>'''
        
        html_content += '''
            </tbody>
        </table>'''
    else:
        html_content += '''
        <div style="text-align: center; padding: 50px;">
            <h3>⚠️ No test results found</h3>
        </div>'''
    
    html_content += '''
    </div>
</body>
</html>'''
    
    try:
        with open(output_file, 'w', encoding='utf-8') as f:
            f.write(html_content)
        print(f" CI HTML report generated: {output_file}")
        return True
    except Exception as e:
        print(f"Error writing HTML file: {e}")
        return False


def main():
    if len(sys.argv) != 2:
        print("Usage: python3 generate_ci_artifacts.py <results_dir>")
        sys.exit(1)
    
    results_dir = sys.argv[1]
    ci_dir = os.path.join(results_dir, 'ci')
    artifacts_dir = os.path.join(ci_dir, 'artifacts')
    
    # Create CI directories
    os.makedirs(ci_dir, exist_ok=True)
    os.makedirs(artifacts_dir, exist_ok=True)
    
    print(" Generating CI artifacts...")
    
    # Find all JSON files
    json_files = glob.glob(os.path.join(results_dir, '*.json'))
    all_results = {}
    
    for json_file in json_files:
        # Skip files in ci directory
        if 'ci/' in json_file:
            continue
            
        test_name = os.path.basename(json_file).replace('.json', '')
        metrics = process_k6_results(json_file)
        summary_stats = calculate_summary(metrics)
        all_results[test_name] = summary_stats
    
    # Generate CI summary JSON
    summary_file = os.path.join(ci_dir, 'summary.json')
    if not generate_ci_summary(all_results, summary_file):
        sys.exit(1)
    
    # Generate CI HTML report
    html_file = os.path.join(artifacts_dir, 'report.html')
    if not generate_ci_html_report(all_results, html_file):
        sys.exit(1)
    
    print(" CI Artifacts ready:")
    print(f"  - Summary: {summary_file}")
    print(f"  - HTML Report: {html_file}")


if __name__ == "__main__":
    main()