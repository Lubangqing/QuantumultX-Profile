<#
  build-local.ps1 —— 把 QuanX.conf 里的所有远程引用本地化

  作用：
    1. 读取 QuanX.conf（只读，不修改）中 [filter_remote]/[rewrite_remote]/[task_local]/[http_backend]/[general] 的远程 URL
    2. 下载 → 必要时转换成 QX 语法 → 写入 snippets/ 与 scripts/
    3. 片段内部引用的远程 JS 也一并下载，并把片段里的 URL 改成本地裸文件名
    4. 生成 tools/local-refs.txt（可直接粘贴回 QuanX.conf 的本地引用行）
    5. 下载 [policy] 段引用的策略图标到 icons/（按策略名命名）

  用法（在仓库根目录或任意位置）：
    pwsh -File tools\build-local.ps1
    pwsh -File tools\build-local.ps1 -To "$env:USERPROFILE\iCloudDrive\Quantumult X"
<#>
[CmdletBinding()]
param(
  # 可选：把 snippets/scripts/icons 直接复制到 QX 目录（例如 iCloud Drive\Quantumult X）
  [string]$To = '',
  [string]$Repo = (Split-Path -Parent $PSScriptRoot)
)

$ErrorActionPreference = 'Stop'
$ProgressPreference    = 'SilentlyContinue'
if(-not $Repo){ $Repo = (Get-Location).Path }
$Repo = (Resolve-Path $Repo).Path

$confPath  = Join-Path $Repo 'QuanX.conf'
$snipDir   = Join-Path $Repo 'snippets'
$scriptDir = Join-Path $Repo 'scripts'
$iconDir   = Join-Path $Repo 'icons'
$manPath   = Join-Path $Repo 'tools' 'manifest.json'
foreach($d in @($snipDir,$scriptDir,$iconDir,(Join-Path $Repo 'tools'))){ New-Item -ItemType Directory -Force -Path $d | Out-Null }

# ---------------------------------------------------------------- 工具函数
$script:fetched = @{}      # url -> 成功/失败
function Get-Text([string]$url){
  $candidates = @($url)
  # github.com/x/y/raw/... -> raw.githubusercontent.com（更快更稳）
  if($url -match '^https://github\.com/([^/]+)/([^/]+)/raw/(.+)$'){
    $candidates += "https://raw.githubusercontent.com/$($Matches[1])/$($Matches[2])/$($Matches[3])"
    $candidates += "https://cdn.jsdelivr.net/gh/$($Matches[1])/$($Matches[2])@$($Matches[3])"
  }
  if($url -match '^https://raw\.githubusercontent\.com/([^/]+)/([^/]+)/([^/]+)/(.+)$'){
    $candidates += "https://cdn.jsdelivr.net/gh/$($Matches[1])/$($Matches[2])@$($Matches[3])/$($Matches[4])"
  }
  foreach($u in $candidates){
    try{
      $r = Invoke-WebRequest -Uri $u -TimeoutSec 60 -UseBasicParsing
      if($r.StatusCode -eq 200){
        if($r.Content -is [byte[]]){ return [Text.Encoding]::UTF8.GetString($r.Content) }
        return [string]$r.Content
      }
    } catch { }
  }
  throw "下载失败: $url"
}
function Get-Bytes([string]$url){
  try{
    $c = (Invoke-WebRequest -Uri $url -TimeoutSec 60 -UseBasicParsing).Content
    if($c -is [byte[]]){ return $c }
    return [Text.Encoding]::UTF8.GetBytes([string]$c)
  } catch { throw "下载失败: $url" }
}
function Save-Text([string]$path,[string[]]$lines){
  # 无 BOM UTF-8 + LF 换行，避免 QX 解析首行异常
  $txt = ($lines -join "`n") + "`n"
  [IO.File]::WriteAllText($path,$txt,(New-Object Text.UTF8Encoding($false)))
}
function Clean-Name([string]$s){
  $s = $s -replace '[^\w\u4e00-\u9fa5\.\-]','-'
  $s = $s -replace '-{2,}','-'
  return $s.Trim('-')
}
function Script-FileName([string]$url,[hashtable]$manifest){
  if($manifest.ContainsKey($url)){ return $manifest[$url] }
  $base = [IO.Path]::GetFileName(($url -split '\?')[0])
  if(-not $base){ $base = 'script.js' }
  if($base -notmatch '\.js$'){ $base = "$base.js" }
  $owner = ''
  if($url -match '^https://raw\.githubusercontent\.com/([^/]+)/'){ $owner = $Matches[1] }
  elseif($url -match '^https://cdn\.jsdelivr\.net/gh/([^/@]+)/'){ $owner = $Matches[1] }
  elseif($url -match '^https://github\.com/([^/]+)/'){ $owner = $Matches[1] }
  $name = if($owner){ "$(Clean-Name $owner)-$(Clean-Name $base)" } else { Clean-Name $base }
  # 去重：同名但不同 URL 时追加短哈希
  $taken = @($manifest.Values)
  if($taken -contains $name){
    $h = [BitConverter]::ToString([Security.Cryptography.SHA1]::Create().ComputeHash([Text.Encoding]::UTF8.GetBytes($url))).Replace('-','').Substring(0,6).ToLower()
    $name = ($name -replace '\.js$',"-$h.js")
  }
  return $name
}

