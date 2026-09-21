const chavy = init()
const cookieName = '时光相册'
const KEY_signurl = 'chavy_sign_url_everphoto'
const KEY_signheader = 'chavy_sign_header_everphoto'

if ($request && $request.method != 'OPTIONS') {
  try {
    chavy.log(`🔔 ${cookieName} 开始获取: Cookies`)
    const VAL_signurl = $request.url
    const VAL_signheader = JSON.stringify($request.headers)
    if (VAL_signurl) {
      chavy.setdata(VAL_signurl, KEY_signurl)
      chavy.log(`❕ ${cookieName} VAL_signurl: ${VAL_signurl}`)
    }
    if (VAL_signheader) {
      chavy.setdata(VAL_signheader, KEY_signheader)
      chavy.log(`❕ ${cookieName} VAL_signheader: ${VAL_signheader}`)
    }
    chavy.msg(cookieName, `获取Cookie: 成功`, ``)
  } catch (e) {
    chavy.msg(cookieName, `获取Cookie: 失败`, e)
    chavy.log(`❌ ${cookieName} 获取Cookie: 失败: ${e}`)
  }
}

function init() {
  isSurge = () => {
    return undefined === this.$httpClient ? false : true
  }
  isQuanX = () => {
    return undefined === this.$task ? false : true
  }
  getdata = (key) => {
    if (isSurge()) return $persistentStore.read(key)
    if (isQuanX()) return $prefs.valueForKey(key)
  }
  setdata = (key, val) => {
    if (isSurge()) return $persistentStore.write(key, val)
    if (isQuanX()) return $prefs.setValueForKey(key, val)
  }
  msg = (title, subtitle, body) => {
    if (isSurge()) $notification.post(title, subtitle, body)
    if (isQuanX()) $notify(title, subtitle, body)
  }
  log = (message) => console.log(message)
  get = (url, cb) => {
    if (isSurge()) {
      $httpClient.get(url, cb)
    }
    if (isQuanX()) {
      url.method = 'GET'
      $task.fetch(url).then((resp) => cb(null, {}, resp.body))
    }
  }
  post = (url, cb) => {
    if (isSurge()) {
      $httpClient.post(url, cb)
    }
    if (isQuanX()) {
      url.method = 'POST'
      $task.fetch(url).then((resp) => cb(null, {}, resp.body))
    }
  }
  done = (value = {}) => {
    $done(value)
  }
  return { isSurge, isQuanX, msg, log, getdata, setdata, get, post, done }
}
chavy.done()

