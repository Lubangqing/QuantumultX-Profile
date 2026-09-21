/*

 @𝐗𝐢𝐝𝐍 𝐃𝐃    感谢红鲤鱼大佬
//++++++++++++++++++++++++++++++++-



说明:

微商星球 签到可以获得微豆兑换会员  商店下载软件

圈x获取不到ck就把body改成header

打开软件签到获取ck 签过到可能获取不到ck

共有6处获取ck的地方 签到 观看视频 分享动态 考察项目 评论项目 收藏项目




surge:远程
微商星球 = type=http-request,pattern=^https:\/\/api\.momosyb\.com\/(v6|v1)\/(fans|user)\/*,requires-body=1,max-size=0,script-path=https://raw.githubusercontent.com/XidNDD/2020scripts/master/wsxqSign.js

定时 微商星球 = type=cron,cronexp=0 10 0 * * *,script-path=https://raw.githubusercontent.com/XidNDD/2020scripts/master/wsxqSign.js



圈x:远程
签到获取ck
^https:\/\/api\.momosyb\.com\/(v6|v1)\/(fans|user)\/* url script-request-body https://raw.githubusercontent.com/XidNDD/2020scripts/master/wsxqSign.js





定时 0 10 0 * * * https://raw.githubusercontent.com/XidNDD/2020scripts/master/wsxqSign.js, tag= 微商星球, enabled=true





loon:远程
签到获取ck
http-request ^https:\/\/api\.momosyb\.com\/(v6|v1)\/(fans|user)\/* script-path=https://raw.githubusercontent.com/XidNDD/2020scripts/master/wsxqSign.js, requires-body=true, timeout=10, tag=微商星球




定时 cron "0 10 0 * * *" script-path=https://raw.githubusercontent.com/XidNDD/2020scripts/master/wsxqSign.js




MITM= api.momosyb.com





*/














const $XidN = XidN();

const logs=0;//设置0关闭日志,1开启日志



//++++++++++++++++++++++++++++++++-


var dd="微商星球APP";





//++++++++++++++++++++++++++++++++


function main()
{
XidN_degin();}



 
async function XidN_degin()
 {
let a0=await XidN_Sign();
let a1=await XidN_spsign();
let a2=await XidN_signst();
let a3=await XidN_datasign();
let a4=await XidN_datas();
let a5=await XidN_datastate();
let a6=await XidN_balance();
 log(dd,"",a0+a1+a2+a3+a4+a5+a6);
   
}



  
  
  



function XidN_Sign()
  {
  return  new Promise((resolve, reject) => {
    
   var result1="每日打卡奖励🌟";
   var result2="";

var wsxqurl=$XidN.read("wsxqurlname");
var wsxqhd=$XidN.read("wsxqhdname");
  const llUrl1={
      url:wsxqurl,
      headers:JSON.parse(wsxqhd),
      timeout:60000};
  $XidN.get(llUrl1,function(error, response, data) {
if (logs==1)console.log(data)
var obj=JSON.parse(data);
if(obj.status== 0)
result2="✅签到"+",获得"+obj.datas.weidou+"微豆";
else
if(obj.status== -1)
result2="签到说明:"+obj.msg;
else
result2="签到失败获取cookie";
result2="<"+result1+">"+result2+"\n";
console.log(result2);
resolve(result2);
})
})
}


function XidN_spsign()
  {
  return  new Promise((resolve, reject) => {
    
   var result1="观看视频奖励🎦";
   var result2="";

var wsxqspurl=$XidN.read("wsxqspurlname");
var wsxqhd=$XidN.read("wsxqhdname");
  const llUrl1={
      url:wsxqspurl,
      headers:JSON.parse(wsxqhd),
      timeout:60000};
  $XidN.get(llUrl1,function(error, response, data) {
if (logs==1)console.log(data)
var obj=JSON.parse(data);
if(obj.status== 0)
result2="✅奖励"+obj.datas.weidou+"微豆";
else
if(obj.status== -1)
result2="失败:"+obj.msg;
else
result2="签到失败获取cookie";
result2="<"+result1+">"+result2+"\n";
console.log(result2);
resolve(result2);
})
})
}


function XidN_signst()
  {
  return  new Promise((resolve, reject) => {
    
   var result1="分享动态奖励✨";
   var result2="";

var wsxqdturl=$XidN.read("wsxqdturlname");
var wsxqhd=$XidN.read("wsxqhdname");
  const llUrl1={
      url:wsxqdturl,
      headers:JSON.parse(wsxqhd),
      timeout:60000};
  $XidN.get(llUrl1,function(error, response, data) {
if (logs==1)console.log(data)
var obj=JSON.parse(data);
if(obj.status== 0)
result2="✅奖励"+obj.datas.weidou+"微豆";
else
if(obj.status== -1)
result2="失败:"+obj.msg;
else
result2="签到失败获取cookie";
result2="<"+result1+">"+result2+"\n";
console.log(result2);
resolve(result2);
})
})
}

