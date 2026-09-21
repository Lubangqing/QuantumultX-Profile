<#
  make-selfhost.ps1 —— 生成「自建仓库远程版」

  你仓库里的 snippets/ 是给「文件放进手机沙盒」用的（脚本引用是裸文件名）。
  当远程资源用时，QX 会去手机的 Scripts/ 目录找那些裸文件名 → 找不到。
  所以本脚本把它们换回你自己仓库的 URL：

    selfhost/snippets/*.snippet   片段内的 script / echo-response 引用 → <Base>/scripts|data/...
    QuanX.selfhost.conf           资源引用 → <Base>/snippets|scripts/...，策略图标 → <Base>/icons/...

  另外会做两件远程模式专属的事：
    · 给资源行补 update-interval=86400（因为你这个仓库由 Actions 每天更新）
    · 从 [mitm] 里移掉之前为本地模式合并进来的正向主机名
      （远程 rewrite 资源的 hostname 行 QX 会自动合并，不需要写在配置里）

  用法：
    pwsh -File tools/make-selfhost.ps1                                  # 自动从 git remote 推断 Base
    pwsh -File tools/make-selfhost.ps1 -Base https://raw.githubusercontent.com/you/repo/main
#>
[CmdletBinding()]
param(
  [string]$Base = '',
  [string]$Repo = (Split-Path -Parent $PSScriptRoot),
  [string]$SourceConf = 'QuanX.conf',
  [string]$OutConf = 'QuanX.selfhost.conf',
  [int]$UpdateInterval = 86400
)

$ErrorActionPreference = 'Stop'
if(-not $Repo){ $Repo = (Get-Location).Path }
$Repo = (Resolve-Path $Repo).Path
$snipDir = Join-Path $Repo 'snippets'
$outSnipDir = Join-Path $Repo 'selfhost' 'snippets'
$iconDir = Join-Path $Repo 'icons'
$manPath = Join-Path $Repo 'tools' 'manifest.json'
$mergedPath = Join-Path $Repo 'tools' 'mitm-merged.txt'
New-Item -ItemType Directory -Force -Path $outSnipDir | Out-Null

# ---------------------------------------------------------------- Base 推断
if(-not $Base){
  try{
    $url = (& git -C $Repo config --get remote.origin.url).Trim()
    $br  = (& git -C $Repo rev-parse --abbrev-ref HEAD).Trim()
    if($url -match 'github\.com[:/](?<o>[^/]+)/(?<r>[^/]+?)(\.git)?$'){
      $Base = "https://raw.githubusercontent.com/$($Matches['o'])/$($Matches['r'])/$br"
    }
  } catch { }
}
if(-not $Base){ throw '无法推断 Base，请用 -Base 指定，例如 -Base https://raw.githubusercontent.com/you/repo/main' }
$Base = $Base.TrimEnd('/')
Write-Host "Base = $Base"
Write-Host ''

# ---------------------------------------------------------------- 片段：裸文件名 → URL
$snipChanged = 0
foreach($f in (Get-ChildItem $snipDir -File -Filter *.snippet)){
  $txt = [IO.File]::ReadAllText($f.FullName)
  $before = $txt
  # url script-xxx 裸文件名 → <Base>/scripts/文件名
  $txt = [regex]::Replace($txt,'(?im)^(?<pre>[^\r\n]*?\burl\s+script-[a-z-]+\s+)(?<f>[A-Za-z0-9_\.\-]+\.js)[ \t]*$', { param($m) $m.Groups['pre'].Value + $Base + '/scripts/' + $m.Groups['f'].Value })
  # echo-response 裸文件名 → <Base>/data/文件名
  $txt = [regex]::Replace($txt,'(?im)^(?<pre>[^\r\n]*?\becho-response\s+)(?<f>[A-Za-z0-9_\.\-]+\.json)[ \t]*$', { param($m) $m.Groups['pre'].Value + $Base + '/data/' + $m.Groups['f'].Value })
  if($txt -ne $before){ $snipChanged++ }
  [IO.File]::WriteAllText((Join-Path $outSnipDir $f.Name), $txt, (New-Object Text.UTF8Encoding($false)))
}
Write-Host ("片段: {0} 个 → selfhost/snippets/（其中 {1} 个含 URL 引用）" -f (Get-ChildItem $outSnipDir -File).Count, $snipChanged)

# ---------------------------------------------------------------- 配置
$merged = @()
if(Test-Path $mergedPath){ $merged = @(Get-Content -LiteralPath $mergedPath | ForEach-Object { $_.Trim() } | Where-Object { $_ -ne '' }) }
$iconNames = @{}
foreach($i in (Get-ChildItem $iconDir -File -ErrorAction SilentlyContinue)){ $iconNames[[IO.Path]::GetFileNameWithoutExtension($i.Name)] = [uri]::EscapeDataString($i.Name) }

$srcPath = Join-Path $Repo $SourceConf
$raw = [IO.File]::ReadAllText($srcPath)
$nl = if($raw -match "`r`n"){ "`r`n" } else { "`n" }
$lines = $raw -split "`r?`n"

$out = New-Object System.Collections.Generic.List[string]
$sec = ''
$stat = @{ res=0; task=0; icon=0; mitm=0; general=0 }

foreach($line in $lines){
  if($line -match '^\s*\[(.+?)\]\s*$'){ $sec = $Matches[1]; $out.Add($line); continue }
  $t = $line.Trim()
  if($t -eq '' -or $t -match '^[#;]'){ $out.Add($line); continue }

  # [mitm] 去掉本地模式合并进来的正向主机名（远程片段会自动合并 hostname）
  if($sec -eq 'mitm' -and $t -match '^hostname\s*=' -and $merged.Count){
    $entries = @(($t -replace '^hostname\s*=','') -split ',' | ForEach-Object { $_.Trim() } | Where-Object { $_ -ne '' -and $merged -notcontains $_ })
    $stat.mitm = $merged.Count
    $out.Add('hostname = ' + ($entries -join ', '))
    continue
  }

  # 资源行：裸文件名 → URL（+补 update-interval，+策略图标）
  if($sec -in @('filter_remote','rewrite_remote')){
    if($t -match '^([^,\s]+\.snippet)\s*(,.*)?$'){
      $file = $Matches[1]; $rest = if($Matches[2]){ $Matches[2] } else { '' }
      if($rest -notmatch 'update-interval='){ $rest = "$rest, update-interval=$UpdateInterval" }
      $out.Add("$Base/snippets/$file$rest")
      $stat.res++
      continue
    }
  }
  if($sec -in @('task_local','http_backend')){
    $m2 = [regex]::Match($t,'(?<![/\w])([A-Za-z0-9_\.\-]+\.js)(?![\w])')
    if($m2.Success){
      $file = $m2.Groups[1].Value
      $out.Add(($line -replace [regex]::Escape($file), "$Base/scripts/$file"))
      $stat.task++
      continue
    }
  }
  if($sec -eq 'general'){
    if($t -match '^(resource_parser_url|geo_location_checker)\s*=\s*(.*)$'){
      $key = $Matches[1]; $val = $Matches[2]
      $newVal = [regex]::Replace($val,'(?<![\/\w])([A-Za-z0-9_\.\-]+\.js)\s*$', { param($m) $Base + '/scripts/' + $m.Groups[1].Value })
      if($newVal -ne $val){ $out.Add("$key=$newVal"); $stat.general++; continue }
    }
  }

  # 策略行：本地图标 → 仓库图标
  if($sec -eq 'policy' -and $t -notmatch 'img-url='){
    if($t -match '^(static|url-latency-benchmark|available|round-robin|dest-hash|ssid)\s*=\s*([^,]+),(.*)$'){
      $polName = $Matches[2].Trim(); $rest = $Matches[3]
      if($iconNames.ContainsKey($polName)){
        $out.Add("$($Matches[1])=$($Matches[2]),$rest, img-url=$Base/icons/$($iconNames[$polName])")
        $stat.icon++
        continue
      }
    }
  }

  $out.Add($line)
}

$outPath = Join-Path $Repo $OutConf
[IO.File]::WriteAllText($outPath, ($out -join $nl), (New-Object Text.UTF8Encoding($false)))

Write-Host ''
Write-Host ("已生成 {0}" -f $OutConf)
Write-Host ("  资源引用改写 {0} 处 / 任务脚本 {1} 处 / general {2} 处 / 策略图标 {3} 个" -f $stat.res,$stat.task,$stat.general,$stat.icon)
if($stat.mitm){ Write-Host ("  [mitm] 移除本地模式合并的主机名 {0} 条（远程片段会自动合并）" -f $stat.mitm) }
Write-Host ''
Write-Host '下一步：把本仓库 push 上去，然后在 QX 里导入 QuanX.selfhost.conf'
