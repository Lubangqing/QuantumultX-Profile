/*
hifini签到-lowking-v1.0

按下面配置完之后，打开https://www.hifini.com/my.htm获取cookie

************************
Surge 4.2.0+ 脚本配置(其他APP自行转换配置):
************************
[Script]
# > hifini签到
hifini签到cookie = type=http-request,pattern=https:\/\/www.hifini.com\/my.htm,script-path=https://raw.githubusercontent.com/lowking/Scripts/master/hifini/hifiniSign.js
hifini签到 = type=cron,cronexp="0 10 0 * * ?",wake-system=1,script-path=https://raw.githubusercontent.com/lowking/Scripts/master/hifini/hifiniSign.js

[MITM]
hostname = %APPEND% *.hifini.com
*/
const lk = new ToolKit(`hifini签到`, `HifiniSignIn`, {"httpApi": "ffff@10.0.0.6:6166"})
const hifiniCookieKey = 'lkHifiniCookieKey'
const hifiniIsTakeTheFirst = 'lkHifiniIsTakeTheFirst'
const hifiniTakeTheFirstCount = 'lkHifiniTakeTheFirstCount'
const hifiniRunType = 'lkHifiniRunType'
const hifiniSec = 'lkHifiniSec'
const hifiniMsec = 'lkHifiniMsec'
const timeIntervalKey = 'lkHifiniTimeInterval'
const hifiniCookie = lk.getVal(hifiniCookieKey, '')
const isTakeTheFirst = lk.getVal(hifiniIsTakeTheFirst, false).o()
const takeTheFirstCount = lk.getVal(hifiniTakeTheFirstCount, 20)
const runType = lk.getVal(hifiniRunType, "1")
const sec = lk.getVal(hifiniSec, 59)
const msec = lk.getVal(hifiniMsec, 0)
const timeInterval = lk.getVal(timeIntervalKey, 100)

if (!lk.isExecComm) {
    if (lk.isRequest()) {
        getCookie()
        lk.done()
    } else {
        // 构建boxjs数据写入订阅
        lk.boxJsJsonBuilder({
            "icons": [
                "https://raw.githubusercontent.com/lowking/Scripts/master/doc/icon/hifinisignin-dark.png",
                "https://raw.githubusercontent.com/lowking/Scripts/master/doc/icon/hifinisignin.png"
            ],
            "settings": [
                {
                    "id": hifiniCookieKey,
                    "name": "hifini cookie",
                    "val": "",
                    "type": "text",
                    "desc": "hifini cookie"
                }, {
                    "id": hifiniIsTakeTheFirst,
                    "name": "是否抢签到第一",
                    "val": false,
                    "type": "boolean",
                    "desc": "默认关闭"
                }, {
                    "id": hifiniTakeTheFirstCount,
                    "name": "抢签到第一并发数",
                    "val": 20,
                    "type": "number",
                    "desc": "默认20"
                }, {
                    "id": hifiniSec,
                    "name": "抢签到等待至xx秒",
                    "val": 59,
                    "type": "number",
                    "desc": "默认59s"
                }, {
                    "id": hifiniMsec,
                    "name": "抢签到等待至xxx毫秒",
                    "val": 0,
                    "type": "number",
                    "desc": "默认0ms"
                }, {
                    "id": timeIntervalKey,
                    "name": "设定固定时间间隔",
                    "val": 100,
                    "type": "number",
                    "desc": "默认100ms"
                }, {
                    "id": hifiniRunType,
                    "name": "运行脚本方式",
                    "val": "1",
                    "type": "radios",
                    "items": [
                        {
                            "key": "1",
                            "label": "并发执行"
                        },
                        {
                            "key": "2",
                            "label": "顺序执行"
                        },
                        {
                            "key": "3",
                            "label": "固定时间间隔顺序执行"
                        }
                    ],
                    "desc": "默认并发执行"
                }
            ],
            "keys": [hifiniCookieKey]
        }, {
            "script_url": "https://github.com/lowking/Scripts/blob/master/hifini/hifiniSign.js",
            "author": "@lowking",
            "repo": "https://github.com/lowking/Scripts",
        })
        all()
    }
}

