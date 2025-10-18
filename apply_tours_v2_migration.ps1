Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "  Applying Tours v2 Migration" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# Check if Docker is running
try {
    docker ps | Out-Null
} catch {
    Write-Host "❌ Docker is not running. Please start Docker first." -ForegroundColor Red
    exit 1
}

# Check if tours database container is running
$container = docker ps --filter "name=tourism-tours-db" --format "{{.Names}}"
if (-not $container) {
    Write-Host "❌ Tours database container is not running." -ForegroundColor Red
    Write-Host "   Run: docker-compose up -d" -ForegroundColor Yellow
    exit 1
}

Write-Host "📊 Applying migration to tours database..." -ForegroundColor Yellow
Get-Content "tours-service/migrations/add_group_pricing_and_tags.sql" | docker exec -i tourism-tours-db psql -U postgres -d tours_db

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ Migration applied successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "📋 What was added:" -ForegroundColor Cyan
    Write-Host "   - tour_group_pricing table"
    Write-Host "   - tags table (with 15 default tags)"
    Write-Host "   - tour_tags table"
    Write-Host ""
    Write-Host "🎉 Tours v2 is ready to use!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Yellow
    Write-Host "   1. Restart tours service: docker-compose restart tours-service"
    Write-Host "   2. Run tests: python test_tours_v2.py"
} else {
    Write-Host ""
    Write-Host "❌ Migration failed. Check the error above." -ForegroundColor Red
    exit 1
}
