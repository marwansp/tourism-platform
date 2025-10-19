# PowerShell script to apply tour info sections migration
Write-Host "Applying tour info sections migration..." -ForegroundColor Cyan

# Apply migration
Get-Content tours-service/migrations/add_tour_info_sections.sql | docker-compose exec -T tours-db psql -U tours_user -d tours_db

Write-Host "`nMigration completed!" -ForegroundColor Green
Write-Host "`nVerifying table..." -ForegroundColor Cyan

# Verify table exists
docker-compose exec -T tours-db psql -U tours_user -d tours_db -c "\d tour_info_sections"

Write-Host "`nDone!" -ForegroundColor Green
