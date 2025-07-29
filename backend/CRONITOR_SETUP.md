# Cronitor Setup Guide for PdfPage Keep-Alive System

This guide explains how to set up Cronitor monitoring for the keep-alive cron job that prevents your Render server from sleeping.

## Overview

The system includes:

- **Cron Job**: Runs every 14 minutes to ping the server
- **Cronitor Integration**: Monitors cron job health and sends alerts
- **Health Endpoints**: Multiple endpoints for monitoring server status

## Cronitor Dashboard Setup

### 1. Create a Cronitor Account

1. Go to [https://cronitor.io](https://cronitor.io)
2. Sign up or log in to your account
3. Navigate to your dashboard

### 2. Create a New Monitor

#### Option A: Using the Dashboard (Recommended)

1. Click "Add Monitor" in your Cronitor dashboard
2. Select "Cron Job" monitor type
3. Configure the monitor:
   - **Name**: `PdfPage Keep-Alive`
   - **Schedule**: `*/14 * * * *` (every 14 minutes)
   - **Timezone**: `UTC`
   - **Grace Period**: `5 minutes`
   - **Alert Policy**: Choose your notification preferences

#### Option B: Using the API

You can create the monitor programmatically:

```bash
curl -X POST https://cronitor.io/api/monitors \
  -H "Authorization: b612058cd75c4f23a6f7674fb9e8c09c" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "PdfPage Keep-Alive",
    "type": "job",
    "schedule": "*/14 * * * *",
    "timezone": "UTC",
    "grace_period": 5,
    "alert_policy": ["default"]
  }'
```

### 3. Get Your Monitor Key

After creating the monitor, you'll receive a **Monitor Key** (e.g., `abc123`). This is what you'll use in your environment variables.

## Environment Variables Setup

Add these environment variables to your Render deployment:

```bash
# Cronitor Configuration
CRONITOR_API_KEY=b612058cd75c4f23a6f7674fb9e8c09c
CRONITOR_MONITOR_KEY=your-monitor-key-here  # Replace with actual key from dashboard

# Server Configuration
RENDER_SERVER_URL=https://pdf-backend-935131444417.asia-south1.run.app
NODE_ENV=production
```

## Testing the Setup

### 1. Manual Testing

Once deployed, you can test the system using these endpoints:

```bash
# Check cron job status
curl https://pdf-backend-935131444417.asia-south1.run.app/api/cron/status

# Manual ping test
curl -X POST https://pdf-backend-935131444417.asia-south1.run.app/api/cron/ping

# Test Cronitor connection
curl -X POST https://pdf-backend-935131444417.asia-south1.run.app/api/cron/test-cronitor

# Check server health
curl https://pdf-backend-935131444417.asia-south1.run.app/api/health/ping
```

### 2. Monitor Dashboard

In your Cronitor dashboard, you should see:

- ✅ **Green status** when cron jobs run successfully
- 📊 **Execution history** showing regular 14-minute intervals
- 🔔 **Alerts** if jobs fail or don't run on schedule

## How It Works

### Cron Job Flow

1. **Every 14 minutes**: Node-cron triggers the keep-alive function
2. **Start Signal**: Sends `state: 'run'` to Cronitor
3. **Health Check**: Makes GET request to `/api/health/ping`
4. **Success Signal**: Sends `state: 'complete'` with response time
5. **Error Handling**: Sends `state: 'fail'` if ping fails

### Cronitor URLs

The system uses these Cronitor ping URLs:

```
https://cronitor.link/{MONITOR_KEY}/run     # Job started
https://cronitor.link/{MONITOR_KEY}/complete # Job completed successfully
https://cronitor.link/{MONITOR_KEY}/fail     # Job failed
```

## Monitoring Endpoints

### Health Check Endpoints

- `GET /api/health` - Basic health check
- `GET /api/health/ping` - Lightweight ping endpoint for cron job
- `GET /api/health/detailed` - Detailed health with database status

### Cron Management Endpoints

- `GET /api/cron/status` - Get cron job status and statistics
- `POST /api/cron/ping` - Trigger manual ping
- `POST /api/cron/test-cronitor` - Test Cronitor connection
- `POST /api/cron/start` - Start cron job (if stopped)
- `POST /api/cron/stop` - Stop cron job

## Troubleshooting

### Common Issues

#### 1. Cronitor Not Receiving Pings

- Verify `CRONITOR_MONITOR_KEY` environment variable
- Check monitor status in Cronitor dashboard
- Test connection: `POST /api/cron/test-cronitor`

#### 2. Server Still Going to Sleep

- Check cron job status: `GET /api/cron/status`
- Verify 14-minute schedule is running
- Monitor success/error counts

#### 3. Environment Variables Not Set

- Ensure all required env vars are set in Render
- Check server logs for configuration warnings
- Test with: `GET /api/cron/status`

### Logs to Monitor

Watch these log messages:

```
✅ Keep-alive cron job initialized successfully
✅ Keep-alive ping successful
❌ Keep-alive ping failed
✅ Cronitor ping sent: complete
```

## Security Notes

- The API key (`b612058cd75c4f23a6f7674fb9e8c09c`) is already included
- Monitor keys are public and safe to use in URLs
- All endpoints use HTTPS for secure communication
- Rate limiting is disabled for health check endpoints

## Alert Configuration

In Cronitor dashboard, configure alerts for:

- **Missing executions**: When cron job doesn't run on schedule
- **Failed executions**: When ping requests fail
- **Performance degradation**: When response times increase significantly

## Next Steps

1. ✅ Deploy the updated backend to Render
2. ✅ Create Cronitor monitor using the dashboard
3. ✅ Add environment variables to Render
4. ✅ Monitor the dashboard for successful pings
5. ✅ Set up alert notifications (email, Slack, etc.)

The system will now automatically keep your Render server awake and provide comprehensive monitoring of its health status.