function XidN_datasign()
  {
  return  new Promise((resolve, reject) => {
    
   var result1="考察项目奖励💫";
   var result2="";

var wsxqkkurl=$XidN.read("wsxqkkurlname");
var wsxqhd=$XidN.read("wsxqhdname");
  const llUrl1={
      url:wsxqkkurl,
      headers:JSON.parse(wsxqhd),
      timeout:60000};
  $XidN.get(llUrl1,function(error, response, data) {
if (logs==1)console.log(data)
var obj=JSON.parse(data);
if(obj.status== 0)
result2="✅奖励"+obj.datas.weidou+"微豆";
else
if(obj.status== -1)
result2="失败:"+obj.msg;
else
result2="签到失败获取cookie";
result2="<"+result1+">"+result2+"\n";
console.log(result2);
resolve(result2);
})
})
}  
   

function XidN_datas()
  {
  return  new Promise((resolve, reject) => {
    
   var result1="评论项目奖励🔖";
   var result2="";

var wsxqppurl=$XidN.read("wsxqppurlname");
var wsxqhd=$XidN.read("wsxqhdname");
  const llUrl1={
      url:wsxqppurl,
      headers:JSON.parse(wsxqhd),
      timeout:60000};
  $XidN.get(llUrl1,function(error, response, data) {
if (logs==1)console.log(data)
var obj=JSON.parse(data);
if(obj.status== 0)
result2="✅奖励"+obj.datas.weidou+"微豆";
else
if(obj.status== -1)
result2="失败:"+obj.msg;
else
result2="签到失败获取cookie";
result2="<"+result1+">"+result2+"\n";
console.log(result2);
resolve(result2);
})
})
}  
   

function XidN_datastate()
  {
  return  new Promise((resolve, reject) => {
    
   var result1="收藏项目奖励➰";
   var result2="";

var wsxqssurl=$XidN.read("wsxqssurlname");
var wsxqhd=$XidN.read("wsxqhdname");
  const llUrl1={
      url:wsxqssurl,
      headers:JSON.parse(wsxqhd),
      timeout:60000};
  $XidN.get(llUrl1,function(error, response, data) {
if (logs==1)console.log(data)
var obj=JSON.parse(data);
if(obj.status== 0)
result2="✅奖励"+obj.datas.weidou+"微豆";
else
if(obj.status== -1)
result2="失败:"+obj.msg;
else
result2="签到失败获取cookie";
result2="<"+result1+">"+result2+"\n";
console.log(result2);
resolve(result2);
})
})
}  





function XidN_balance()
  {
  return  new Promise((resolve, reject) => {
    
   var result1="当前账号余额⚡️";
   var result2="";

var wsxqwdurl=$XidN.read("wsxqwdurlname");
var wsxqhd=$XidN.read("wsxqhdname");
  const llUrl1={
      url:wsxqwdurl,
      headers:JSON.parse(wsxqhd),
      timeout:60000};
  $XidN.get(llUrl1,function(error, response, data) {
if (logs==1)console.log(data)
var obj=JSON.parse(data);
if(obj.status== 0)
result2="累计"+obj.data.balance+"微豆";

else
result2="签到失败获取cookie";
result2="<"+result1+">"+result2+"\n";
console.log(result2);
resolve(result2);
})
})
}  









function XidN_wsxq() {

  if ($request.headers) {

 var urlval = $request.url;
var md_hd=$request.headers;
var md_bd=$request.body;

if(urlval.indexOf("taskweidou?do=daily_sign&")>=0)
{

 var ao= $XidN.write(urlval,"wsxqurlname");
var bo= $XidN.write(JSON.stringify(md_hd),"wsxqhdname");

if (ao==true&&bo==true) 
 log(dd,"[获取签到数据]","✅成功");}

else
if(urlval.indexOf("taskweidou?do=reward_weidou&task_id=2&")>=0)
{

 var ao= $XidN.write(urlval,"wsxqspurlname");

if (ao==true) 
 log(dd,"[获取观看视频数据]","✅成功");}


else
if(urlval.indexOf("taskweidou?do=reward_weidou&task_id=3&")>=0)
{

 var ao= $XidN.write(urlval,"wsxqdturlname");

if (ao==true) 
 log(dd,"[获取分享动态数据]","✅成功");}

else
if(urlval.indexOf("&task_id=4&")>=0)
{

 var ao= $XidN.write(urlval,"wsxqkkurlname");

if (ao==true) 
 log(dd,"[获取考察项目数据]","✅成功");}

else
if(urlval.indexOf("taskweidou?do=reward_weidou&task_id=5&")>=0)
{

 var ao= $XidN.write(urlval,"wsxqppurlname");

if (ao==true) 
 log(dd,"[获取评论项目数据]","✅成功");}


else
if(urlval.indexOf("taskweidou?do=reward_weidou&task_id=6&")>=0)
{

 var ao= $XidN.write(urlval,"wsxqssurlname");

if (ao==true) 
 log(dd,"[获取收藏项目数据]","✅成功");}



else
if(urlval.indexOf("v1/user/weidou?")>=0)
{

 var ao= $XidN.write(urlval,"wsxqwdurlname");

if (ao==true) 
 log(dd,"[获取累计余额数据]","✅成功");}

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
  XidN_wsxq()
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




