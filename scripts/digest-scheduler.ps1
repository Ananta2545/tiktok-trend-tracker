# Automatic Daily Digest Scheduler
# This script runs every minute and checks if it's time to send daily digests

Write-Host "Starting Daily Digest Scheduler..." -ForegroundColor Cyan
Write-Host "Checking every minute for scheduled digests" -ForegroundColor Yellow
Write-Host "Press Ctrl+C to stop" -ForegroundColor Gray
Write-Host ""

$cronSecret = $env:CRON_SECRET
if (-not $cronSecret) {
    $cronSecret = "agfvajkwfuakyfjaifbvahfhahfkiafbvakhfiafnakhfnbkh"
}

$apiUrl = $env:NEXT_PUBLIC_APP_URL
if (-not $apiUrl) {
    $apiUrl = "http://localhost:3000"
}
$apiUrl = "$apiUrl/api/cron/send-digests"

while ($true) {
    $currentTime = Get-Date -Format "HH:mm"
    
    try {
        Write-Host "[$currentTime] Checking for scheduled digests..." -ForegroundColor Gray
        
        $response = Invoke-RestMethod -Uri $apiUrl -Method Post -Headers @{
            "Authorization" = "Bearer $cronSecret"
            "Content-Type" = "application/json"
        }
        
        if ($response.digestsSent -gt 0) {
            Write-Host "[SUCCESS] [$currentTime] Sent $($response.digestsSent) digest(s)" -ForegroundColor Green
            foreach ($result in $response.results) {
                if ($result.sent) {
                    Write-Host "   EMAIL: $($result.email) - $($result.trendsCount) trends" -ForegroundColor Green
                }
            }
        }
    }
    catch {
        Write-Host "[ERROR] [$currentTime] Error: $($_.Exception.Message)" -ForegroundColor Red
    }
    
    # Wait 60 seconds before next check
    Start-Sleep -Seconds 60
}