# ---------------------------------------------------------------- 读配置
$confLines = Get-Content -LiteralPath $confPath
$sec = ''; $refs = @(); $policyIcons = @(); $imgUrls = @{}
foreach($l in $confLines){
  if($l -match '^\s*\[(.+?)\]\s*$'){ $sec = $Matches[1]; continue }
  $t = $l.Trim()
  if($t -eq '' -or $t -match '^[#;]'){ continue }
  if($sec -in @('filter_remote','rewrite_remote','task_local','http_backend','general')){
    if($t -match 'https://[^\s,]+'){
      $url = $Matches[0]
      $tag = if($t -match 'tag=([^,]+)'){ $Matches[1].Trim() } else { Clean-Name ([IO.Path]::GetFileName(($url -split '\?')[0])) }
      $fp  = if($t -match 'force-policy=([^,]+)'){ $Matches[1].Trim() } else { '' }
      $en  = if($t -match 'enabled=false'){ 'false' } else { 'true' }
      $iv  = if($t -match 'update-interval=(\d+)'){ $Matches[1] } else { '' }
      $refs += [pscustomobject]@{section=$sec; url=$url; tag=$tag; force=$fp; enabled=$en; iv=$iv; raw=$l}
    }
  }
  if($sec -eq 'policy' -and $t -match '^\s*(?:static|url-latency-benchmark|available|round-robin|dest-hash|ssid)\s*=\s*([^,]+),.*img-url=(\S+)'){
    $policyIcons += [pscustomobject]@{name=$Matches[1].Trim(); url=$Matches[2].Trim()}
  }
}

# 已本地化的引用：从配置里取回 section / tag / force-policy / enabled（本地化后配置里不再有 URL）
$localMeta = @{}
$sec2 = ''
foreach($l in $confLines){
  if($l -match '^\s*\[(.+?)\]\s*$'){ $sec2 = $Matches[1]; continue }
  $t = $l.Trim()
  if($t -eq '' -or $t -match '^[#;]'){ continue }
  if($sec2 -in @('filter_remote','rewrite_remote','task_local','http_backend')){
    $first = ($t -split ',')[0].Trim()
    if($first -ne '' -and $first -notmatch '^https?://'){
      $lg = if($t -match 'tag=([^,]+)'){ $Matches[1].Trim() } else { $first }
      $lf = if($t -match 'force-policy=([^,]+)'){ $Matches[1].Trim() } else { '' }
      $le = if($t -match 'enabled=false'){ 'false' } else { 'true' }
      $localMeta[$first] = [pscustomobject]@{section=$sec2; tag=$lg; force=$lf; enabled=$le}
    }
  }
}

# ---------------------------------------------------------------- manifest
$manifest = @{}
if(Test-Path $manPath){
  $j = Get-Content -LiteralPath $manPath -Raw | ConvertFrom-Json
  foreach($p in $j.PSObject.Properties){ $manifest[$p.Name] = $p.Value }
}

$manifest = $manifest   # url(资源) -> 相对路径
$scriptMap = @{}        # url(脚本) -> 文件名
foreach($p in $manifest.GetEnumerator()){ if($p.Value -like 'scripts/*'){ $scriptMap[$p.Key] = [IO.Path]::GetFileName($p.Value) } }

