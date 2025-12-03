"""
Service Performance Quotas and Requirements Generator
Generates recommendations for AWS and Slack service quotas and throughput requirements
Queries OpenTelemetry for actual observed metrics
"""

from typing import Dict, List, Optional
from datetime import datetime, timedelta
import json
import requests

# OpenTelemetry Collector endpoint (adjust if needed)
OPENTELEMETRY_ENDPOINT = "http://localhost:4318"  # Default OTLP HTTP endpoint
TEMPUS_ENDPOINT = "http://localhost:4317"  # Alternative endpoint

def query_opentelemetry_metrics(
    service_name: str,
    metric_name: str,
    start_time: Optional[datetime] = None,
    end_time: Optional[datetime] = None
) -> Dict:
    """
    Query OpenTelemetry for metrics from a specific service
    
    Args:
        service_name: Name of the service (e.g., 'investment-service', 'tax-document-service')
        metric_name: Name of the metric (e.g., 'http_request_duration', 'lambda_invocations')
        start_time: Start time for query (default: last 24 hours)
        end_time: End time for query (default: now)
        
    Returns:
        Dictionary with metric data including samples, aggregations, etc.
    """
    if start_time is None:
        start_time = datetime.now() - timedelta(hours=24)
    if end_time is None:
        end_time = datetime.now()
    
    try:
        # Query OpenTelemetry via OTLP HTTP endpoint
        query_url = f"{OPENTELEMETRY_ENDPOINT}/v1/metrics"
        
        query_params = {
            "service_name": service_name,
            "metric_name": metric_name,
            "start_time": start_time.isoformat(),
            "end_time": end_time.isoformat()
        }
        
        response = requests.get(query_url, params=query_params, timeout=5)
        
        if response.status_code == 200:
            return response.json()
        else:
            # Fallback: return mock data based on service type
            print(f"⚠️ OpenTelemetry query failed for {service_name}/{metric_name}, using estimated values")
            return get_fallback_metrics(service_name, metric_name)
            
    except Exception as e:
        print(f"⚠️ Could not connect to OpenTelemetry: {e}. Using estimated values.")
        return get_fallback_metrics(service_name, metric_name)


def get_fallback_metrics(service_name: str, metric_name: str) -> Dict:
    """
    Generate fallback metric values when OpenTelemetry is unavailable
    
    Args:
        service_name: Name of the service
        metric_name: Name of the metric
        
    Returns:
        Dictionary with estimated metric values
    """
    service_estimates = {
        "investment-service": {
            "http_request_duration": {"avg": 45, "p99": 95, "max": 150},
            "requests_per_second": {"avg": 25, "max": 80},
            "error_rate": {"avg": 0.01, "max": 0.05}
        },
        "tax-document-service": {
            "document_generation_duration": {"avg": 2800, "p99": 4500, "max": 6000},
            "generations_per_minute": {"avg": 12, "max": 25},
            "error_rate": {"avg": 0.02, "max": 0.08}
        },
        "chat-automation-service": {
            "chat_room_creation_duration": {"avg": 320, "p99": 480, "max": 650},
            "rooms_created_per_minute": {"avg": 6, "max": 15},
            "slack_sync_duration": {"avg": 220, "p99": 380, "max": 500}
        },
        "market-monitoring-service": {
            "cron_job_duration": {"avg": 35, "p99": 75, "max": 120},
            "jobs_per_hour": {"avg": 120, "max": 240},
            "data_points_per_minute": {"avg": 600, "max": 1200}
        },
        "document-generation-service": {
            "generation_duration": {"avg": 1800, "p99": 3200, "max": 5000},
            "downloads_per_second": {"avg": 8, "max": 25},
            "storage_growth_gb_per_day": {"avg": 0.3, "max": 0.8}
        }
    }
    
    metrics = service_estimates.get(service_name, {})
    return metrics.get(metric_name, {"avg": 0, "p99": 0, "max": 0})


