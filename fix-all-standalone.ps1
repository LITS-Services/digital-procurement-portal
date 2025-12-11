# Script to add standalone: false to all components, pipes, and directives
$projectPath = "src\app"
$files = Get-ChildItem -Path $projectPath -Recurse -Include "*.component.ts", "*.pipe.ts", "*.directive.ts"

foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw
    $originalContent = $content
    
    # Skip if already has standalone property
    if ($content -match 'standalone\s*:') {
        continue
    }
    
    # Fix @Component
    if ($content -match '@Component\s*\(\s*\{') {
        # Find the closing brace of the decorator
        $pattern = '(@Component\s*\(\s*\{[^}]*?)(\})'
        if ($content -match $pattern) {
            $before = $matches[1]
            $closingBrace = $matches[2]
            
            # Check if there's a trailing comma or newline before the closing brace
            if ($before -match ',\s*$') {
                $content = $content -replace $pattern, "$before`n  standalone: false$closingBrace"
            } elseif ($before -match '\s+$') {
                $content = $content -replace $pattern, "$before  standalone: false$closingBrace"
            } else {
                $content = $content -replace $pattern, "$before,`n  standalone: false$closingBrace"
            }
        }
    }
    
    # Fix @Pipe
    if ($content -match '@Pipe\s*\(\s*\{') {
        $pattern = '(@Pipe\s*\(\s*\{[^}]*?)(\})'
        if ($content -match $pattern) {
            $before = $matches[1]
            $closingBrace = $matches[2]
            if ($before -match ',\s*$') {
                $content = $content -replace $pattern, "$before`n  standalone: false$closingBrace"
            } elseif ($before -match '\s+$') {
                $content = $content -replace $pattern, "$before  standalone: false$closingBrace"
            } else {
                $content = $content -replace $pattern, "$before,`n  standalone: false$closingBrace"
            }
        }
    }
    
    # Fix @Directive (only if not already standalone: true)
    if ($content -match '@Directive\s*\(\s*\{' -and $content -notmatch 'standalone\s*:\s*true') {
        $pattern = '(@Directive\s*\(\s*\{[^}]*?)(\})'
        if ($content -match $pattern) {
            $before = $matches[1]
            $closingBrace = $matches[2]
            if ($before -match ',\s*$') {
                $content = $content -replace $pattern, "$before`n  standalone: false$closingBrace"
            } elseif ($before -match '\s+$') {
                $content = $content -replace $pattern, "$before  standalone: false$closingBrace"
            } else {
                $content = $content -replace $pattern, "$before,`n  standalone: false$closingBrace"
            }
        }
    }
    
    # Write if changed
    if ($content -ne $originalContent) {
        Set-Content -Path $file.FullName -Value $content -NoNewline
        Write-Host "Updated: $($file.Name)"
    }
}

Write-Host "Done!"
