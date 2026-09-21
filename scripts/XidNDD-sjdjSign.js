/*

 @𝐗𝐢𝐝𝐍 𝐃𝐃    感谢红鲤鱼大佬
//++++++++++++++++++++++++++++++++-


⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️
先看说明 先看说明 先看说明

说明:

水晶DJ签到获得水晶听歌用 不是什么羊毛软件
 
圈x获取不到ck就把body改成header

⚠️签到的地方获取ck 1处获取ck的地方



小火箭:签到获取ck
水晶DJ = type=http-request,script-path=https://raw.githubusercontent.com/XidNDD/2020scripts/master/sjdjSign.js,pattern=^http:\/\/app\.oscaches\.com\/*,max-size=131072,requires-body=true,timeout=10,enable=true

定时 水晶DJ = type=cron,script-path=https://raw.githubusercontent.com/XidNDD/2020scripts/master/sjdjSign.js,cronexpr="0 0 0 * * *",timeout=10,enable=true






surge:签到获取ck
水晶DJ = type=http-request,pattern=^http:\/\/app\.oscaches\.com\/*,requires-body=1,max-size=0,script-path=https://raw.githubusercontent.com/XidNDD/2020scripts/master/sjdjSign.js

定时 水晶DJ = type=cron,cronexp=0 10 0 * * *,script-path=https://raw.githubusercontent.com/XidNDD/2020scripts/master/sjdjSign.js





圈x:签到获取ck
^http:\/\/app\.oscaches\.com\/* url script-request-body https://raw.githubusercontent.com/XidNDD/2020scripts/master/sjdjSign.js

定时 0 10 0 * * * https://raw.githubusercontent.com/XidNDD/2020scripts/master/sjdjSign.js, tag=水晶DJ, enabled=true






loon:签到获取ck
http-request ^http:\/\/app\.oscaches\.com\/* script-path=https://raw.githubusercontent.com/XidNDD/2020scripts/master/sjdjSign.js, requires-body=true, timeout=10, tag=水晶DJ


定时 cron "0 10 0 * * *" script-path=https://raw.githubusercontent.com/XidNDD/2020scripts/master/sjdjSign.js 




MITM=app.oscaches.com






*/










const $XidN = XidN();

const logs=0;//设置0关闭日志,1开启日志



//++++++++++++++++++++++++++++++++-


var dd="水晶DJAPP";





//++++++++++++++++++++++++++++++++


function main()
{
XidN_degin();}



 
async function XidN_degin()
 {
 let a0=await XidN_Sign();
 let a1=await XidN_completeTask();
 let a2=await XidN_getTask();
 log(dd,"",a0+a1+a2);
   
}



  
  
  



function XidN_Sign()
  {
  return  new Promise((resolve, reject) => {
    
   var result1="每日签到打卡";
   var result2="";

var appinterfacehd=$XidN.read("appinterfacehdname");
  const appinterface={
      url:"http://app.oscaches.com/index/appinterface/sign",
      headers:JSON.parse(appinterfacehd),
      timeout:60000};
  $XidN.post(appinterface,function(error, response, data) {
if (logs==1)console.log(data)
var obj=JSON.parse(data);
if(obj.code== 200)
result2="打卡成功✅";
else
if(obj.code== 0)
result2=obj.msg;
else
result2="签到失败获取cookie";
result2="【"+result1+"】"+result2+"\n";
console.log(result2);
resolve(result2);
})
})
}


function XidN_completeTask()
  {
  return  new Promise((resolve, reject) => {
    
   var result1="首页签到打卡";
   var result2="";

var appinterfacehd=$XidN.read("appinterfacehdname");
  const completeTask={
      url:"http://app.oscaches.com/index/appinterface/completeTask",
      headers:JSON.parse(appinterfacehd),
      body:'rule_id=2',
      timeout:60000};
  $XidN.post(completeTask,function(error, response, data) {
if (logs==1)console.log(data)
var obj=JSON.parse(data);
if(obj.code== 200)
result2="打卡成功✅";
else
if(obj.code==0)
result2=obj.msg;
else
result2="失败获取cookie";
result2="【"+result1+"】"+result2+"\n";
console.log(result2);
resolve(result2);
})
})
}
   
   
function XidN_getTask()
  {
  return  new Promise((resolve, reject) => {
    
   var result1="账户信息查询";
   var result2="";

var appinterfacehd=$XidN.read("appinterfacehdname");
  const getTask={
      url:"http://app.oscaches.com/index/appinterface/getTask",
      headers:JSON.parse(appinterfacehd),
      timeout:60000};
  $XidN.get(getTask,function(error, response, data) {
if (logs==1)console.log(data)
var obj=JSON.parse(data);
if(obj.code== 200)
result2="累计获🉐️"+obj.data.integral+"💎水晶";
else
result2="失败获取cookie";
result2="【"+result1+"】"+result2+"\n";
console.log(result2);
resolve(result2);
})
})
}








function XidN_sjdj() {

  if ($request.headers) {

 var urlval = $request.url;
var md_hd=$request.headers;
var md_bd=$request.body;

if(urlval.indexOf("index/appinterface/getTask")>=0)
{

var bo= $XidN.write(JSON.stringify(md_hd),"appinterfacehdname");

if (bo==true) 
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
  XidN_sjdj()
  $XidN.end()
} else {
  main();
  $XidN.end()
 }



function XidN() {
    const isRequest = typeof $request != "undefined"
    const isSurge = typeof $httpClient != "undefined"
    const isQuanX = typeof $task != "undefined"
    var link = {"open-url": "https://github.com", 
    "media-url" : "https://img01.sogoucdn.com/app/a/100520146/451bff539e596f3f04be6f7d230c68cc"};
    const notify = (title, subtitle, message) => {
        if (isQuanX) $notify(title, subtitle, message,link)
        if (isSurge) $notification.post(title, subtitle, message,{'openUrl':'wechat://','mediaUrl':'https://img01.sogoucdn.com/app/a/100520146/451bff539e596f3f04be6f7d230c68cc'})
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
    return { isRequest, isQuanX, isSurge, notify, write, read, get, post, end}
};