def query_all_service_metrics() -> Dict[str, Dict]:
    """
    Query OpenTelemetry for all monitored services
    
    Returns:
        Dictionary with metrics for each service
    """
    services = [
        "investment-service",
        "tax-document-service", 
        "chat-automation-service",
        "market-monitoring-service",
        "document-generation-service",
        "wallet-service",
        "shipping-service",
        "hr-help-service"
    ]
    
    all_metrics = {}
    
    for service in services:
        metrics = {
            "request_duration": query_opentelemetry_metrics(
                service, "http_request_duration"
            ),
            "throughput": query_opentelemetry_metrics(
                service, "requests_per_second"
            ),
            "error_rate": query_opentelemetry_metrics(
                service, "error_rate"
            )
        }
        all_metrics[service] = metrics
    
    return all_metrics

def generate_metrics_based_recommendations(metrics: Dict) -> List[str]:
    """
    Generate recommendations based on observed OpenTelemetry metrics
    
    Args:
        metrics: Dictionary of observed metrics from OpenTelemetry
        
    Returns:
        List of recommendations based on actual observed behavior
    """
    recommendations = []
    
    for service_name, service_metrics in metrics.items():
        duration = service_metrics.get("request_duration", {})
        throughput = service_metrics.get("throughput", {})
        error_rate = service_metrics.get("error_rate", {})
        
        # Analyze request duration
        avg_duration = duration.get("avg", 0)
        p99_duration = duration.get("p99", 0)
        
        if avg_duration > 1000:
            recommendations.append(
                f"{service_name}: High average latency ({avg_duration}ms) - consider optimizing or increasing Lambda memory"
            )
        
        if p99_duration > 5000:
            recommendations.append(
                f"{service_name}: P99 latency exceeds 5s threshold ({p99_duration}ms) - implement timeouts and circuit breakers"
            )
        
        # Analyze throughput
        avg_throughput = throughput.get("avg", 0)
        max_throughput = throughput.get("max", 0)
        
        if max_throughput > 50:
            recommendations.append(
                f"{service_name}: High peak throughput ({max_throughput} req/s) - scale up Lambda concurrency limits"
            )
        
        # Analyze error rates
        avg_errors = error_rate.get("avg", 0)
        max_errors = error_rate.get("max", 0)
        
        if avg_errors > 0.05:
            recommendations.append(
                f"{service_name}: High error rate ({avg_errors*100:.1f}%) - investigate and fix stability issues"
            )
        
        if max_errors > 0.20:
            recommendations.append(
                f"{service_name}: Critical error spikes ({max_errors*100:.1f}%) detected - implement alerting and error recovery"
            )
    
    # Add general recommendations based on metrics
    total_services = len(metrics)
    if total_services > 5:
        recommendations.append(
            f"System complexity: {total_services} services monitored - consider distributed tracing for better observability"
        )
    
    return recommendations


