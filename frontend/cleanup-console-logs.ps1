# Script to replace console.log with logger in frontend files
# Usage: .\cleanup-console-logs.ps1

Write-Host "🧹 Cleaning up console.log statements..." -ForegroundColor Cyan

$files = @(
    "src\pages\Teacher\TeacherDashboardV3\components\ExerciseManagement\ExercisesTests.jsx",
    "src\pages\Teacher\TeacherDashboardV3\components\ExerciseManagement\ExerciseManagementV2.jsx",
    "src\pages\Teacher\TeacherDashboardV3\components\GradingFeedback.jsx",
    "src\services\parentService.js",
    "src\services\examService.js",
    "src\services\api.js"
)

$replacements = @{
    "console\.log\('\[([^\]]+)\]" = "logger.debug('`$1',"
    "console\.log\(`\[([^\]]+)\]" = "logger.debug('`$1',"
    "console\.log\('Fetching" = "logger.debug('Fetching"
    "console\.log\('Classes response:" = "logger.debug('Classes response:"
    "console\.log\('Selected" = "logger.debug('Selected"
    "console\.log\('Detail modal" = "logger.debug('Detail modal"
    "console\.log\('Exercise created" = "logger.debug('Exercise created"
}

foreach ($file in $files) {
    if (Test-Path $file) {
        Write-Host "📝 Processing: $file" -ForegroundColor Yellow
        
        $content = Get-Content $file -Raw
        $modified = $false
        
        foreach ($pattern in $replacements.Keys) {
            if ($content -match $pattern) {
                $content = $content -replace $pattern, $replacements[$pattern]
                $modified = $true
            }
        }
        
        if ($modified) {
            # Add logger import if not exists
            if ($content -notmatch "import logger from") {
                if ($file -match "\.jsx$") {
                    $importPath = "../" * (($file -split "\\").Count - 3) + "utils/logger"
                    $content = $content -replace "(import.*?from.*?;)", "`$1`nimport logger from '$importPath';"
                } else {
                    $importPath = "../" * (($file -split "\\").Count - 2) + "utils/logger"
                    $content = $content -replace "(import.*?from.*?;)", "`$1`nimport logger from '$importPath';"
                }
            }
            
            Set-Content $file $content
            Write-Host "✅ Updated: $file" -ForegroundColor Green
        } else {
            Write-Host "⏭️  Skipped: $file (no console.log found)" -ForegroundColor Gray
        }
    } else {
        Write-Host "❌ Not found: $file" -ForegroundColor Red
    }
}

Write-Host "`n✨ Cleanup complete!" -ForegroundColor Green
