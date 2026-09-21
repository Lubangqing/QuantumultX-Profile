# QuantumultX-Profile —— 规则/脚本自建镜像库

本仓库把你原来引用的**全部上游远程资源**（fmz200 / blackmatrix7 / zqzess / chavyleung / KOP-XIAO / app2smile /
dompling 等）下载并**转换成 QX 语法**后自持，提供两种使用模式：

| 模式 | 配置文件 | 资源位置 | 自动更新 | 国内可达性 |
|---|---|---|---|---|
| **A. 自建仓库远程**（推荐） | `QuanX.selfhost.conf` | 本仓库 URL | ✅ GitHub Actions 每天同步 | 取决于你用的域名（raw 与上游同域名，见下） |
| **B. 本地文件**（离线兜底） | `QuanX.conf` | 手机沙盒目录 | ❌ 需 PC 跑脚本 | ✅ 完全离线可用 |

**两种模式选一个用，别同时导入**（会导致规则重复执行）。

---

## 目录结构

```
QuanX.selfhost.conf     模式 A：所有引用指向本仓库 URL（MITM 主机名交给远程片段自动合并）
QuanX.conf              模式 B：所有引用指向手机沙盒里的文件名（含 934 条 MITM 主机名合并）

snippets/    30 个      模式 B 用的片段（脚本引用是裸文件名，给沙盒目录用）
selfhost/snippets/ 30 个 模式 A 用的片段（脚本/echo 引用是本仓库 URL）
scripts/    172 个      转换后的 JS（去广告、cookie、查询类、BoxJs、解析器等）
data/         2 个      echo-response 用的 JSON（QX 从 Data 目录或 URL 读取）
icons/       15 个      策略图标（文件名=策略名，模式 B 放 Images/，模式 A 用 URL 引用）

tools/
  build-local.ps1        拉上游 → 转 QX 语法 → 生成 snippets/scripts/icons/data
  apply-local-conf.ps1   生成/刷新模式 B 的 QuanX.conf（幂等；含 MITM 主机名重算）
  make-selfhost.ps1      生成模式 A 的 selfhost/snippets + QuanX.selfhost.conf
  manifest.json          上游 URL → 本地文件 映射（重建的基石）
  mitm-hostnames.txt     启用片段的主机名并集（974 条）
  mitm-merged.txt        已合并进模式 B 配置的条目（用于重算）
  icon-map.txt           策略名 → 原始图标 URL（图标回退用）
  local-refs.txt         模式 B 的引用行清单（备用）

.github/workflows/sync.yml  每天自动同步上游
```

---

## 模式 A：自建仓库远程（推荐）

### 一次性设置
1. **push 本仓库**（含 `selfhost/` 与 `QuanX.selfhost.conf`）。
2. **确认 Actions 能推送**（三种情况，任选其一即可）：
   - **默认就行**：个人仓库的 `GITHUB_TOKEN` 默认通常是 `Read and write`，工作流里已声明 `permissions: contents: write`，
     直接去 Actions 手动跑一次 `Sync mirrors`，能提交就说明不用做任何设置。
   - **如果最后一步 push 报 403 / Write access not granted**：说明 token 是只读。此时**不需要**找设置项，
     建一个**细粒度 PAT**（Fine-grained token，只勾 `Contents: Read and write`，仓库选本仓库），
     存到 仓库 Settings → Secrets and variables → **Actions** → New repository secret，名字叫 **`PAT`** ——
     工作流里写的是 `token: ${{ secrets.PAT || github.token }}`，会自动优先用 PAT。
   - **如果连 Settings → Actions 页面都进不去 / 没有 Actions 页**：说明该仓库被限制了 Actions，
     直接用**本地计划任务**方案（见下），效果完全一样。
3. 在 QX 里导入 `QuanX.selfhost.conf`。

> 设置项的正常位置（供参考，桌面版网页才有）：仓库 **Settings → Actions → General**，
> 往下滚到 **Workflow permissions** 选 *Read and write permissions*。
> 看不到通常是这几种情况：用的是手机/移动端页面、不是仓库管理员、Actions 被禁用、或仓库属于组织且被组织策略接管。

### 不想用 Actions？本地一条命令搞定
```powershell
pwsh -File tools\sync-and-push.ps1        # 同步上游 + 刷新两种配置 + commit + push
```
挂成每天自动跑（管理员 PowerShell 执行一次）：
```powershell
$a = New-ScheduledTaskAction -Execute 'pwsh' -Argument '-NoProfile -ExecutionPolicy Bypass -File "D:\GitHub\QuantumultX-Profile\tools\sync-and-push.ps1"'
$t = New-ScheduledTaskTrigger -Daily -At 09:00
Register-ScheduledTask -TaskName 'QuanX-SyncMirrors' -Action $a -Trigger $t
```

