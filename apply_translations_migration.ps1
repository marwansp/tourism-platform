# PowerShell script to apply tour translations migration

Write-Host "🌐 Applying Tour Translations Migration..." -ForegroundColor Cyan
Write-Host "This will add multilingual support (English & French) to tours" -ForegroundColor Cyan
Write-Host ""

# Apply migration to tours database
Get-Content tours-service/migrations/add_tour_translations.sql | docker-compose exec -T tours-db psql -U tours_user -d tours_db

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ Migration applied successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "📊 Checking results..." -ForegroundColor Yellow
    docker-compose exec -T tours-db psql -U tours_user -d tours_db -c "SELECT COUNT(*) as total_translations, language FROM tour_translations GROUP BY language;"
    Write-Host ""
    Write-Host "🎉 Multilingual support is now active!" -ForegroundColor Green
    Write-Host "   - Existing tours migrated to English" -ForegroundColor White
    Write-Host "   - Default French translations created" -ForegroundColor White
    Write-Host "   - Admin can now edit both languages" -ForegroundColor White
} else {
    Write-Host ""
    Write-Host "❌ Migration failed!" -ForegroundColor Red
    Write-Host "Please check the error messages above" -ForegroundColor Red
    exit 1
}