function getCookie() {
    if (lk.isMatch(/\/my.htm/)) {
        let headers = Object.keys($request.headers).reduce((obj, key) => {
            obj[key.toLowerCase()] = $request.headers[key]
            return obj
        }, {})
        if (headers.hasOwnProperty('cookie')) {
            lk.setVal(hifiniCookieKey, headers.cookie)
            lk.appendNotifyInfo('🎉成功获取hifini签到cookie，可以关闭相应脚本')
        } else {
            lk.appendNotifyInfo('❌获取hifini签到cookie失败')
        }
        lk.msg('')
    }
}

async function all() {
    if (hifiniCookie == '') {
        lk.execFail()
        lk.appendNotifyInfo(`⚠️请先先根据脚本注释获取cookie`)
    } else {
        let now = new Date()
        if (isTakeTheFirst && now.getHours() == 23) {
            // 如果时间是23点，就等待0点的时候再继续
            if (now.getMinutes() > 57) {
                while (1) {
                    if (now.getHours() != 23 || (now.getSeconds() >= sec && now.getMilliseconds() >= msec)) {
                        lk.log("跳出等待")
                        break
                    }
                    lk.log("等待中。。。")
                    await lk.sleep(100)
                    now = new Date()
                }
            }
            let execArr = []
            // 尝试同时请求20次，抢签到第一
            for (let i = 0; i < takeTheFirstCount; i++) {
                if (runType == "1") {
                    // 并发执行
                    execArr.push(signIn())
                } else if (runType == "2") {
                    // 顺序执行
                    let res = await signIn()
                    if (res.indexOf("suc") > -1) {
                        lk.execStatus = true
                        lk.appendNotifyInfo([res.substring(3)], 1)
                        break
                    }
                } else if (runType == "3") {
                    // 固定间隔时间执行
                    let finalTimeInterval = timeInterval * i
                    execArr.push(new Promise((resolve, reject) => {
                        setTimeout(async function () {
                            resolve(await signIn())
                        }, finalTimeInterval)
                    }))
                }
            }
            if (runType == "1" || runType == "3") {
                await Promise.all(execArr).then(async (res) => {
                    console.log(`${res}`)
                    let sucList = res.filter(str => {
                        return str !== undefined && str.indexOf("suc") != -1
                    })
                    // 只要有一个成功，就算成功
                    if (sucList.length >= 1) {
                        lk.execStatus = true
                        // 获取返回排名最靠前的
                        const regExp = new RegExp("排名(\\d+)", '')
                        let m
                        let min = 9999999
                        let minStr = sucList[0].substring(3)
                        sucList.forEach((info) => {
                            if ((m = regExp.exec(info + "")) !== null) {
                                let number = Number(m[1])
                                if (number < min) {
                                    min = number
                                    minStr = info.substring(3)
                                }
                            }
                        })
                        lk.appendNotifyInfo([minStr], 1)
                    } else {
                        lk.execFail()
                    }
                })
            }
        } else {
            await signIn()
        }
    }
    lk.msg(``)
    lk.done()
}

function signIn() {
    return new Promise((resolve, reject) => {
        lk.log("开始签到")
        const t = '签到'
        let url = {
            url: 'https://www.hifini.com/sg_sign.htm',
            headers: {
                cookie: hifiniCookie,
                "User-Agent": lk.userAgent
            }
        }
        lk.post(url, (error, response, data) => {
            try {
                if (error) {
                    lk.execFail()
                    lk.appendNotifyInfo(`❌${t}失败，请稍后再试`)
                } else {
                    let msg = data.split(`<h4 class="card-title text-center mb-0">`)[1].split(`</i>`)[1].split("<")[0]
                    if (msg) {
                        lk.appendNotifyInfo(`🎉${msg.trim()}`)
                        lk.log(msg.trim())
                        resolve(`suc🎉${msg.trim()}`)
                    } else {
                        lk.execFail()
                        lk.appendNotifyInfo(data)
                    }
                }
            } catch (e) {
                lk.logErr(e)
                lk.log(`返回数据：${data}`)
                lk.execFail()
                lk.appendNotifyInfo(`❌${t}错误，请带上日志联系作者，或稍后再试`)
                resolve(`fail`)
            } finally {
                resolve()
            }
        })
    })
}