# 把 manifest 里已有的片段资源补进工作清单（本地化后配置里已无 URL，这是重建的关键）
foreach($kv in $manifest.GetEnumerator()){
  if($kv.Value -notlike 'snippets/*'){ continue }
  if($refs | Where-Object { $_.url -eq $kv.Key }){ continue }
  $file = [IO.Path]::GetFileName($kv.Value)
  $m = $localMeta[$file]
  $refs += [pscustomobject]@{
    section = $(if($m){ $m.section } else { 'filter_remote' })
    url     = $kv.Key
    tag     = $(if($m){ $m.tag } else { [IO.Path]::GetFileNameWithoutExtension($file) })
    force   = $(if($m){ $m.force } else { '' })
    enabled = $(if($m){ $m.enabled } else { 'true' })
    iv      = ''
    raw     = ''
  }
}

# 配置里直接引用的脚本（task_local / http_backend / general）也要刷新
$confScriptRefs = @()
foreach($l in $confLines){
  $t = $l.Trim()
  if($t -eq '' -or $t -match '^[#;]'){ continue }
  foreach($m in [regex]::Matches($t,'([A-Za-z0-9_\.\-]+\.js)\b')){ $confScriptRefs += $m.Groups[1].Value }
}
foreach($kv in $manifest.GetEnumerator()){
  if($kv.Value -notlike 'scripts/*'){ continue }
  $file = [IO.Path]::GetFileName($kv.Value)
  if($confScriptRefs -notcontains $file){ continue }   # 内嵌脚本由片段处理流程刷新
  if($refs | Where-Object { $_.url -eq $kv.Key }){ continue }
  $m = $localMeta[$file]
  $refs += [pscustomobject]@{
    section = $(if($m){ $m.section } else { 'general' })
    url     = $kv.Key
    tag     = $(if($m){ $m.tag } else { $file })
    force   = ''
    enabled = $(if($m){ $m.enabled } else { 'true' })
    iv      = ''
    raw     = ''
  }
}

$report = @(); $scriptTodo = @{}; $iconTodo = @()

# 规则类型转换表
$typeMap = @{ 'DOMAIN'='host'; 'DOMAIN-SUFFIX'='host-suffix'; 'DOMAIN-KEYWORD'='host-keyword'; 'DOMAIN-WILDCARD'='host-wildcard';
              'IP-CIDR'='ip-cidr'; 'IP-CIDR6'='ip6-cidr'; 'IP6-CIDR'='ip6-cidr'; 'GEOIP'='geoip'; 'USER-AGENT'='user-agent'; 'IP-ASN'='ip-asn' }
$dropTypes = @('PROCESS-NAME','AND','OR','NOT','DEST-PORT','SRC-IP','SRC-PORT','IN-PORT','PROTOCOL','RULE-SET','DOMAIN-SET')
$polMap = @{ 'PROXY'='proxy'; 'DIRECT'='direct'; 'REJECT'='reject'; 'REJECT-DROP'='reject'; 'REJECT-TINYGIF'='reject'; 'REJECT-NO-DROP'='reject' }

function Convert-FilterFile([string[]]$inLines,[string]$force){
  $out = New-Object System.Collections.Generic.List[string]
  $c = @{ renamed=0; injected=0; dropped=0; kept=0 }
  $qxNative = @('HOST','HOST-SUFFIX','HOST-KEYWORD','HOST-WILDCARD','IP-CIDR','IP6-CIDR','IP-CIDR6','GEOIP','USER-AGENT','IP-ASN')
  foreach($line in $inLines){
    $l = $line.Trim()
    if($l -eq '' -or $l -match '^[#;]' -or $l -match '^//'){ $out.Add($line); continue }
    if($l -match '^([A-Za-z0-9-]+)\s*,\s*([^,]+?)\s*(,\s*([^,]+?)\s*(,.*)?)?$'){
      $ty = $Matches[1].ToUpper(); $val = $Matches[2].Trim()
      $pol = if($Matches[4]){ $Matches[4].Trim() } else { '' }
      $extra = if($Matches[5]){ $Matches[5].Trim() } else { '' }
      if($dropTypes -contains $ty){ $c.dropped++; continue }
      $nt = $null
      if($typeMap.ContainsKey($ty)){ $nt = $typeMap[$ty] }
      elseif($qxNative -contains $ty){ $nt = $ty.ToLower() }
      if($nt){
        if($polMap.ContainsKey($pol.ToUpper())){ $pol = $polMap[$pol.ToUpper()] }
        if($force){ $pol = $force; $c.injected++ }              # force-policy 覆盖文件内策略（与 QX 语义一致）
        elseif($pol -eq ''){ $pol = 'proxy'; $c.injected++ }
        if($extra -match 'no-resolve'){ $extra = '' }            # Surge 专有参数，QX 不支持
        $out.Add("$nt, $val, $pol$extra")
        if($ty -ne $nt.ToUpper()){ $c.renamed++ } else { $c.kept++ }
        continue
      }
    }
    if($l -match '^(FINAL|final)\s*,\s*(.+)$'){ continue }   # final 由 QuanX.conf 统一管理
    $out.Add($line); $c.kept++
  }
  return @{ lines=$out; stats=$c }
}

