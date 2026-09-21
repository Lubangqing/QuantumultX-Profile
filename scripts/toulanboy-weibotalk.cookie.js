/**********
🐬作者
@Evilbutcher。 https://github.com/evilbutcher
@toulanboy。https://github.com/toulanboy/scripts

📌不定期更新各种签到、有趣的脚本，欢迎star🌟

***********************************
【配置步骤，请认真阅读，每一个细节都很重要】
***********************************
1. 根据你当前的软件，配置好srcipt。由于是远程文件，记得顺便更新文件。
2. 打开微博APP --> 底部栏“我的“  -->  中间的”超话社区“  --> 底部栏"我的" --> ”关注“， 弹出通知，提示获取已关注超话链接成功。
3. 点进一个超话页面，手动签到一次。弹出通知，提示获取超话签到链接成功。 若之前所有已经签到，请关注一个新超话进行签到。
4. 回到quanx等软件，关掉获取cookie的rewrite。（loon是关掉获取cookie的脚本）

📌 配置第2个账号方法：第1个账号获取cookie结束后。在微博app中切换到第2个号，进行相同的获取逻辑。

***************************************
【boxjs 订阅， 用于修改脚本配置】
***************************************
box订阅链接：https://raw.githubusercontent.com/toulanboy/scripts/master/toulanboy.boxjs.json
订阅后，可以在box里面进行 cookie清空、通知个数、签到延迟 等设置.

*************************
【Surge 4.2+ 脚本配置】
*************************
微博超话cookie获取 = type=http-request,pattern=^https?://m?api\.weibo\.c(n|om)\/2\/(cardlist|page\/button),script-path=https://raw.githubusercontent.com/toulanboy/scripts/master/weibo/weibotalk.cookie.js
微博超话 = type=cron,cronexp="5 0  * * *",script-path=https://raw.githubusercontent.com/toulanboy/scripts/master/weibo/weibotalk.js,wake-system=true,timeout=600

*************************
【Loon 2.1+ 脚本配置】
*************************
[script]
cron "5 0 * * *" script-path=https://raw.githubusercontent.com/toulanboy/scripts/master/weibo/weibotalk.js, timeout=600, tag=微博超话
http-request ^https?://m?api\.weibo\.c(n|om)\/2\/(cardlist|page\/button) script-path=https://raw.githubusercontent.com/toulanboy/scripts/master/weibo/weibotalk.cookie.js,requires-body=false, tag=微博超话cookie获取

*************************
【 QX 1.0.10+ 脚本配置 】 
*************************
[rewrite_local]
^https?://m?api\.weibo\.c(n|om)\/2\/(cardlist|page\/button) url script-request-header https://raw.githubusercontent.com/toulanboy/scripts/master/weibo/weibotalk.cookie.js
[task]
5 0 * * * https://raw.githubusercontent.com/toulanboy/scripts/master/weibo/weibotalk.js, tag=微博超话


[MITM]
hostname = api.weibo.cn

*********/
$ = new Env("微博超话")
//账号1
const tokenurl = 'evil_tokenurl';
const tokencheckinurl = 'evil_tokencheckinurl'
const tokenheaders = 'evil_tokenheaders'
const tokencheckinheaders = 'evil_tokencheckinheaders'
//账号2
const tokenurl2 = 'evil_tokenurl2';
const tokencheckinurl2 = 'evil_tokencheckinurl2'
const tokenheaders2= 'evil_tokenheaders2'
const tokencheckinheaders2 = 'evil_tokencheckinheaders2'