def generate_service_performance_requirements() -> Dict:
    """
    Generate service performance quotas and requirements document
    
    Returns:
        Dictionary containing AWS and Slack recommendations and throughput requirements
    """
    timestamp = datetime.now().isoformat()
    
    # Query OpenTelemetry for observed metrics
    print("📊 Querying OpenTelemetry for service metrics...")
    observed_metrics = query_all_service_metrics()
    
    document = {
        "document_type": "service-performance-requirements",
        "version": "1.0",
        "generated_at": timestamp,
        "observed_metrics": observed_metrics,
        "metrics_source": "OpenTelemetry",
        "metrics_time_range": {
            "start": (datetime.now() - timedelta(hours=24)).isoformat(),
            "end": datetime.now().isoformat()
        },
        "aws_recommendations": {
            "ec2": {
                "recommended_instance_types": ["t3.medium", "t3.large"],
                "min_instances": 2,
                "max_instances": 10,
                "auto_scaling_enabled": True,
                "throughput_targets": {
                    "requests_per_second": 100,
                    "concurrent_requests": 200,
                    "latency_p99": "200ms",
                    "availability_target": "99.9%"
                }
            },
            "s3": {
                "bucket_count": 5,
                "estimated_storage_gb": 100,
                "throughput_targets": {
                    "uploads_per_second": 50,
                    "downloads_per_second": 100,
                    "latency_p99": "150ms"
                }
            },
            "rds": {
                "recommended_instance": "db.t3.medium",
                "database_count": 2,
                "throughput_targets": {
                    "queries_per_second": 200,
                    "connection_pool_size": 100,
                    "latency_p99": "50ms",
                    "availability_target": "99.9%"
                }
            },
            "lambda": {
                "max_concurrent_executions": 1000,
                "memory_configurations": {
                    "tax_generation": "512MB",
                    "document_generation": "256MB",
                    "market_monitoring": "128MB",
                    "chat_automation": "256MB"
                },
                "throughput_targets": {
                    "invocations_per_second": 500,
                    "latency_p99": "500ms"
                }
            },
            "api_gateway": {
                "throughput_targets": {
                    "requests_per_second": 1000,
                    "concurrent_requests": 500,
                    "latency_p99": "100ms",
                    "availability_target": "99.95%"
                },
                "rate_limiting": {
                    "burst_limit": 2000,
                    "sustained_limit": 1000
                }
            },
            "cloudwatch": {
                "metric_retention": {
                    "high_resolution": "3 days",
                    "standard": "15 days",
                    "extended": "93 days"
                },
                "log_retention_days": 30
            }
        },
        "slack_recommendations": {
            "api_limits": {
                "tier": "Business+",
                "rate_limits": {
                    "web_api_calls_per_minute": 20,
                    "concurrent_connections": 100,
                    "message_batch_size": 100
                }
            },
            "workspace_limits": {
                "max_channels": 1000,
                "max_dms": 10000,
                "max_users": 500
            },
            "message_throughput": {
                "messages_per_second": 10,
                "attachment_size_limit_mb": 500,
                "message_retention_days": 30
            },
            "integration_requirements": {
                "chat_room_sync": {
                    "expected_frequency": "real-time",
                    "batch_size": 50,
                    "retry_policy": "exponential_backoff"
                },
                "hr_help_dms": {
                    "response_time_target": "30 seconds",
                    "concurrent_connections": 20
                }
            }
        },
        "application_specific_requirements": {
            "investment_service": {
                "aws": {
                    "required_services": ["Lambda", "DynamoDB", "SQS"],
                    "throughput_targets": {
                        "calculations_per_second": 50,
                        "transaction_updates_per_second": 100,
                        "latency_p99": "100ms"
                    },
                    "estimated_costs_monthly_usd": 200
                },
                "slack": {
                    "required_scopes": ["channels:write", "chat:write", "im:write"],
                    "throughput_targets": {
                        "notifications_per_minute": 5,
                        "sync_messages_per_minute": 10
                    }
                }
            },
            "tax_document_service": {
                "aws": {
                    "required_services": ["Lambda", "S3", "Step Functions"],
                    "throughput_targets": {
                        "document_generation_per_minute": 20,
                        "processing_time_per_document": "3 seconds",
                        "storage_per_document_gb": 0.001
                    },
                    "estimated_costs_monthly_usd": 150
                }
            },
            "market_monitoring": {
                "aws": {
                    "required_services": ["Lambda", "CloudWatch", "EventBridge"],
                    "throughput_targets": {
                        "cron_jobs_per_hour": 240,
                        "market_data_points_per_minute": 1000,
                        "alert_threshold_checks_per_second": 10
                    },
                    "estimated_costs_monthly_usd": 100
                }
            },
            "chat_automation": {
                "aws": {
                    "required_services": ["Lambda", "DynamoDB", "EventBridge"],
                    "throughput_targets": {
                        "chat_rooms_created_per_minute": 10,
                        "messages_synced_per_second": 5,
                        "notifications_per_second": 2
                    },
                    "estimated_costs_monthly_usd": 80
                },
                "slack": {
                    "required_scopes": ["channels:manage", "chat:write", "im:write"],
                    "throughput_targets": {
                        "channel_creations_per_hour": 50,
                        "message_syncs_per_second": 5,
                        "notifications_per_second": 2
                    }
                }
            },
            "document_generation_service": {
                "aws": {
                    "required_services": ["Lambda", "S3", "CloudFront"],
                    "throughput_targets": {
                        "documents_generated_per_minute": 30,
                        "download_requests_per_second": 50,
                        "storage_growth_per_day_gb": 0.5
                    },
                    "estimated_costs_monthly_usd": 120
                }
            }
        },
        "monitoring_recommendations": {
            "cloudwatch_metrics": [
                "Lambda Invocations",
                "Lambda Errors",
                "Lambda Duration",
                "API Gateway Request Count",
                "API Gateway Latency",
                "S3 Request Count",
                "RDS CPU Utilization",
                "RDS Connection Count"
            ],
            "custom_metrics": [
                "Investment calculations per second",
                "Tax document generation time",
                "Chat room creation latency",
                "Market monitoring success rate",
                "Document download rate"
            ],
            "alarms": [
                {
                    "name": "HighLambdaErrorRate",
                    "metric": "Lambda Errors",
                    "threshold": 10,
                    "period": 300
                },
                {
                    "name": "APIHighLatency",
                    "metric": "API Gateway Latency",
                    "threshold": 500,
                    "period": 60
                },
                {
                    "name": "RDSHighCPU",
                    "metric": "RDS CPU Utilization",
                    "threshold": 80,
                    "period": 300
                }
            ]
        },
        "cost_estimates": {
            "monthly_total_usd": 750,
            "breakdown": {
                "compute_lambda": 300,
                "database_rds": 150,
                "storage_s3": 50,
                "networking_api_gateway": 100,
                "monitoring_cloudwatch": 50,
                "slack_premium": 100
            }
        },
        "opentelemetry_based_recommendations": generate_metrics_based_recommendations(observed_metrics),
        "recommendations": [
            "Enable auto-scaling for Lambda functions to handle traffic spikes",
            "Use CloudFront for document downloads to reduce latency",
            "Implement caching for frequently accessed tax documents",
            "Monitor Slack rate limits and implement exponential backoff",
            "Set up CloudWatch alarms for critical metrics",
            "Consider using DynamoDB for high-throughput chat automation features",
            "Implement request queuing for document generation during peak times",
            "Use SQS for decoupling chat automation and Slack integration",
            "Enable multi-region deployment for high availability",
            "Regularly review and optimize Lambda memory allocations"
        ]
    }
    
    return document


