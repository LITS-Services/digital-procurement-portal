# Add standalone: false to all components, pipes, and directives that don't have it
$files = Get-ChildItem -Path "src\app" -Recurse -Include "*.component.ts", "*.pipe.ts", "*.directive.ts"

foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw
    $originalContent = $content
    
    # Skip if already has standalone property
    if ($content -match 'standalone\s*:') {
        continue
    }
    
    # Fix @Component - add standalone: false before closing brace
    if ($content -match '@Component\s*\(\s*\{') {
        $lines = Get-Content $file.FullName
        $newLines = @()
        $inDecorator = $false
        $braceLevel = 0
        
        for ($i = 0; $i -lt $lines.Count; $i++) {
            $line = $lines[$i]
            
            if ($line -match '@Component\s*\(\s*\{') {
                $inDecorator = $true
                $braceLevel = 1
                $newLines += $line
            } elseif ($inDecorator) {
                $openBraces = ($line | Select-String -Pattern '\{' -AllMatches).Matches.Count
                $closeBraces = ($line | Select-String -Pattern '\}' -AllMatches).Matches.Count
                $braceLevel += $openBraces - $closeBraces
                
                if ($braceLevel -eq 0) {
                    # Closing brace found - add standalone: false before it
                    $indent = $line -replace '(\s*).*', '$1'
                    $newLines += "$indent  standalone: false"
                    $newLines += $line
                    $inDecorator = $false
                } else {
                    $newLines += $line
                }
            } else {
                $newLines += $line
            }
        }
        
        $content = $newLines -join "`n"
    }
    
    # Fix @Pipe
    if ($content -match '@Pipe\s*\(\s*\{' -and $content -notmatch 'standalone') {
        $lines = Get-Content $file.FullName
        $newLines = @()
        $inDecorator = $false
        $braceLevel = 0
        
        for ($i = 0; $i -lt $lines.Count; $i++) {
            $line = $lines[$i]
            
            if ($line -match '@Pipe\s*\(\s*\{') {
                $inDecorator = $true
                $braceLevel = 1
                $newLines += $line
            } elseif ($inDecorator) {
                $openBraces = ($line | Select-String -Pattern '\{' -AllMatches).Matches.Count
                $closeBraces = ($line | Select-String -Pattern '\}' -AllMatches).Matches.Count
                $braceLevel += $openBraces - $closeBraces
                
                if ($braceLevel -eq 0) {
                    $indent = $line -replace '(\s*).*', '$1'
                    $newLines += "$indent  standalone: false"
                    $newLines += $line
                    $inDecorator = $false
                } else {
                    $newLines += $line
                }
            } else {
                $newLines += $line
            }
        }
        
        $content = $newLines -join "`n"
    }
    
    # Fix @Directive (only if not standalone: true)
    if ($content -match '@Directive\s*\(\s*\{' -and $content -notmatch 'standalone\s*:\s*true') {
        $lines = Get-Content $file.FullName
        $newLines = @()
        $inDecorator = $false
        $braceLevel = 0
        
        for ($i = 0; $i -lt $lines.Count; $i++) {
            $line = $lines[$i]
            
            if ($line -match '@Directive\s*\(\s*\{') {
                $inDecorator = $true
                $braceLevel = 1
                $newLines += $line
            } elseif ($inDecorator) {
                $openBraces = ($line | Select-String -Pattern '\{' -AllMatches).Matches.Count
                $closeBraces = ($line | Select-String -Pattern '\}' -AllMatches).Matches.Count
                $braceLevel += $openBraces - $closeBraces
                
                if ($braceLevel -eq 0) {
                    $indent = $line -replace '(\s*).*', '$1'
                    $newLines += "$indent  standalone: false"
                    $newLines += $line
                    $inDecorator = $false
                } else {
                    $newLines += $line
                }
            } else {
                $newLines += $line
            }
        }
        
        $content = $newLines -join "`n"
    }
    
    # Write if changed
    if ($content -ne $originalContent) {
        Set-Content -Path $file.FullName -Value $content -NoNewline
        Write-Host "Fixed: $($file.Name)"
    }
}

Write-Host "Done!"