if ($request && $request.method != 'OPTIONS' && $request.url.match(/\_\-\_myfollow.*?need\_head\_cards/) && $request.url.match(/cardlist/)){
  const listurl = $request.url
  const listheaders = JSON.stringify($request.headers)
  if ($.getdata(tokenurl) == undefined || $.getdata(tokenurl) == "") {
    console.log(listurl)
    $.setdata(listurl, tokenurl)
    $.setdata(listheaders, tokenheaders)
    $.msg("微博超话 [账号一]", "✅获取已关注超话列表成功", "✨接下来，请点进一个超话进行签到\n如果没有签到的超话，请关注新的进行签到。")
  }
  else {
    if (!($.getdata(tokencheckinurl) == undefined || $.getdata(tokencheckinurl) == "") && listurl != $.getdata(tokenurl)) {
      console.log(listurl)
      $.setdata(listurl, tokenurl2)
      $.setdata(listheaders, tokenheaders2)
      $.msg("微博超话 [账号二]", "✅获取已关注超话列表成功", "✨接下来，请点进一个超话进行签到\n如果没有签到的超话，请关注新的进行签到。")
    }
  }
} else if ($request && $request.method != 'OPTIONS' && $request.url.match(/active\_checkin/) && $request.url.match(/page\/button/)){
  const checkinurl = $request.url
  
  const checkinheaders = JSON.stringify($request.headers)
  if (($.getdata(tokenurl) != undefined && $.getdata(tokenurl) != "") && ($.getdata(tokencheckinurl) == undefined || $.getdata(tokencheckinurl) == "")) {
    console.log(checkinurl)
    $.setdata(checkinurl, tokencheckinurl)
    $.setdata(checkinheaders, tokencheckinheaders)
    $.msg("微博超话 [账号一]", "🎉获取超话签到链接成功", `若之前已弹出【获取已关注列表成功】的通知，那么已完成当前账号cookie获取。\n🚨若你只需要签到1个账号，请现在去关闭获取cookie的脚本或重写。`)

  }
  else {
    if (!($.getdata(tokenurl2) == undefined || $.getdata(tokenurl2) == "")) {
      console.log(checkinurl)
      $.setdata(checkinurl, tokencheckinurl2)
      $.setdata(checkinheaders, tokencheckinheaders2)
      $.msg("微博超话 [账号二]", "🎉获取超话签到链接成功", `若之前已弹出【获取已关注列表成功】的通知，那么已完成当前账号cookie获取。\n🚨请关闭获取cookie的脚本或重写，然后可以愉快使用了。`)
    }
  }
}

$.done()

//@Chavy
function Env(s) {
  this.name = s, this.data = null, this.logs = [], this.isSurge = (() => "undefined" != typeof $httpClient), this.isQuanX = (() => "undefined" != typeof $task), this.isNode = (() => "undefined" != typeof module && !!module.exports), this.log = ((...s) => {
    this.logs = [...this.logs, ...s], s ? console.log(s.join("\n")) : console.log(this.logs.join("\n"))
  }), this.msg = ((s = this.name, t = "", i = "") => {
    this.isSurge() && $notification.post(s, t, i), this.isQuanX() && $notify(s, t, i);
    const e = ["", "==============\ud83d\udce3\u7cfb\u7edf\u901a\u77e5\ud83d\udce3=============="];
    s && e.push(s), t && e.push(t), i && e.push(i), console.log(e.join("\n"))
  }), this.getdata = (s => {
    if (this.isSurge()) return $persistentStore.read(s);
    if (this.isQuanX()) return $prefs.valueForKey(s);
    if (this.isNode()) {
      const t = "box.dat";
      return this.fs = this.fs ? this.fs : require("fs"), this.fs.existsSync(t) ? (this.data = JSON.parse(this.fs.readFileSync(t)), this.data[s]) : null
    }
  }), this.setdata = ((s, t) => {
    if (this.isSurge()) return $persistentStore.write(s, t);
    if (this.isQuanX()) return $prefs.setValueForKey(s, t);
    if (this.isNode()) {
      const i = "box.dat";
      return this.fs = this.fs ? this.fs : require("fs"), !!this.fs.existsSync(i) && (this.data = JSON.parse(this.fs.readFileSync(i)), this.data[t] = s, this.fs.writeFileSync(i, JSON.stringify(this.data)), !0)
    }
  }), this.wait = ((s, t = s) => i => setTimeout(() => i(), Math.floor(Math.random() * (t - s + 1) + s))), this.get = ((s, t) => this.send(s, "GET", t)), this.post = ((s, t) => this.send(s, "POST", t)), this.send = ((s, t, i) => {
    if (this.isSurge()) {
      const e = "POST" == t ? $httpClient.post : $httpClient.get;
      e(s, (s, t, e) => {
        t && (t.body = e, t.statusCode = t.status), i(s, t, e)
      })
    }
    this.isQuanX() && (s.method = t, $task.fetch(s).then(s => {
      s.status = s.statusCode, i(null, s, s.body)
    }, s => i(s.error, s, s))), this.isNode() && (this.request = this.request ? this.request : require("request"), s.method = t, s.gzip = !0, this.request(s, (s, t, e) => {
      t && (t.status = t.statusCode), i(null, t, e)
    }))
  }), this.done = ((s = {}) => this.isNode() ? null : $done(s))
}

