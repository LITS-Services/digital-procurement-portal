# Fix all components, pipes, and directives by adding standalone: false
$files = Get-ChildItem -Path "src\app" -Recurse -Include "*.component.ts", "*.pipe.ts", "*.directive.ts"

$fixed = 0
$skipped = 0

foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw
    $originalContent = $content
    
    # Skip if already has standalone property
    if ($content -match 'standalone\s*:') {
        $skipped++
        continue
    }
    
    # Skip if no @Component, @Pipe, or @Directive
    if ($content -notmatch '@(Component|Pipe|Directive)\s*\(\s*\{') {
        continue
    }
    
    # For directives that are already standalone: true, skip
    if ($content -match '@Directive' -and $content -match 'standalone\s*:\s*true') {
        $skipped++
        continue
    }
    
    $lines = Get-Content $file.FullName
    $newLines = @()
    $inDecorator = $false
    $braceLevel = 0
    $decoratorType = ""
    
    for ($i = 0; $i -lt $lines.Count; $i++) {
        $line = $lines[$i]
        
        if ($line -match '@(Component|Pipe|Directive)\s*\(\s*\{') {
            $inDecorator = $true
            $braceLevel = 1
            $decoratorType = $matches[1]
            $newLines += $line
        } elseif ($inDecorator) {
            $openBraces = ($line | Select-String -Pattern '\{' -AllMatches).Matches.Count
            $closeBraces = ($line | Select-String -Pattern '\}' -AllMatches).Matches.Count
            $braceLevel += $openBraces - $closeBraces
            
            if ($braceLevel -eq 0) {
                # Closing brace found - add standalone: false before it
                $indent = $line -replace '(\s*).*', '$1'
                $trimmedLine = $line.TrimEnd()
                
                # Check if there's a trailing comma
                if ($trimmedLine -match ',\s*$') {
                    $newLines += "$indent  standalone: false"
                } else {
                    # Add comma if needed
                    $newLines += "$indent  standalone: false,"
                }
                $newLines += $line
                $inDecorator = $false
                $fixed++
            } else {
                $newLines += $line
            }
        } else {
            $newLines += $line
        }
    }
    
    if ($fixed -gt 0 -or $content -ne $originalContent) {
        $newContent = $newLines -join "`n"
        if ($newContent -ne $originalContent) {
            Set-Content -Path $file.FullName -Value $newContent -NoNewline
            Write-Host "Fixed: $($file.Name)"
        }
    }
}

Write-Host "`nFixed: $fixed files"
Write-Host "Skipped: $skipped files (already have standalone property)"
