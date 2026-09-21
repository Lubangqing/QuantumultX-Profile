<#
  apply-local-conf.ps1 —— 按 tools\manifest.json 把 QuanX.conf 的远程引用改成本地裸文件名

  特点：
    · 只改「URL 在 manifest 里且本地文件存在」的行，其它行原样保留（含注释、空行、换行风格）
    · 幂等：已经是本地文件名的行不会被重复处理
    · 顺手做三件事：去掉对本地文件无意义的 update-interval / opt-parser；去掉会联网的 img-url（保留 SF Symbol 形式）
    · 生成 tools\icon-map.txt（策略名 → 原始图标 URL），便于回退

  用法：pwsh -File tools\apply-local-conf.ps1
<#>
[CmdletBinding()]
param([string]$Repo = (Split-Path -Parent $PSScriptRoot))

$ErrorActionPreference = 'Stop'
if(-not $Repo){ $Repo = (Get-Location).Path }
$Repo = (Resolve-Path $Repo).Path
$confPath = Join-Path $Repo 'QuanX.conf'
$manPath  = Join-Path $Repo 'tools' 'manifest.json'
if(-not (Test-Path $manPath)){ throw "缺少 tools\manifest.json，请先运行 tools\build-local.ps1" }

$manifest = @{}
foreach($p in (Get-Content -LiteralPath $manPath -Raw | ConvertFrom-Json).PSObject.Properties){ $manifest[$p.Name] = $p.Value }

# MITM hostname 合并：union 来自 build-local.ps1 生成的启用片段并集；merged 记录上次自动加进去的条目，便于重算
$unionPath  = Join-Path $Repo 'tools' 'mitm-hostnames.txt'
$mergedPath = Join-Path $Repo 'tools' 'mitm-merged.txt'
$union = if(Test-Path $unionPath){ @(Get-Content -LiteralPath $unionPath | ForEach-Object { $_.Trim() } | Where-Object { $_ -ne '' }) } else { @() }
$prevMerged = if(Test-Path $mergedPath){ @(Get-Content -LiteralPath $mergedPath | ForEach-Object { $_.Trim() } | Where-Object { $_ -ne '' }) } else { @() }
$mergedOut = New-Object System.Collections.Generic.List[string]

$bytes = [IO.File]::ReadAllBytes($confPath)
$hasBom = ($bytes.Length -ge 3 -and $bytes[0] -eq 0xEF -and $bytes[1] -eq 0xBB -and $bytes[2] -eq 0xBF)
$raw = [IO.File]::ReadAllText($confPath)
$nl = if($raw -match "`r`n"){ "`r`n" } else { "`n" }
$lines = $raw -split "`r?`n"

$out = New-Object System.Collections.Generic.List[string]
$changed = New-Object System.Collections.Generic.List[string]
$iconMap = New-Object System.Collections.Generic.List[string]
$skipped = New-Object System.Collections.Generic.List[string]
$sec = ''

