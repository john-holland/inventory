-- ML Warehouse Schema for API Cron Job Optimization
-- This schema stores performance data for machine learning optimization of cron job frequencies

CREATE TABLE IF NOT EXISTS api_cron_job_specs (
    id SERIAL PRIMARY KEY,
    timestamp TIMESTAMP NOT NULL,
    market_volatility DECIMAL(5,4),
    rate_limit_remaining INTEGER,
    query_success_rate DECIMAL(3,2),
    response_time_avg DECIMAL(8,3),
    error_rate DECIMAL(3,2),
    optimal_frequency VARCHAR(20),
    current_gear VARCHAR(20),
    api_calls_made INTEGER,
    data_points_collected INTEGER,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_timestamp ON api_cron_job_specs(timestamp);
CREATE INDEX IF NOT EXISTS idx_current_gear ON api_cron_job_specs(current_gear);
CREATE INDEX IF NOT EXISTS idx_market_volatility ON api_cron_job_specs(market_volatility);

-- Table for storing ML model performance metrics
CREATE TABLE IF NOT EXISTS ml_model_performance (
    id SERIAL PRIMARY KEY,
    model_version VARCHAR(50) NOT NULL,
    accuracy DECIMAL(5,4),
    precision_score DECIMAL(5,4),
    recall_score DECIMAL(5,4),
    f1_score DECIMAL(5,4),
    training_date TIMESTAMP DEFAULT NOW(),
    training_samples INTEGER,
    notes TEXT
);

-- Table for storing cron job execution logs
CREATE TABLE IF NOT EXISTS cron_job_execution_logs (
    id SERIAL PRIMARY KEY,
    job_name VARCHAR(100) NOT NULL,
    execution_time TIMESTAMP NOT NULL,
    duration_seconds DECIMAL(8,3),
    status VARCHAR(20),
    gear_level VARCHAR(20),
    error_message TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_job_name ON cron_job_execution_logs(job_name);
CREATE INDEX IF NOT EXISTS idx_execution_time ON cron_job_execution_logs(execution_time);

-- Comments for documentation
COMMENT ON TABLE api_cron_job_specs IS 'Stores API cron job performance data for ML optimization';
COMMENT ON COLUMN api_cron_job_specs.market_volatility IS 'Market volatility score (0.0 - 1.0)';
COMMENT ON COLUMN api_cron_job_specs.rate_limit_remaining IS 'Remaining API quota (0 - 1000)';
COMMENT ON COLUMN api_cron_job_specs.query_success_rate IS 'Success rate of queries (0.0 - 1.0)';
COMMENT ON COLUMN api_cron_job_specs.response_time_avg IS 'Average response time in milliseconds';
COMMENT ON COLUMN api_cron_job_specs.error_rate IS 'Error rate (0.0 - 1.0)';
COMMENT ON COLUMN api_cron_job_specs.optimal_frequency IS 'Optimal cron frequency (low/medium/high/veryhigh)';
COMMENT ON COLUMN api_cron_job_specs.current_gear IS 'Current gear level (low/medium/high/emergency)';