// * ToolKit v1.5.0 build 204
function ToolKit(scriptName,scriptId,options){class Request{constructor(tk){this.tk=tk}fetch(options,method="GET"){options=typeof options=="string"?{url:options}:options;let fetcher;switch(method){case"PUT":fetcher=this.put;break;case"POST":fetcher=this.post;break;default:fetcher=this.get}const doFetch=new Promise((resolve,reject)=>{fetcher.call(this,options,(error,resp,data)=>error?reject({error,resp,data}):resolve({error,resp,data}))}),delayFetch=(promise,timeout=5e3)=>Promise.race([promise,new Promise((_,reject)=>setTimeout(()=>reject(new Error("请求超时")),timeout))]);return options.timeout>0?delayFetch(doFetch,options.timeout):doFetch}async get(options){return this.fetch.call(this.tk,options)}async post(options){return this.fetch.call(this.tk,options,"POST")}async put(options){return this.fetch.call(this.tk,options,"PUT")}}return new class{ab={info:1<<1,warn:1<<2,error:1<<3,debug:1<<4};aa={info:1<<1,warn:1<<2,error:1<<3,debug:1<<4};constructor(scriptName,scriptId,options){Object.prototype.s=function(replacer,space){return typeof this=="string"?this:JSON.stringify(this,replacer,space)},Object.prototype.o=function(reviver){return JSON.parse(this,reviver)},Object.prototype.getIgnoreCase=function(key){if(!key)throw"Key required";let target=this;try{typeof this=="string"&&(target=JSON.stringify(this))}catch{throw"It's not a JSON object or string!"}const ret=Object.keys(target).reduce((obj,key)=>(obj[key.toLowerCase()]=target[key],obj),{});return ret[key]},this.ab.warn|=this.aa.info,this.ab.error|=this.ab.warn,this.ab.debug|=this.ab.error,this.ac=this.ab.debug,this.userAgent=`Mozilla/5.0 (Macintosh; Intel Mac OS X 10_13_6) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/12.0.2 Safari/605.1.15`,this.a=`lk`,this.name=scriptName,this.id=scriptId,this.req=new Request(this),this.data=null,this.b=this.fb(`${this.a}${this.id}.dat`),this.c=this.fb(`${this.a}${this.id}.boxjs.json`),this.d=options,this.d?.logLevel&&(this.ac=this.ab[this.d.logLevel]),this.isExecComm=!1,this.f=this.getVal(`${this.a}IsEnableLog${this.id}`),this.f=!!this.isEmpty(this.f)||this.f.o(),this.g=this.getVal(`${this.a}NotifyOnlyFail${this.id}`),this.g=!this.isEmpty(this.g)&&this.g.o(),this.h=this.getVal(`${this.a}IsEnableTgNotify${this.id}`),this.h=!this.isEmpty(this.h)&&this.h.o(),this.i=this.getVal(`${this.a}TgNotifyUrl${this.id}`),this.h=this.h?!this.isEmpty(this.i):this.h,this.j=`${this.a}CostTotalString${this.id}`,this.k=this.getVal(this.j),this.k=this.isEmpty(this.k)?`0,0`:this.k.replace('"',""),this.l=this.k.split(",")[0],this.m=this.k.split(",")[1],this.n=0,this.o="█",this.p="  ",this.now=new Date,this.q=this.now.getTime(),this.node=(()=>{if(this.isNode()){const request=require("request");return{request}}return null})(),this.r=!0,this.s=[],this.t="chavy_boxjs_cur__acs",this.u="chavy_boxjs__acs",this.v={"|`|":",backQuote,"},this.w={",backQuote,":"`","%2CbackQuote%2C":"`"},this.y={"_":"\\_","*":"\\*","`":"\\`"},this.x={"_":"\\_","*":"\\*","[":"\\[","]":"\\]","(":"\\(",")":"\\)","~":"\\~","`":"\\`",">":"\\>","#":"\\#","+":"\\+","-":"\\-","=":"\\=","|":"\\|","{":"\\{","}":"\\}",".":"\\.","!":"\\!"},this.log(`${this.name}, 开始执行!`),this.fd()}fb(_a){if(!this.isNode())return _a;let _b=process.argv.slice(1,2)[0].split("/");return _b[_b.length-1]=_a,_b.join("/")}fc(_a){const _c=this.path.resolve(_a),_d=this.path.resolve(process.cwd(),_a),_e=this.fs.existsSync(_c),_f=!_e&&this.fs.existsSync(_d);return{_c,_d,_e,_f}}async fd(){if(!this.isNode())return;if(this.e=process.argv.slice(1),this.e[1]!="p")return;this.isExecComm=!0,this.log(`开始执行指令【${this.e[1]}】=> 发送到其他终端测试脚本!`);let httpApi=this.d?.httpApi,_h;if(this.isEmpty(this?.d?.httpApi))this.log(`未设置options,使用默认值`),this.isEmpty(this?.d)&&(this.d={}),this.d.httpApi=`ffff@10.0.0.6:6166`,httpApi=this.d.httpApi,_h=httpApi.split("@")[1];else{if(typeof httpApi=="object")if(_h=this.isNumeric(this.e[2])?this.e[3]||"unknown":this.e[2],httpApi[_h])httpApi=httpApi[_h];else{const keys=Object.keys(httpApi);keys[0]?(_h=keys[0],httpApi=httpApi[keys[0]]):httpApi="error"}if(!/.*?@.*?:[0-9]+/.test(httpApi)){this.log(`❌httpApi格式错误!格式: ffff@3.3.3.18:6166`),this.done();return}}this.fe(this.e[2],_h,httpApi)}fe(timeout,_h,httpApi){let _i=this.e[0];const[_j,_k]=httpApi.split("@");this.log(`获取【${_i}】内容传给【${_h||_k}】`),this.fs=this.fs?this.fs:require("fs"),this.path=this.path?this.path:require("path");const{_c,_d,_e,_f}=this.fc(_i);if(!_e&&!_f){lk.done();return}const _m=_e?_c:_d;let options={url:`http://${_k}/v1/scripting/evaluate`,headers:{"X-Key":_j},body:{script_text:new String(this.fs.readFileSync(_m)),mock_type:"cron",timeout:!this.isEmpty(timeout)&&timeout>5?timeout:5},json:!0};this.req.post(options).then(({error,resp,data})=>{this.log(`已将脚本【${_i}】发给【${_h||_k}】,执行结果: 
${this.p}error: ${error}
${this.p}resp: ${resp?.s()}
${this.p}data: ${this.fj(data)}`),this.done()}).catch(e=>{let _ae="",_l=!1;if(e?.error?.code)switch(e.error.code){case"EHOSTDOWN":_ae=`请检查配置的目标设备【${_h||_k}】是否在线！`,_l=!0;break;case"ECONNREFUSED":_ae=`目标设备【${_h||_k}】拒绝连接，请确认服务端口已开启且可访问！`,_l=!0;break;case"EHOSTUNREACH":_ae=`无法到达目标设备【${_h||_k}】，请检查网络连接和路由设置！`,_l=!0;break;case"ENETUNREACH":_ae=`网络不可达，无法访问目标设备【${_h||_k}】，请检查本地网络环境！`,_l=!0;break;case"ETIMEDOUT":_ae=`连接目标设备【${_h||_k}】超时，请检查网络状况或目标设备响应状态！`,_l=!0;break;case"ECONNRESET":_ae=`与目标设备【${_h||_k}】的连接被重置，可能是设备重启或网络异常！`,_l=!0;break;case"ENOTFOUND":_ae=`未能解析目标设备地址【${_h||_k}】，请检查配置的主机名或DNS设置！`,_l=!0;break;case"EADDRINUSE":_ae=`本地端口已被占用，无法建立与目标设备【${_h||_k}】的连接！`,_l=!0;break;case"EACCES":_ae=`权限不足，无法访问目标设备【${_h||_k}】！`,_l=!0;break;default:_l=!1}if(!_l)throw e;this.log(_ae)})}boxJsJsonBuilder(info,param){if(!this.isNode())return;if(!this.isJsonObject(info)||!this.isJsonObject(param)){this.log("构建BoxJsJson传入参数格式错误,请传入json对象");return}let _p=param?.targetBoxjsJsonPath||"/Users/lowking/Desktop/Scripts/lowking.boxjs.json";if(!this.fs.existsSync(_p))return;this.log("using node");let _q=["settings","keys"];const _r="https://raw.githubusercontent.com/Orz-3";let boxJsJson={},scritpUrl="#lk{script_url}";if(boxJsJson.id=`${this.a}${this.id}`,boxJsJson.name=this.name,boxJsJson.desc_html=`⚠️使用说明</br>详情【<a href='${scritpUrl}?raw=true'><font class='red--text'>点我查看</font></a>】`,boxJsJson.icons=[`${_r}/mini/master/Alpha/${this.id.toLocaleLowerCase()}.png`,`${_r}/mini/master/Color/${this.id.toLocaleLowerCase()}.png`],boxJsJson.keys=[],boxJsJson.settings=[{id:`${this.a}IsEnableLog${this.id}`,name:"开启/关闭日志",val:!0,type:"boolean",desc:"默认开启"},{id:`${this.a}NotifyOnlyFail${this.id}`,name:"只当执行失败才通知",val:!1,type:"boolean",desc:"默认关闭"},{id:`${this.a}IsEnableTgNotify${this.id}`,name:"开启/关闭Telegram通知",val:!1,type:"boolean",desc:"默认关闭"},{id:`${this.a}TgNotifyUrl${this.id}`,name:"Telegram通知地址",val:"",type:"text",desc:"Tg的通知地址,如: https://api.telegram.org/bot-token/sendMessage?chat_id=-100140&parse_mode=Markdown&text="}],boxJsJson.author="#lk{author}",boxJsJson.repo="#lk{repo}",boxJsJson.script=`${scritpUrl}?raw=true`,!this.isEmpty(info))for(let key of _q){if(this.isEmpty(info[key]))break;if(key==="settings")for(let i=0;i<info[key].length;i++){let input=info[key][i];for(let j=0;j<boxJsJson.settings.length;j++){let def=boxJsJson.settings[j];input.id===def.id&&boxJsJson.settings.splice(j,1)}}boxJsJson[key]=boxJsJson[key].concat(info[key]),delete info[key]}Object.assign(boxJsJson,info),this.fs=this.fs?this.fs:require("fs"),this.path=this.path?this.path:require("path");const{_c,_d,_e,_f}=this.fc(this.c),_g=boxJsJson.s(null,"	");_e?this.fs.writeFileSync(_c,_g):_f?this.fs.writeFileSync(_d,_g):this.fs.writeFileSync(_c,_g);let boxjsJson=this.fs.readFileSync(_p).o();if(!boxjsJson?.apps||!Array.isArray(boxjsJson.apps)){this.log(`⚠️请在boxjs订阅json文件中添加根属性: apps, 否则无法自动构建`);return}let apps=boxjsJson.apps,targetIdx=apps.indexOf(apps.filter(app=>app.id==boxJsJson.id)[0]);targetIdx>=0?boxjsJson.apps[targetIdx]=boxJsJson:boxjsJson.apps.push(boxJsJson);let ret=boxjsJson.s(null,2);if(!this.isEmpty(param))for(const key in param){let val=param[key];if(!val)switch(key){case"author":val="@lowking";break;case"repo":val="https://github.com/lowking/Scripts";break;default:continue}ret=ret.replaceAll(`#lk{${key}}`,val)}const regex=/(?:#lk\{)(.+?)(?=\})/;let m=regex.exec(ret);m!==null&&this.log(`⚠️生成BoxJs还有未配置的参数,请参考:
${this.p}https://github.com/lowking/Scripts/blob/master/util/example/ToolKitDemo.js#L17-L19
${this.p}传入参数: `);let _n=new Set;for(;(m=regex.exec(ret))!==null;)_n.add(m[1]),ret=ret.replace(`#lk{${m[1]}}`,``);_n.forEach(p=>console.log(`${this.p}${p}`)),this.fs.writeFileSync(_p,ret)}isJsonObject(obj){return typeof obj=="object"&&Object.prototype.toString.call(obj).toLowerCase()=="[object object]"&&!obj.length}appendNotifyInfo(info,type){type==1?this.s=info:this.s.push(info)}prependNotifyInfo(info){this.s.splice(0,0,info)}execFail(){this.r=!1}isRequest(){return typeof $request!="undefined"}isSurge(){return typeof $httpClient!="undefined"}isQuanX(){return typeof $task!="undefined"}isLoon(){return typeof $loon!="undefined"}isJSBox(){return typeof $app!="undefined"&&typeof $http!="undefined"}isStash(){return"undefined"!=typeof $environment&&$environment["stash-version"]}isNode(){return typeof require=="function"&&!this.isJSBox()}sleep(ms){return this.n+=ms,new Promise(resolve=>setTimeout(resolve,ms))}randomSleep(minMs,maxMs){return this.sleep(this.randomNumber(minMs,maxMs))}randomNumber(min,max){return Math.floor(Math.random()*(max-min+1)+min)}log(message){if(!this.f)return;this.ac===this.ab.debug&&console.log(`
${this.o}DEBUG${this.o}${message}`)}info(message){if(!this.f)return;this.ac&this.aa.info&&console.log(`
${this.o}INFO${this.o}${message}`)}warn(message){if(!this.f)return;this.ac&this.aa.warn&&console.log(`
${this.o}WARN${this.o}${message}`)}error(message){if(!this.f)return;this.ac&this.aa.error&&console.log(`
${this.o}ERROR${this.o}${message}`)}debug(message){if(!this.f)return;this.ac===this.ab.debug&&console.log(`
${this.o}DEBUG${this.o}${message}`)}logErr(message){if(this.r=!0,this.f){let msg="";this.isEmpty(message.error)||(msg=`${msg}
${this.p}${message.error.s()}`),this.isEmpty(message.message)||(msg=`${msg}
${this.p}${message.message.s()}`),msg=`${this.o}${this.name}执行异常:${this.p}${msg}`,message&&(msg=`${msg}
${this.p}${message.s()}`),console.log(msg)}}ff(mapping,message){for(let key in mapping){if(!mapping.hasOwnProperty(key))continue;message=message.replaceAll(key,mapping[key])}return message}msg(subtitle,message,openUrl,mediaUrl,copyText,disappearS){if(!this.isRequest()&&this.g&&this.r)return;if(this.isEmpty(message)&&(Array.isArray(this.s)?message=this.s.join(`
`):message=this.s),this.isEmpty(message))return;if(this.h){this.log(`${this.name}Tg通知开始`);const fa=this.i&&this.i.indexOf("parse_mode=Markdown")!=-1;if(fa){message=this.ff(this.v,message);let _t=this.y;this.i.indexOf("parse_mode=MarkdownV2")!=-1&&(_t=this.x),message=this.ff(_t,message)}message=`📌${this.name}
${message}`,fa&&(message=this.ff(this.w,message));let u=`${this.i}${encodeURIComponent(message)}`;this.req.get({url:u})}else{let options={};const _u=!this.isEmpty(openUrl),_v=!this.isEmpty(mediaUrl),_w=!this.isEmpty(copyText),_x=disappearS>0;this.isSurge()||this.isLoon()||this.isStash()?(_u&&(options.url=openUrl,options.action="open-url"),_w&&(options.text=copyText,options.action="clipboard"),this.isSurge()&&_x&&(options["auto-dismiss"]=disappearS),_v&&(options["media-url"]=mediaUrl),$notification.post(this.name,subtitle,message,options)):this.isQuanX()?(_u&&(options["open-url"]=openUrl),_v&&(options["media-url"]=mediaUrl),$notify(this.name,subtitle,message,options)):this.isNode()?this.log("⭐️"+this.name+`
`+subtitle+`
`+message):this.isJSBox()&&$push.schedule({title:this.name,body:subtitle?subtitle+`
`+message:message})}}getVal(key,defaultValue){let value;return this.isSurge()||this.isLoon()||this.isStash()?value=$persistentStore.read(key):this.isQuanX()?value=$prefs.valueForKey(key):this.isNode()?(this.data=this.fh(),value=process.env[key]||this.data[key]):value=this.data&&this.data[key]||null,value||defaultValue}fg(key,val){if(key==this.u)return;const _y=`${this.a}${this.id}`;let _z=this.getVal(this.t,"{}").o();if(!_z.hasOwnProperty(_y))return;let curSessionId=_z[_y],_aa=this.getVal(this.u,"[]").o();if(_aa.length==0)return;let _ab=[];if(_aa.forEach(_ac=>{_ac.id==curSessionId&&(_ab=_ac.datas)}),_ab.length==0)return;let _ad=!1;_ab.forEach(kv=>{kv.key==key&&(kv.val=val,_ad=!0)}),_ad||_ab.push({key,val}),_aa.forEach(_ac=>{_ac.id==curSessionId&&(_ac.datas=_ab)}),this.setVal(this.u,_aa.s())}setVal(key,val){return this.isSurge()||this.isLoon()||this.isStash()?(this.fg(key,val),$persistentStore.write(val,key)):this.isQuanX()?(this.fg(key,val),$prefs.setValueForKey(val,key)):this.isNode()?(this.data=this.fh(),this.data[key]=val,this.fi(),!0):this.data&&this.data[key]||null}fh(){if(!this.isNode())return{};this.fs=this.fs?this.fs:require("fs"),this.path=this.path?this.path:require("path");const{_c,_d,_e,_f}=this.fc(this.b);if(_e||_f){const _m=_e?_c:_d;return this.fs.readFileSync(_m).o()}return{}}fi(){if(!this.isNode())return;this.fs=this.fs?this.fs:require("fs"),this.path=this.path?this.path:require("path");const{_c,_d,_e,_f}=this.fc(this.b),_g=this.data.s();_e?this.fs.writeFileSync(_c,_g):_f?this.fs.writeFileSync(_d,_g):this.fs.writeFileSync(_c,_g)}fj(data){const _s=`${this.p}${this.p}`;let ret="";return Object.keys(data).forEach(key=>{let lines=data[key]?.s().split(`
`);key=="output"&&(lines=lines.slice(0,-2)),ret=`${ret}
${_s}${key}:
${_s}${this.p}${lines?.join(`
${_s}${this.p}`)}`}),ret}fk(response){return response&&(response.status=response?.status||response?.statusCode,delete response.statusCode,response)}get(options,callback=()=>{}){this.isSurge()||this.isLoon()||this.isStash()?$httpClient.get(options,(error,response,body)=>{callback(error,this.fk(response),body)}):this.isQuanX()?(typeof options=="string"&&(options={url:options}),options.method="GET",$task.fetch(options).then(response=>{callback(null,this.fk(response),response.body)},reason=>callback(reason.error,null,null))):this.isNode()?this.node.request(options,(error,response,body)=>{callback(error,this.fk(response),body)}):this.isJSBox()&&(typeof options=="string"&&(options={url:options}),options.header=options.headers,options.handler=function(resp){let error=resp.error;error&&(error=resp.error.s());let body=resp.data;typeof body=="object"&&(body=resp.data.s()),callback(error,this.adapterStatus(resp.response),body)},$http.get(options))}post(options,callback=()=>{}){this.isSurge()||this.isLoon()||this.isStash()?$httpClient.post(options,(error,response,body)=>{callback(error,this.fk(response),body)}):this.isQuanX()?(typeof options=="string"&&(options={url:options}),options.method="POST",$task.fetch(options).then(response=>{callback(null,this.fk(response),response.body)},reason=>callback(reason.error,null,null))):this.isNode()?this.node.request.post(options,(error,response,body)=>{callback(error,this.fk(response),body)}):this.isJSBox()&&(typeof options=="string"&&(options={url:options}),options.header=options.headers,options.handler=function(resp){let error=resp.error;error&&(error=resp.error.s());let body=resp.data;typeof body=="object"&&(body=resp.data.s()),callback(error,this.adapterStatus(resp.response),body)},$http.post(options))}put(options,callback=()=>{}){this.isSurge()||this.isLoon()||this.isStash()?(options.method="PUT",$httpClient.put(options,(error,response,body)=>{callback(error,this.fk(response),body)})):this.isQuanX()?(typeof options=="string"&&(options={url:options}),options.method="PUT",$task.fetch(options).then(response=>{callback(null,this.fk(response),response.body)},reason=>callback(reason.error,null,null))):this.isNode()?(options.method="PUT",this.node.request.put(options,(error,response,body)=>{callback(error,this.fk(response),body)})):this.isJSBox()&&(typeof options=="string"&&(options={url:options}),options.header=options.headers,options.handler=function(resp){let error=resp.error;error&&(error=resp.error.s());let body=resp.data;typeof body=="object"&&(body=resp.data.s()),callback(error,this.adapterStatus(resp.response),body)},$http.post(options))}sum(a,b){let aa=Array.from(a,Number),bb=Array.from(b,Number),ret=[],c=0,i=Math.max(a.length,b.length);for(;i--;)c+=(aa.pop()||0)+(bb.pop()||0),ret.unshift(c%10),c=Math.floor(c/10);for(;c;)ret.unshift(c%10),c=Math.floor(c/10);return ret.join("")}fl(){let info=`${this.name}, 执行完毕!`;this.isNode()&&this.isExecComm&&(info=`指令【${this.e[1]}】执行完毕!`);const endTime=(new Date).getTime(),ms=endTime-this.q,fl=ms/1e3,count=this.sum(this.m,"1"),total=this.sum(this.l,ms.s()),average=(Number(total)/Number(count)/1e3).toFixed(4);info=`${info}
${this.p}耗时【${fl}】秒(含休眠${this.n?(this.n/1e3).toFixed(4):0}秒)`,info=`${info}
${this.p}总共执行【${count}】次,平均耗时【${average}】秒`,info=`${info}
${this.p}ToolKit v1.5.0 build 204.`,this.log(info),this.setVal(this.j,`${total},${count}`.s())}done(value={}){this.fl(),(this.isSurge()||this.isQuanX()||this.isLoon()||this.isStash())&&$done(value)}getRequestUrl(){return $request.url}getResponseBody(){return $response.body}isMatch(reg){return!!($request.method!="OPTIONS"&&this.getRequestUrl().match(reg))}isEmpty(obj){return typeof obj=="undefined"||obj==null||obj.s()=="{}"||obj==""||obj.s()=='""'||obj.s()=="null"||obj.s()=="undefined"||obj.length===0}isNumeric(s){return!isNaN(parseFloat(s))&&isFinite(s)}randomString(len,chars="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz1234567890"){len=len||32;let maxPos=chars.length,pwd="";for(let i=0;i<len;i++)pwd+=chars.charAt(Math.floor(Math.random()*maxPos));return pwd}autoComplete(str,prefix,suffix,fill,len,direction,ifCode,clen,startIndex,cstr){if(str+=``,str.length<len)for(;str.length<len;)direction==0?str+=fill:str=fill+str;if(ifCode){let temp=``;for(let i=0;i<clen;i++)temp+=cstr;str=str.substring(0,startIndex)+temp+str.substring(clen+startIndex)}return str=prefix+str+suffix,this.toDBC(str)}customReplace(str,param,prefix,suffix){try{this.isEmpty(prefix)&&(prefix="#{"),this.isEmpty(suffix)&&(suffix="}");for(let i in param)str=str.replace(`${prefix}${i}${suffix}`,param[i])}catch(e){this.logErr(e)}return str}toDBC(txtstring){let tmp="";for(let i=0;i<txtstring.length;i++)txtstring.charCodeAt(i)==32?tmp=tmp+String.fromCharCode(12288):txtstring.charCodeAt(i)<127&&(tmp=tmp+String.fromCharCode(txtstring.charCodeAt(i)+65248));return tmp}hash(str){let h=0,i,chr;for(i=0;i<str.length;i++)chr=str.charCodeAt(i),h=(h<<5)-h+chr,h|=0;return String(h)}formatDate(date,format){let o={"M+":date.getMonth()+1,"d+":date.getDate(),"H+":date.getHours(),"m+":date.getMinutes(),"s+":date.getSeconds(),"q+":Math.floor((date.getMonth()+3)/3),S:date.getMilliseconds()};/(y+)/.test(format)&&(format=format.replace(RegExp.$1,(date.getFullYear()+"").substr(4-RegExp.$1.length)));for(let k in o)new RegExp("("+k+")").test(format)&&(format=format.replace(RegExp.$1,RegExp.$1.length==1?o[k]:("00"+o[k]).substr((""+o[k]).length)));return format}getCookieProp(ca,cname){const name=cname+"=";ca=ca.split(";");for(let i=0;i<ca.length;i++){let c=ca[i].trim();if(c.indexOf(name)==0)return c.substring(name.length).replace('"',"").trim()}return""}parseHTML(htmlString){let parser=new DOMParser,document=parser.parseFromString(htmlString,"text/html");return document.body}}(scriptName,scriptId,options)}