foreach($line in $lines){
  if($line -match '^\s*\[(.+?)\]\s*$'){ $sec = $Matches[1]; $out.Add($line); continue }
  $t = $line.Trim()
  if($t -eq '' -or $t -match '^[#;]'){ $out.Add($line); continue }

  # ---- 0) [mitm] hostname：重算「启用片段 hostname 并集」，同时保留你自己的正/负向条目
  if($sec -eq 'mitm' -and $line -match '^\s*hostname\s*='){
    $entries = @(($line -replace '^\s*hostname\s*=','') -split ',' | ForEach-Object { $_.Trim() } | Where-Object { $_ -ne '' })
    if($prevMerged.Count){ $entries = @($entries | Where-Object { $prevMerged -notcontains $_ }) }
    $have = @{}; foreach($e in $entries){ $have[$e.ToLower()] = $true }
    $neg = @($entries | Where-Object { $_ -like '-*' } | ForEach-Object { $_.Substring(1).ToLower() })
    $added = New-Object System.Collections.Generic.List[string]
    foreach($h in $union){
      $hl = $h.ToLower()
      if($hl -like '-*' -or $have.ContainsKey($hl) -or $have.ContainsKey("-$hl")){ continue }
      $blocked = $false
      foreach($n in $neg){
        $rx = '^' + ([regex]::Escape($n) -replace '\\\*','[^,]*') + '$'
        if($hl -match $rx){ $blocked = $true; break }
      }
      if($blocked){ continue }
      $added.Add($h); $have[$hl] = $true
    }
    if($added.Count){
      $out.Add('hostname = ' + (($entries + $added) -join ', '))
      foreach($a in $added){ $mergedOut.Add($a) }
      $changed.Add(("  [mitm] hostname 合并 {0} 条（来自启用片段，已剔除你排除的域名）" -f $added.Count))
    } else { $out.Add($line) }
    continue
  }

  # ---- 1) 策略行上的远程图标：本地化为 Images 目录（文件名=策略名）
  if($sec -eq 'policy' -and $line -match 'img-url=(https?://\S+)'){
    $u = $Matches[1]
    $name = if($line -match '^\s*(?:static|url-latency-benchmark|available|round-robin|dest-hash|ssid)\s*=\s*([^,]+),'){ $Matches[1].Trim() } else { '' }
    $new = ($line -replace ',\s*img-url=https?://\S+','').TrimEnd()
    $iconMap.Add(("{0}`t{1}" -f $name, $u))
    $changed.Add("  [policy] {0}  ← 去掉远程图标（改为 images/{0}.png）" -f $name)
    $out.Add($new); continue
  }

  # ---- 2) 引用资源行 / 任务行 / general 行上的远程 URL
  if($sec -in @('filter_remote','rewrite_remote','task_local','http_backend','general')){
    $hit = $null
    foreach($m in [regex]::Matches($line,'https?://[^\s,]+')){
      if($manifest.ContainsKey($m.Value)){ $hit = $m.Value; break }
    }
    if($hit){
      $rel   = $manifest[$hit]
      $local = [IO.Path]::GetFileName($rel)
      if($rel -like 'snippets/*' -and -not (Test-Path (Join-Path $Repo $rel))){
        $skipped.Add("  ! 本地文件缺失，跳过：$local"); $out.Add($line); continue
      }
      if($rel -like 'scripts/*' -and -not (Test-Path (Join-Path $Repo $rel))){
        $skipped.Add("  ! 本地文件缺失，跳过：$local"); $out.Add($line); continue
      }
      $new = $line -replace [regex]::Escape($hit), $local
      $new = $new -replace ',\s*update-interval=\d+','' -replace ',\s*opt-parser=(?:true|false)',''
      $new = $new -replace ',\s*img-url=https?://[^\s,]+',''
      $new = $new -replace ',\s*,',','
      $changed.Add(("  [{0}] {1}" -f $sec, $local))
      $out.Add($new); continue
    }
  }
  $out.Add($line)
}

$enc = New-Object Text.UTF8Encoding($hasBom)
[IO.File]::WriteAllText($confPath, (($out -join $nl)), $enc)
if($iconMap.Count){ [IO.File]::WriteAllText((Join-Path $Repo 'tools' 'icon-map.txt'), (($iconMap -join "`r`n") + "`r`n"), (New-Object Text.UTF8Encoding($false))) }
if($mergedOut.Count){ [IO.File]::WriteAllText($mergedPath, (($mergedOut -join "`r`n") + "`r`n"), (New-Object Text.UTF8Encoding($false))) }
elseif(Test-Path $mergedPath){ Remove-Item $mergedPath -Force }

$remoteLeft = ($out | Where-Object { $_ -match '^\s*[^#;].*https?://' } | Where-Object { $_ -notmatch '^\s*$' })
Write-Host ("已改本地化引用: {0} 处" -f $changed.Count)
$changed | ForEach-Object { Write-Host $_ }
if($skipped.Count){ Write-Host ''; Write-Host '跳过:'; $skipped | ForEach-Object { Write-Host $_ } }
Write-Host ''
Write-Host ("配置里仍含 https:// 的有效行: {0} 行" -f @($remoteLeft).Count)
$remoteLeft | ForEach-Object { Write-Host ('  ' + $_.Trim()) }