function Convert-ModuleFile([string[]]$inLines){
  # Surge/Loon 模块 -> QX 片段（含 [Script] -> url script-*，[MITM] -> hostname）
  $out = New-Object System.Collections.Generic.List[string]
  $sect = ''; $n = 0
  foreach($line in $inLines){
    $l = $line.Trim()
    if($l -eq ''){ continue }
    if($l -match '^#!'){ $out.Add('# ' + $l); continue }
    if($l -match '^\[(.+?)\]$'){ $sect = $Matches[1].ToLower(); continue }
    if($sect -eq 'script'){
      # 名称 = type=http-request, pattern=^https?://x, script-path=URL[, requires-body=true, ...]
      if($l -match '=\s*type\s*=\s*([a-z-]+)\s*,(.*)$'){
        $type = $Matches[1].ToLower(); $rest = $Matches[2]
        $pat = if($rest -match 'pattern\s*=\s*([^,]+)'){ $Matches[1].Trim() } else { '' }
        $sp  = if($rest -match 'script-path\s*=\s*([^,]+)'){ $Matches[1].Trim() } else { '' }
        $body= if($rest -match 'requires-body\s*=\s*true'){ $true } else { $false }
        if($pat -and $sp){
          $action = switch($type){
            'http-request'  { if($body){'script-request-body'} else {'script-request-header'} }
            'http-response' { if($body){'script-response-body'} else {'script-response-header'} }
            'cron'          { 'script-response-body' }
            default         { if($body){'script-response-body'} else {'script-response-header'} }
          }
          $out.Add("$pat url $action $sp"); $n++
        }
      }
      continue
    }
    if($sect -eq 'mitm'){
      if($l -match '^hostname\s*=\s*(.+)$'){
        $h = ($Matches[1] -replace '%APPEND%','').Trim().Trim(',')
        $out.Add("hostname = $h")
      }
      continue
    }
    if($sect -eq 'rewrite_local' -or $sect -eq 'rewrite' -or $sect -eq 'url rewrite'){
      $x = $l -replace '\s+-\s+reject-200',' url reject-200' -replace '\s+-\s+reject\b',' url reject'
      if($x -match '^\S+\s+url\s'){ $out.Add($x); $n++ }
      continue
    }
    if($sect -in @('filter_local','filter_remote','rule')){
      # 模块里的规则段（QX 应从 filter 资源加载；此处转成规则行备用）
      if($l -match '^([A-Za-z0-9-]+)\s*,\s*([^,]+?)\s*(,\s*([^,]+))?\s*$'){
        $ty=$Matches[1].ToUpper(); $val=$Matches[2].Trim(); $pol=if($Matches[4]){$Matches[4].Trim()}else{'proxy'}
        if($typeMap.ContainsKey($ty) -and -not ($dropTypes -contains $ty)){
          if($polMap.ContainsKey($pol.ToUpper())){ $pol = $polMap[$pol.ToUpper()] }
          $out.Add("$($typeMap[$ty]), $val, $pol"); $n++
        }
      }
      continue
    }
    if($l -match '^\S+\s+url\s'){ $out.Add($l); $n++ }
    elseif($l -match '^hostname\s*='){ $out.Add($l) }
  }
  return @{ lines=$out; count=$n }
}

