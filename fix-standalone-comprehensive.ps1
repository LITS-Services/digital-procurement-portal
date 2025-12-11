# Comprehensive script to add standalone: false to all components, pipes, and directives
$projectPath = "src\app"
$files = Get-ChildItem -Path $projectPath -Recurse -Include "*.component.ts", "*.pipe.ts", "*.directive.ts"

$fixedCount = 0

foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw
    $originalContent = $content
    
    # Skip if already has standalone property
    if ($content -match 'standalone\s*:') {
        continue
    }
    
    $modified = $false
    
    # Fix @Component - look for the closing brace after the decorator
    if ($content -match '@Component\s*\(\s*\{') {
        # Find the pattern: @Component({ ... })
        # Match everything from @Component({ to the matching closing brace
        $lines = Get-Content $file.FullName
        $newContent = ""
        $inDecorator = $false
        $braceLevel = 0
        $decoratorStart = -1
        
        for ($i = 0; $i -lt $lines.Count; $i++) {
            $line = $lines[$i]
            
            if ($line -match '@Component\s*\(\s*\{') {
                $inDecorator = $true
                $decoratorStart = $i
                $braceLevel = 1
                $newContent += $line + "`n"
            } elseif ($inDecorator) {
                # Count braces
                $openBraces = ($line | Select-String -Pattern '\{' -AllMatches).Matches.Count
                $closeBraces = ($line | Select-String -Pattern '\}' -AllMatches).Matches.Count
                $braceLevel += $openBraces - $closeBraces
                
                if ($braceLevel -eq 0) {
                    # Found closing brace - add standalone: false before it
                    $trimmedLine = $line.TrimEnd()
                    if ($trimmedLine -match ',\s*$') {
                        $newContent += "  standalone: false`n" + $line + "`n"
                    } else {
                        $newContent += $line -replace '(\s*)(\})', '$1  standalone: false$2' + "`n"
                    }
                    $inDecorator = $false
                    $modified = $true
                } else {
                    $newContent += $line + "`n"
                }
            } else {
                $newContent += $line + "`n"
            }
        }
        
        if ($modified) {
            $content = $newContent.TrimEnd()
        }
    }
    
    # Similar logic for @Pipe and @Directive
    # (Simplified - using regex for now)
    if (-not $modified) {
        # Try simple regex replacement as fallback
        if ($content -match '@Component\s*\(\s*\{[^}]*selector[^}]*\}' -and $content -notmatch 'standalone') {
            $content = $content -replace '(@Component\s*\(\s*\{[^}]*selector[^}]*)(\})', '$1,`n  standalone: false$2'
            $modified = $true
        }
        if ($content -match '@Pipe\s*\(\s*\{[^}]*name[^}]*\}' -and $content -notmatch 'standalone') {
            $content = $content -replace '(@Pipe\s*\(\s*\{[^}]*name[^}]*)(\})', '$1,`n  standalone: false$2'
            $modified = $true
        }
        if ($content -match '@Directive\s*\(\s*\{[^}]*selector[^}]*\}' -and $content -notmatch 'standalone' -and $content -notmatch 'standalone\s*:\s*true') {
            $content = $content -replace '(@Directive\s*\(\s*\{[^}]*selector[^}]*)(\})', '$1,`n  standalone: false$2'
            $modified = $true
        }
    }
    
    # Write if changed
    if ($modified -and $content -ne $originalContent) {
        Set-Content -Path $file.FullName -Value $content -NoNewline
        Write-Host "Fixed: $($file.Name)"
        $fixedCount++
    }
}

Write-Host "`nTotal files fixed: $fixedCount"
