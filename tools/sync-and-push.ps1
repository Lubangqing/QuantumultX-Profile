<#
  sync-and-push.ps1 —— 不用 GitHub Actions 的替代方案：在 PC 上一条命令完成同步并推送

  做三件事：
    1. 拉上游 → 转换（snippets/ scripts/ icons/ data/）
    2. 刷新两种模式的配置（QuanX.conf 本地模式 + QuanX.selfhost.conf 远程模式）
    3. git add/commit/push

  用法：
    pwsh -File tools\sync-and-push.ps1
    pwsh -File tools\sync-and-push.ps1 -Branch main

  想每天自动跑（Windows 计划任务，管理员 PowerShell 执行一次即可）：
    $a = New-ScheduledTaskAction -Execute 'pwsh' -Argument '-NoProfile -ExecutionPolicy Bypass -File "D:\GitHub\QuantumultX-Profile\tools\sync-and-push.ps1"'
    $t = New-ScheduledTaskTrigger -Daily -At 09:00
    Register-ScheduledTask -TaskName 'QuanX-SyncMirrors' -Action $a -Trigger $t
<#>
[CmdletBinding()]
param(
  [string]$Repo = (Split-Path -Parent $PSScriptRoot),
  [string]$Branch = '',
  [switch]$NoPush
)

$ErrorActionPreference = 'Stop'
if(-not $Repo){ $Repo = (Get-Location).Path }
$Repo = (Resolve-Path $Repo).Path
Set-Location $Repo

if(-not $Branch){
  $Branch = (& git rev-parse --abbrev-ref HEAD).Trim()
  if(-not $Branch -or $Branch -eq 'HEAD'){ $Branch = 'main' }
}

Write-Host '=== 1/4 同步上游并转换 ===' -ForegroundColor Cyan
& (Join-Path $Repo 'tools' 'build-local.ps1') | Out-Null
Write-Host '  ok'

Write-Host '=== 2/4 刷新本地模式配置 ===' -ForegroundColor Cyan
& (Join-Path $Repo 'tools' 'apply-local-conf.ps1') | Out-Null
Write-Host '  ok'

Write-Host '=== 3/4 生成自建仓库远程模式 ===' -ForegroundColor Cyan
& (Join-Path $Repo 'tools' 'make-selfhost.ps1') | Out-Null
Write-Host '  ok'

Write-Host '=== 4/4 提交并推送 ===' -ForegroundColor Cyan
$dirty = (& git status --porcelain)
if(-not $dirty){ Write-Host '  没有变化，跳过提交'; return }

git add -A
$msg = "chore: sync upstream mirrors ($(Get-Date -Format 'yyyy-MM-dd'))"
git commit -m $msg | Out-Null
Write-Host ("  已提交: " + $msg)
if($NoPush){ Write-Host '  -NoPush 已指定，未推送'; return }
git push origin $Branch
Write-Host '  已推送'