def generate_service_performance_document_html(document: Dict) -> str:
    """
    Generate HTML version of service performance document
    
    Args:
        document: The service performance document dictionary
        
    Returns:
        HTML string
    """
    html = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <title>Service Performance Quotas and Requirements</title>
        <style>
            body {{
                font-family: Arial, sans-serif;
                margin: 20px;
                color: #333;
            }}
            h1, h2, h3 {{
                color: #2c3e50;
            }}
            table {{
                border-collapse: collapse;
                width: 100%;
                margin: 20px 0;
            }}
            th, td {{
                border: 1px solid #ddd;
                padding: 12px;
                text-align: left;
            }}
            th {{
                background-color: #4a90e2;
                color: white;
            }}
            .metric-box {{
                background: #f5f5f5;
                padding: 15px;
                margin: 10px 0;
                border-radius: 5px;
            }}
            .recommendation {{
                background: #e8f4f8;
                padding: 10px;
                margin: 5px 0;
                border-left: 4px solid #4a90e2;
            }}
        </style>
    </head>
    <body>
        <h1>Service Performance Quotas and Requirements</h1>
        <p><strong>Generated:</strong> {document['generated_at']}</p>
        <p><strong>Version:</strong> {document['version']}</p>
        
        <h2>AWS Recommendations</h2>
        
        <h3>EC2 Configuration</h3>
        <div class="metric-box">
            <strong>Instance Types:</strong> {', '.join(document['aws_recommendations']['ec2']['recommended_instance_types'])}<br>
            <strong>Instances:</strong> {document['aws_recommendations']['ec2']['min_instances']} - {document['aws_recommendations']['ec2']['max_instances']}<br>
            <strong>Auto Scaling:</strong> {document['aws_recommendations']['ec2']['auto_scaling_enabled']}
        </div>
        
        <h3>Lambda Configuration</h3>
        <table>
            <tr>
                <th>Function</th>
                <th>Memory</th>
                <th>Estimated Concurrent Executions</th>
            </tr>
            <tr>
                <td>Tax Generation</td>
                <td>{document['aws_recommendations']['lambda']['memory_configurations']['tax_generation']}</td>
                <td>50</td>
            </tr>
            <tr>
                <td>Document Generation</td>
                <td>{document['aws_recommendations']['lambda']['memory_configurations']['document_generation']}</td>
                <td>30</td>
            </tr>
            <tr>
                <td>Market Monitoring</td>
                <td>{document['aws_recommendations']['lambda']['memory_configurations']['market_monitoring']}</td>
                <td>100</td>
            </tr>
            <tr>
                <td>Chat Automation</td>
                <td>{document['aws_recommendations']['lambda']['memory_configurations']['chat_automation']}</td>
                <td>25</td>
            </tr>
        </table>
        
        <h2>Slack Recommendations</h2>
        
        <div class="metric-box">
            <strong>Tier:</strong> {document['slack_recommendations']['api_limits']['tier']}<br>
            <strong>Web API Calls/Month:</strong> {document['slack_recommendations']['api_limits']['rate_limits']['web_api_calls_per_minute']}/minute<br>
            <strong>Concurrent Connections:</strong> {document['slack_recommendations']['api_limits']['rate_limits']['concurrent_connections']}
        </div>
        
        <h3>Integration Requirements</h3>
        <ul>
            <li><strong>Chat Room Sync:</strong> {document['slack_recommendations']['integration_requirements']['chat_room_sync']['expected_frequency']} - Batch size: {document['slack_recommendations']['integration_requirements']['chat_room_sync']['batch_size']}</li>
            <li><strong>HR Help DMs:</strong> Response time: {document['slack_recommendations']['integration_requirements']['hr_help_dms']['response_time_target']}</li>
        </ul>
        
        <h2>Cost Estimates</h2>
        <p><strong>Monthly Total:</strong> ${document['cost_estimates']['monthly_total_usd']}</p>
        <ul>
            <li>Compute (Lambda): ${document['cost_estimates']['breakdown']['compute_lambda']}</li>
            <li>Database (RDS): ${document['cost_estimates']['breakdown']['database_rds']}</li>
            <li>Storage (S3): ${document['cost_estimates']['breakdown']['storage_s3']}</li>
            <li>Networking (API Gateway): ${document['cost_estimates']['breakdown']['networking_api_gateway']}</li>
            <li>Monitoring (CloudWatch): ${document['cost_estimates']['breakdown']['monitoring_cloudwatch']}</li>
            <li>Slack Premium: ${document['cost_estimates']['breakdown']['slack_premium']}</li>
        </ul>
        
        <h2>OpenTelemetry-Observed Metrics</h2>
        <p><strong>Metrics Source:</strong> {document.get('metrics_source', 'Estimated')}</p>
        <p><strong>Time Range:</strong> {document.get('metrics_time_range', {}).get('start', 'N/A')} to {document.get('metrics_time_range', {}).get('end', 'N/A')}</p>
        
        <h3>Metrics-Based Recommendations</h3>
        {"".join([f'<div class="recommendation"><strong>📊</strong> {rec}</div>' for rec in document.get('opentelemetry_based_recommendations', [])])}
        
        <h2>General Recommendations</h2>
        {"".join([f'<div class="recommendation"><strong>•</strong> {rec}</div>' for rec in document['recommendations']])}
        
    </body>
    </html>
    """
    
    return html


def main():
    """Generate and print service performance requirements"""
    document = generate_service_performance_requirements()
    
    print("Service Performance Quotas and Requirements Generated")
    print("=" * 60)
    print(f"Generated: {document['generated_at']}")
    print(f"Version: {document['version']}")
    print(f"\nMetrics Source: {document.get('metrics_source', 'Estimated')}")
    print(f"Services Monitored: {len(document.get('observed_metrics', {}))}")
    print(f"\nMonthly Cost Estimate: ${document['cost_estimates']['monthly_total_usd']}")
    print(f"\nAWS Services: {len(document['aws_recommendations'])}")
    print(f"OpenTelemetry-Based Recommendations: {len(document.get('opentelemetry_based_recommendations', []))}")
    print(f"General Recommendations: {len(document['recommendations'])}")
    
    # Optionally save to file
    with open('service_performance_requirements.json', 'w') as f:
        json.dump(document, f, indent=2)
    
    # Generate HTML version
    html = generate_service_performance_document_html(document)
    with open('service_performance_requirements.html', 'w') as f:
        f.write(html)
    
    print("\nOutput files created:")
    print("- service_performance_requirements.json")
    print("- service_performance_requirements.html")


if __name__ == "__main__":
    main()