### 之后怎么更新
不用管。Actions 每天 02:23（北京时间）拉一次上游 → 转换 → 提交；
QX 端资源行的 `update-interval=86400` 会让它每天自动跟上。

想手动同步也行：
```powershell
pwsh -File tools\build-local.ps1
pwsh -File tools\apply-local-conf.ps1
pwsh -File tools\make-selfhost.ps1          # Base 自动从 git remote 推断
git add -A; git commit -m "sync"; git push
```

### 关于"可达性"（重要，别误解）
把资源搬进自己的仓库**不会**改善连通性 —— `raw.githubusercontent.com` 是同一个域名。
如果 raw 在你那里经常超时，改基地址即可（脚本支持任意 base）：

```powershell
# jsDelivr（域名不同，国内通常更稳；分支缓存约 12 小时）
pwsh -File tools\make-selfhost.ps1 -Base https://cdn.jsdelivr.net/gh/Lubangqing/QuantumultX-Profile@main
# GitHub Pages（基本无缓存延迟，需在仓库里开 Pages）
pwsh -File tools\make-selfhost.ps1 -Base https://lubangqing.github.io/QuantumultX-Profile
# 自建反代（CF Worker / VPS，最稳）
pwsh -File tools\make-selfhost.ps1 -Base https://your-proxy.example.com/qx
```
生成后重新导入 `QuanX.selfhost.conf` 即可，其它都不用动。

---

## 模式 B：本地文件（离线兜底）

把四个目录拷进 QX 沙盒（详见下方"手机侧目录对照"），导入 `QuanX.conf`。

| 仓库 | 手机 |
|---|---|
| `snippets/*.snippet` | `iCloud 云盘/Quantumult X/Profiles/` |
| `scripts/*.js` | `iCloud 云盘/Quantumult X/Scripts/` |
| `icons/*.png` | `iCloud 云盘/Quantumult X/Images/`（文件名=策略名） |
| `data/*.json` | `iCloud 云盘/Quantumult X/Data/` |

一键推送（Windows + iCloud for Windows）：
```powershell
pwsh -File tools\build-local.ps1 -To "$env:USERPROFILE\iCloudDrive\Quantumult X"
```
本地文件不会自动更新，需要定期重跑上面这条命令。

---

## 验证清单（两种模式通用）

1. **引用资源页**：条目无红点（红点=文件/URL 拉取失败）。
2. **MITM 主机名**：能看到 `boxjs.com`、`sub.store`、`spclient.spotify.com`、`qidian.qpic.cn` 等。
   - 模式 A：由远程片段的 `hostname =` 行自动合并（QX 官方行为）。
   - 模式 B：已显式合并进 `QuanX.conf`（不依赖上述行为），并保留你的 78 条负向排除。
3. **策略图标**：策略页显示分组图标（模式 B 靠 `Images/`，模式 A 靠 `img-url`）。
4. **广告拦截**：开一个带开屏广告的 App 验证。
5. **规则顺序**：设置里可调「本地规则与远程规则的加载顺序」，按模式选。

---

## 仍然需要联网的 3 处（都不是资源下载）

| 行 | 内容 | 说明 |
|---|---|---|
| `server_check_url` | `http://www.google.com/generate_204` | 节点延迟测试目标 |
| `profile_img_url` | GitHub 图标 | 配置列表作者头像，纯装饰；删掉即彻底离线 |
| `geo_location_checker` | `http://ip-api.com/json/?lang=zh-CN` | 查节点落地 IP（脚本已自持） |

---

## 已知例外与丢失项

| 项 | 说明 |
|---|---|
| Script-Hub 的 302 | `^https?://script.hub/$ url 302 https://scripthub.vercel.app` 是打开网页的跳转，无法自持；不用就禁用该片段 |
| 上游注释行 | 生效行中的远程依赖为 **0**；仅剩 18 处远程脚本引用位于上游注释行（`#`/`;` 开头，不生效） |
| 22 条注释规则 | 上游源文件里本就是注释状态，随模块转换丢弃（不含生效规则） |
| 12 个失效脚本 | cookies 片段（本配置为**禁用**状态）里 12 个签到/cookie 脚本上游已 404（raw 与 jsdelivr 均确认） |
| 16 条规则被丢弃 | 13 条 `PROCESS-NAME`（macOS 进程匹配）+ 3 条 `AND` 逻辑规则，QX filter 不支持 |
| Surge 模块参数 | `max-size`/`timeout`/`requires-body` 无 QX 等价项，已按 body 需求映射为 `script-request-body` / `script-request-header` |

---

## 回滚

```powershell
git checkout -- QuanX.conf          # 只回滚模式 B 配置
# snippets/ selfhost/ scripts/ icons/ data/ tools/ .github/ 为新增目录，删除即恢复原状
```
