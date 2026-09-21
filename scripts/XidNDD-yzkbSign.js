/*

 @𝐗𝐢𝐝𝐍 𝐃𝐃    感谢红鲤鱼大佬
//++++++++++++++++++++++++++++++++-


下载链接http://app.youzikuaibao.com/735RWMD


说明:

柚子快报 签到可以获得现金

圈x获取不到ck就把body改成header

打开软件签到获取ck 签过到可能获取ck不完整 导致签到报错






surge:远程
柚子快报 = type=http-request,pattern=^http?:\/\/hongbao\.youzikuaibao\.com\/youzi\/*,requires-body=1,max-size=0,script-path=https://raw.githubusercontent.com/XidNDD/2020scripts/master/yzkbSign.js

定时 柚子快报 = type=cron,cronexp=0 10 0 * * *,script-path=https://raw.githubusercontent.com/XidNDD/2020scripts/master/yzkbSign.js



圈x:远程
签到获取ck
^http?:\/\/hongbao\.youzikuaibao\.com\/youzi\/* url script-request-body https://raw.githubusercontent.com/XidNDD/2020scripts/master/yzkbSign.js





定时 0 10 0 * * * https://raw.githubusercontent.com/XidNDD/2020scripts/master/yzkbSign.js, tag= 柚子快报, enabled=true





loon:远程
签到获取ck
http-request ^http?:\/\/hongbao\.youzikuaibao\.com\/youzi\/* script-path=https://raw.githubusercontent.com/XidNDD/2020scripts/master/yzkbSign.js, requires-body=true, timeout=10, tag=柚子快报




定时 cron "0 10 0 * * *" script-path=https://raw.githubusercontent.com/XidNDD/2020scripts/master/yzkbSign.js




MITM= hongbao.youzikuaibao.com





*/














const $XidN = XidN();

const logs=0;//设置0关闭日志,1开启日志



//++++++++++++++++++++++++++++++++-


var dd="柚子快报APP";





//++++++++++++++++++++++++++++++++


function main()
{
XidN_degin();}



 
async function XidN_degin()
 {
let a0=await XidN_Sign();
 log(dd,"",a0);
   
}



  
  
  



function XidN_Sign()
  {
  return  new Promise((resolve, reject) => {
    
   var result1="每日打卡🌟";
   var result2="";

var yzkburl=$XidN.read("yzkburlname");
var yzkbhd=$XidN.read("yzkbhdname");
var yzkbbd=$XidN.read("yzkbbdname");
  const llUrl1={
      url:yzkburl,
      headers:JSON.parse(yzkbhd),
      body:yzkbbd,
      timeout:60000};
  $XidN.post(llUrl1,function(error, response, data) {
if (logs==1)console.log(data)
var obj=JSON.parse(data);
if(obj.code== 100)
result2="✅"+obj.msg+",奖励"+obj.money+"元💸";
else
if(obj.code== 201)
result2="说明:"+obj.msg;
else
result2="签到失败获取cookie";
result2="<"+result1+">"+result2+"\n";
console.log(result2);
resolve(result2);
})
})
}



   
   



function XidN_yzkb() {

  if ($request.headers) {

 var urlval = $request.url;
var md_hd=$request.headers;
var md_bd=$request.body;

if(urlval.indexOf("youzi/change/youzi.php")>=0)
{

 var ao= $XidN.write(urlval,"yzkburlname");
var so= $XidN.write(md_bd,"yzkbbdname");
var bo= $XidN.write(JSON.stringify(md_hd),"yzkbhdname");

if (ao==true&&bo==true&&so==true) 
 log(dd,"[获取签到数据]","✅成功");}

}  
}






function log(x,y,z){

$XidN.notify(x,y,z);}
function getRandom(start, end, fixed = 0) {
  let differ = end - start
  let random = Math.random()
  return (start + differ * random).toFixed(fixed)
}

if ($XidN.isRequest) {
  XidN_yzkb()
  $XidN.end()
} else {
  main();
  $XidN.end()
 }



function XidN() {
    const isRequest = typeof $request != "undefined"
    const isSurge = typeof $httpClient != "undefined"
    const isQuanX = typeof $task != "undefined"
    const notify = (title, subtitle, message) => {
        if (isQuanX) $notify(title, subtitle, message)
        if (isSurge) $notification.post(title, subtitle, message)
    }
    const write = (value, key) => {
        if (isQuanX) return $prefs.setValueForKey(value, key)
        if (isSurge) return $persistentStore.write(value, key)
    }
    const read = (key) => {
        if (isQuanX) return $prefs.valueForKey(key)
        if (isSurge) return $persistentStore.read(key)
    }
    const get = (options, callback) => {
        if (isQuanX) {
            if (typeof options == "string") options = { url: options }
            options["method"] = "GET"
            $task.fetch(options).then(response => {
                response["status"] = response.statusCode
                callback(null, response, response.body)
            }, reason => callback(reason.error, null, null))
        }
        if (isSurge) $httpClient.get(options, callback)
    }
    const post = (options, callback) => {
        if (isQuanX) {
            if (typeof options == "string") options = { url: options }
            options["method"] = "POST"
            $task.fetch(options).then(response => {
                response["status"] = response.statusCode
                callback(null, response, response.body)
            }, reason => callback(reason.error, null, null))
        }
        if (isSurge) $httpClient.post(options, callback)
    }
    const end = () => {
        if (isQuanX) isRequest ? $done({}) : ""
        if (isSurge) isRequest ? $done({}) : $done()
    }
    return { isRequest, isQuanX, isSurge, notify, write, read, get, post, end }
};