# ---------------------------------------------------------------- 主循环
foreach($r in $refs){
  $tagClean = Clean-Name $r.tag
  try{
    $text = Get-Text $r.url
  } catch {
    $report += [pscustomobject]@{Tag=$r.tag; 段=$r.section; 类型='资源'; 本地文件=''; 结果='下载失败'; 备注=$_.Exception.Message}
    continue
  }
  $inLines = $text -split "`r?`n"

  if($r.section -eq 'filter_remote'){
    $res = Convert-FilterFile $inLines $r.force
    $file = "filter-$tagClean.snippet"
    Save-Text (Join-Path $snipDir $file) $res.lines
    $manifest[$r.url] = "snippets/$file"
    $report += [pscustomobject]@{Tag=$r.tag; 段=$r.section; 类型='规则清单'; 本地文件=$file; 结果='OK';
      备注=("规则 {0} 条（改写类型 {1} / 补策略 {2} / 丢弃 {3}）" -f $res.lines.Count,$res.stats.renamed,$res.stats.injected,$res.stats.dropped)}
  }
  elseif($r.section -eq 'rewrite_remote'){
    $isModule = ($text -match '(?m)^\s*\[Script\]') -or ($text -match '(?m)^#!(name|category)=')
    if($isModule){
      $res = Convert-ModuleFile $inLines
      $file = "rewrite-$tagClean.snippet"
      Save-Text (Join-Path $snipDir $file) $res.lines
      $report += [pscustomobject]@{Tag=$r.tag; 段=$r.section; 类型='Surge/Loon模块'; 本地文件=$file; 结果='已转换'; 备注=("转换出 {0} 条" -f $res.count)}
    } else {
      $file = "rewrite-$tagClean.snippet"
      Save-Text (Join-Path $snipDir $file) $inLines
      $report += [pscustomobject]@{Tag=$r.tag; 段=$r.section; 类型='QX片段'; 本地文件=$file; 结果='OK'; 备注='原样使用'}
    }
    $manifest[$r.url] = "snippets/$file"
  }
  elseif($r.section -eq 'task_local' -or $r.section -eq 'http_backend'){
    $name = Script-FileName $r.url $scriptMap
    Save-Text (Join-Path $scriptDir $name) $inLines
    $scriptMap[$r.url] = $name
    $manifest[$r.url] = "scripts/$name"
    $report += [pscustomobject]@{Tag=$r.tag; 段=$r.section; 类型='脚本'; 本地文件=$name; 结果='OK'; 备注=''}
  }
  elseif($r.section -eq 'general'){
    if($r.url -match '\.js$'){
      $name = Script-FileName $r.url $scriptMap
      Save-Text (Join-Path $scriptDir $name) $inLines
      $scriptMap[$r.url] = $name
      $manifest[$r.url] = "scripts/$name"
      $report += [pscustomobject]@{Tag=$r.tag; 段='general'; 类型='脚本'; 本地文件=$name; 结果='OK'; 备注=''}
    } else {
      $report += [pscustomobject]@{Tag=$r.tag; 段='general'; 类型='图片'; 本地文件=''; 结果='跳过'; 备注='profile_img_url 保留远程（装饰性）'}
    }
  }
}

# ---------------------------------------------------------------- 片段内嵌远程脚本 -> 本地
$embeddedTotal = 0
foreach($sn in (Get-ChildItem $snipDir -File -Filter *.snippet)){
  $txt = [IO.File]::ReadAllText($sn.FullName)
  $changed = $false
  # 形如： <规则> url script-xxx <URL>
  $txt = [regex]::Replace($txt,'(?im)^(?<pre>[^\r\n]*?\burl\s+script-[a-z-]+\s+)(?<url>https?://\S+)(?<post>\s*)$',{
    param($m)
    $u = $m.Groups['url'].Value
    $n = if($scriptMap.ContainsKey($u)){ $scriptMap[$u] } else { Script-FileName $u $scriptMap }
    try{
      Save-Text (Join-Path $scriptDir $n) ((Get-Text $u) -split "`r?`n")   # 每次都重新拉取，保证脚本是最新的
      $scriptMap[$u] = $n
    } catch { $scriptTodo[$u] = 'FAILED'; return $m.Value }
    $script:embeddedTotal++
    return $m.Groups['pre'].Value + $n
  })
  if($txt -match 'url\s+script-[a-z-]+\s+https?://'){ $changed = $true }
  [IO.File]::WriteAllText($sn.FullName,$txt,(New-Object Text.UTF8Encoding($false)))
}
foreach($kv in $scriptTodo.GetEnumerator()){ $manifest[$kv.Key] = "scripts/$($kv.Value)" }

