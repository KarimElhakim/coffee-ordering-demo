# PowerShell script to connect to GitHub repository
# Usage: .\connect-github.ps1 <your-github-username>

param(
    [Parameter(Mandatory=$true)]
    [string]$GitHubUsername
)

$RepoName = "coffee-ordering-demo"

Write-Host "🔗 Connecting to GitHub repository..." -ForegroundColor Cyan
Write-Host ""

# Check if remote already exists
$remoteExists = git remote get-url origin 2>$null
if ($LASTEXITCODE -eq 0) {
    Write-Host "⚠️  Remote 'origin' already exists. Updating..." -ForegroundColor Yellow
    git remote set-url origin "https://github.com/$GitHubUsername/$RepoName.git"
} else {
    Write-Host "➕ Adding remote repository..." -ForegroundColor Green
    git remote add origin "https://github.com/$GitHubUsername/$RepoName.git"
}

Write-Host ""
Write-Host "✅ Remote configured!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Next steps:" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Create a new repository on GitHub:" -ForegroundColor White
Write-Host "   https://github.com/new" -ForegroundColor Gray
Write-Host "   Name: $RepoName" -ForegroundColor Gray
Write-Host "   Visibility: Public (required for free GitHub Pages)" -ForegroundColor Gray
Write-Host "   DO NOT initialize with README, .gitignore, or license" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Push to GitHub:" -ForegroundColor White
Write-Host "   git push -u origin main" -ForegroundColor Gray
Write-Host ""
Write-Host "3. Configure GitHub Secrets (Settings > Secrets and variables > Actions):" -ForegroundColor White
Write-Host "   - VITE_SUPABASE_URL" -ForegroundColor Gray
Write-Host "   - VITE_SUPABASE_ANON_KEY" -ForegroundColor Gray
Write-Host "   - VITE_STRIPE_PUBLISHABLE_KEY" -ForegroundColor Gray
Write-Host ""
Write-Host "4. Enable GitHub Pages (Settings > Pages):" -ForegroundColor White
Write-Host "   Source: GitHub Actions" -ForegroundColor Gray
Write-Host ""
Write-Host "Your apps will be available at:" -ForegroundColor Cyan
Write-Host "  - Customer: https://$GitHubUsername.github.io/$RepoName/customer/" -ForegroundColor Gray
Write-Host "  - Cashier: https://$GitHubUsername.github.io/$RepoName/cashier/" -ForegroundColor Gray
Write-Host "  - KDS: https://$GitHubUsername.github.io/$RepoName/kds/" -ForegroundColor Gray
Write-Host "  - Dashboard: https://$GitHubUsername.github.io/$RepoName/dashboard/" -ForegroundColor Gray
Write-Host ""

