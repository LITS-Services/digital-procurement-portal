# Script to add standalone: false to all components that don't have it
$projectPath = "src\app"
$componentFiles = Get-ChildItem -Path $projectPath -Recurse -Filter "*.component.ts"

foreach ($file in $componentFiles) {
    $content = Get-Content $file.FullName -Raw
    $originalContent = $content
    
    # Check if component decorator exists and doesn't have standalone property
    if ($content -match '@Component\s*\(\s*\{' -and $content -notmatch 'standalone\s*:') {
        # Find the closing brace of @Component decorator
        $lines = Get-Content $file.FullName
        $newLines = @()
        $inComponent = $false
        $braceCount = 0
        $componentStart = -1
        
        for ($i = 0; $i -lt $lines.Count; $i++) {
            $line = $lines[$i]
            $newLines += $line
            
            if ($line -match '@Component\s*\(\s*\{') {
                $inComponent = $true
                $componentStart = $i
                $braceCount = ($line | Select-String -Pattern '\{' -AllMatches).Matches.Count - ($line | Select-String -Pattern '\}' -AllMatches).Matches.Count
            } elseif ($inComponent) {
                $braceCount += ($line | Select-String -Pattern '\{' -AllMatches).Matches.Count - ($line | Select-String -Pattern '\}' -AllMatches).Matches.Count
                
                if ($braceCount -eq 0 -and $line -match '\}') {
                    # Found closing brace, add standalone: false before it
                    $lastLine = $newLines[$newLines.Count - 1]
                    $newLines[$newLines.Count - 1] = $lastLine -replace '(\s*)(\})', '$1  standalone: false$2'
                    $inComponent = $false
                }
            }
        }
        
        # If we found a component, write the updated content
        if ($componentStart -ge 0) {
            $newContent = $newLines -join "`n"
            if ($newContent -ne $originalContent) {
                Set-Content -Path $file.FullName -Value $newContent
                Write-Host "Updated: $($file.FullName)"
            }
        }
    }
}

Write-Host "Done!"