# ---------------------------------------------------------------- pass 2：echo / 302 / cron / 死链
$dataDir = Join-Path $Repo 'data'
New-Item -ItemType Directory -Force -Path $dataDir | Out-Null
$deadLinks = @()
foreach($sn in (Get-ChildItem $snipDir -File -Filter *.snippet)){
  $outLines = New-Object System.Collections.Generic.List[string]
  foreach($line in ([IO.File]::ReadAllLines($sn.FullName))){
    $t = $line.Trim()
    if($t -eq '' -or $t -match '^[#;]' -or $t -match '^//'){ $outLines.Add($line); continue }
    # a) echo-response 指向远程 → 落到 data/（QX 从 Data 目录读 echo-response 文件）
    if($t -match 'echo-response\s+(https?://\S+)$'){
      $u = $Matches[1]; $name = Clean-Name ([IO.Path]::GetFileName(($u -split '\?')[0]))
      try{
        Save-Text (Join-Path $dataDir $name) ((Get-Text $u) -split "`r?`n")
        $manifest[$u] = "data/$name"
        $outLines.Add(($line -replace [regex]::Escape($u), $name)); continue
      } catch { $outLines.Add($line); continue }
    }
    # b) 302 到远程静态文件 → 改写为 echo-response 本地文件（避免客户端去联网取）
    if($t -match '^(\S+)\s+url\s+302\s+(https?://\S+\.(?:json|txt))$'){
      $pat = $Matches[1]; $u = $Matches[2]; $name = Clean-Name ([IO.Path]::GetFileName(($u -split '\?')[0]))
      try{
        Save-Text (Join-Path $dataDir $name) ((Get-Text $u) -split "`r?`n")
        $manifest[$u] = "data/$name"
        $outLines.Add("$pat url echo-response application/json echo-response $name"); continue
      } catch { $outLines.Add($line); continue }
    }
    # c) cron 行里的远程 js → 本地脚本名
    if($t -match '^((?:[\d\*/,\-]+\s+){5})(https?://\S+\.js)(.*)$'){
      $cron = $Matches[1]; $u = $Matches[2]; $rest = $Matches[3]; $name = $scriptMap[$u]
      if(-not $name){
        $name = Script-FileName $u $scriptMap
        try{ Save-Text (Join-Path $scriptDir $name) ((Get-Text $u) -split "`r?`n"); $scriptMap[$u] = $name; $manifest[$u] = "scripts/$name" }
        catch { $name = $null }
      }
      if($name){ $outLines.Add("$cron$name$rest"); continue } else { $outLines.Add($line); continue }
    }
    # d) 仍然残留的远程 script-* 目标 = 下载失败（上游 404）→ 注释停用
    if($t -match '\burl\s+script-[a-z-]+\s+(https?://\S+)'){
      $u = $Matches[1]; $deadLinks += $u
      $outLines.Add("# [build] 上游已 404，规则停用（原脚本: $u）")
      $outLines.Add("# $line")
      continue
    }
    $outLines.Add($line)
  }
  Save-Text $sn.FullName $outLines
}

# ---------------------------------------------------------------- MITM hostname 并集（启用中的片段）
$enabledFiles = @{}
foreach($r in $refs){
  if($manifest.ContainsKey($r.url) -and $manifest[$r.url] -like 'snippets/*'){
    $enabledFiles[[IO.Path]::GetFileName($manifest[$r.url])] = ($r.enabled -ne 'false')
  }
}
$union = New-Object System.Collections.Generic.List[string]
$seen  = New-Object System.Collections.Generic.HashSet[string]
foreach($sn in (Get-ChildItem $snipDir -File -Filter *.snippet)){
  if($enabledFiles.ContainsKey($sn.Name) -and -not $enabledFiles[$sn.Name]){ continue }
  foreach($m in [regex]::Matches([IO.File]::ReadAllText($sn.FullName),'(?im)^\s*hostname\s*=\s*(.+)$')){
    foreach($h in ($m.Groups[1].Value -split ',')){
      $x = ($h -replace '%APPEND%','').Trim()
      if($x -and $seen.Add($x.ToLower())){ $union.Add($x) }
    }
  }
}
Save-Text (Join-Path $Repo 'tools' 'mitm-hostnames.txt') $union

