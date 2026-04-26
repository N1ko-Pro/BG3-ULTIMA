# Run as Administrator
# Removes leftover BG3 ULTIMA registry entries

$uninstallPaths = @(
    "HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall",
    "HKLM:\SOFTWARE\WOW6432Node\Microsoft\Windows\CurrentVersion\Uninstall"
)

foreach ($path in $uninstallPaths) {
    if (Test-Path $path) {
        Get-ChildItem $path | ForEach-Object {
            $props = Get-ItemProperty $_.PSPath -ErrorAction SilentlyContinue
            if ($props.DisplayName -like "*BG3 ULTIMA*") {
                Write-Host "Removing uninstall key: $($_.PSPath)"
                Remove-Item $_.PSPath -Recurse -Force
            }
        }
    }
}

$installKey = "HKLM:\SOFTWARE\c2c45462-de99-5e94-b8e6-5f42bb9a2629"
if (Test-Path $installKey) {
    Write-Host "Removing install key: $installKey"
    Remove-Item $installKey -Recurse -Force
}

Write-Host "Done."