# ---------------------------------------------------------------- 策略图标
foreach($ic in $policyIcons){
  $ext = if($ic.url -match '\.(png|jpg|jpeg|webp)$'){ $Matches[1] } else { 'png' }
  $fn  = "$(Clean-Name $ic.name).$ext"
  try{
    $bytes = Get-Bytes $ic.url
    [IO.File]::WriteAllBytes((Join-Path $iconDir $fn), $bytes)
    $report += [pscustomobject]@{Tag=$ic.name; 段='policy图标'; 类型='图标'; 本地文件="icons/$fn"; 结果='OK'; 备注=''}
  } catch {
    $report += [pscustomobject]@{Tag=$ic.name; 段='policy图标'; 类型='图标'; 本地文件=''; 结果='下载失败'; 备注=''}
  }
}

# ---------------------------------------------------------------- 输出清单
$refLines = New-Object System.Collections.Generic.List[string]
$refLines.Add('# ===== 以下为本地引用行（由 tools\build-local.ps1 生成，可直接替换 QuanX.conf 中的远程行） =====')
foreach($r in $refs){
  if(-not $manifest.ContainsKey($r.url)){ continue }
  $local = $manifest[$r.url]
  $rel = ($local -replace '^snippets/','') -replace '^scripts/',''
  $parts = @($rel, "tag=$($r.tag)")
  if($r.force){ $parts += "force-policy=$($r.force)" }
  if($r.iv -and $local -like 'snippets/*'){ $parts += "update-interval=$($r.iv)" }
  $parts += "enabled=$($r.enabled)"
  $refLines.Add(("[{0}] {1}" -f $r.section, ($parts -join ', ')))
}
Save-Text (Join-Path $Repo 'tools' 'local-refs.txt') $refLines

# manifest
$mf = [ordered]@{}
foreach($k in ($manifest.Keys | Sort-Object)){ $mf[$k] = $manifest[$k] }
[IO.File]::WriteAllText($manPath, ($mf | ConvertTo-Json -Depth 3), (New-Object Text.UTF8Encoding($false)))

# ---------------------------------------------------------------- 报告
$report | Format-Table -AutoSize
Write-Host ''
Write-Host ("片段: {0} 个 / 脚本: {1} 个 / 图标: {2} 个 / data: {3} 个" -f (Get-ChildItem $snipDir -File).Count,(Get-ChildItem $scriptDir -File).Count,(Get-ChildItem $iconDir -File).Count,(Get-ChildItem $dataDir -File).Count)
Write-Host ("片段内嵌远程脚本改写: {0} 处，其中失败 {1} 个" -f $embeddedTotal, (@($scriptTodo.Values | Where-Object {$_ -eq 'FAILED'}).Count))
if($deadLinks.Count){ Write-Host ("上游 404、已注释停用的规则: {0} 条" -f $deadLinks.Count) }
Write-Host ("MITM hostname 并集: {0} 个 -> tools\mitm-hostnames.txt" -f $union.Count)
if($scriptTodo.Values -contains 'FAILED'){
  Write-Host '失败清单:'
  $scriptTodo.GetEnumerator() | Where-Object { $_.Value -eq 'FAILED' } | ForEach-Object { Write-Host ("  - " + $_.Key) }
}
Write-Host ''
Write-Host ("本地引用行已生成: tools\local-refs.txt")
Write-Host ("manifest: tools\manifest.json")

if($To){
  foreach($pair in @(@($snipDir,'Profiles'),@($scriptDir,'Scripts'),@($iconDir,'Images'))){
    $dst = Join-Path $To $pair[1]
    New-Item -ItemType Directory -Force -Path $dst | Out-Null
    Copy-Item (Join-Path $pair[0] '*') $dst -Force
    Write-Host ("已复制 -> " + $dst)
  }
}
