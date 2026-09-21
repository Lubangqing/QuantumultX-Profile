/*

 @𝐗𝐢𝐝𝐍 𝐃𝐃    感谢红鲤鱼大佬
//++++++++++++++++++++++++++++++++-


[红包]我的邀请码19570916，填了咱俩都拿钱[红包]


2020,9,25 增加时段奖励
时段奖励是每个小时一次奖励


说明:

圈x loon 签到和时段奖励都需要2个MITM 另外一个要自己抓包获取每个人不一样  抓包找到,签到的fasthome/taskcenter/init,时段奖励fasthome/coin/addcoin,的包会有一个类似于,183.146.18.877,这样的添加就好了,少一个MITM就获取不到ck

汽车之家极速版 签到可以获得金币兑换现金

圈x获取不到ck就把body改成header

打开软件签到获取ck 签过到可能获取不到ck






surge:远程
汽车之家极速版 = type=http-request,pattern=^https:\/\/mobile\.app\.autohome\.com\.cn\/fasthome\/*,requires-body=1,max-size=0,script-path=https://raw.githubusercontent.com/XidNDD/2020scripts/master/qczjSign.js

定时 汽车之家极速版 = type=cron,cronexp=0 10 0 * * *,script-path=https://raw.githubusercontent.com/XidNDD/2020scripts/master/qczjSign.js



圈x:远程
签到获取ck
^https:\/\/mobile\.app\.autohome\.com\.cn\/fasthome\/* url script-request-body https://raw.githubusercontent.com/XidNDD/2020scripts/master/qczjSign.js

时段奖励ck
^http:\/\/mobile\.app\.autohome\.com\.cn\/fasthome\/coin\/* url script-request-body https://raw.githubusercontent.com/XidNDD/2020scripts/master/qczjSign.js




定时 0 10 0 * * * https://raw.githubusercontent.com/XidNDD/2020scripts/master/qczjSign.js, tag= 汽车之家极速版, enabled=true





loon:远程
签到获取ck
http-request ^https?:\/\/mobile\.app\.autohome\.com\.cn\/fasthome\/* script-path=https://raw.githubusercontent.com/XidNDD/2020scripts/master/qczjSign.js, requires-body=true, timeout=10, tag=汽车之家极速版

时段获取ck
http-request ^http:\/\/mobile\.app\.autohome\.com\.cn\/fasthome\/coin\/* script-path=https://raw.githubusercontent.com/XidNDD/2020scripts/master/qczjSign.js, requires-body=true, timeout=10, tag=汽车之家极速版

时段获取ck上面的获取不到换这个
http-request ^http:\/\/填写\.你抓\.到的\.数字\/fasthome\/coin\/* script-path=https://raw.githubusercontent.com/XidNDD/2020scripts/master/qczjSign.js, requires-body=true, timeout=10, tag=汽车之家极速版




定时 cron "0 10 0 * * *" script-path=https://raw.githubusercontent.com/XidNDD/2020scripts/master/qczjSign.js 




MITM= mobile.app.autohome.com.cn





*/










const $XidN = XidN();

const logs=0;//设置0关闭日志,1开启日志



//++++++++++++++++++++++++++++++++-


const qichezhijia="汽车之家APP";








//++++++++++++++++++++++++++++++++


function main()
{
XidN_degin();}



 
async function XidN_degin()
 {
let a0=await XidN_Sign();
let a1=await XidN_qczjSign();
 papa(qichezhijia,"",a0+a1);
   
}



  
  
  



function XidN_Sign()
  {
  return  new Promise((resolve, reject) => {
    
   var result1="极速版打卡✍🏻";
   var result2="";

var qczjurl=$XidN.read("qczjurlname");
var qczjhd=$XidN.read("qczjhdname");
var qczjbd=$XidN.read("qczjbdname");
  const llUrl1={
      url:qczjurl,
      headers:JSON.parse(qczjhd),
      body:qczjbd,
      timeout:60000};
  $XidN.post(llUrl1,function(error, response, data) {
if (logs==1)console.log(data)
var obj=JSON.parse(data);
if(obj.result.list[0].sign.result.signalter== 1)
result2="✅签到"+",获得"+obj.result.list[0].nowcoin+"💰金币";
else if(obj.result.list[0].sign.result.signalter== 0)
result2="重复签到⚠️"+",连续签到"+obj.result.list[0].sign.result.signdaycount+"天",
result2+=",现金"+obj.result.list[0].nowmoney+"元💸"+",今日金币"+obj.result.list[0].nowcoin+"个";
else
result2="签到失败获取cookie";
result2="<"+result1+">"+result2+"\n";
console.log(result2);
resolve(result2);
})
})
}



   
   

function XidN_qczjSign()
  {
  return  new Promise((resolve, reject) => {
    
   var result1="时段奖励🌟";
   var result2="";

var qczjsdurl=$XidN.read("qczjsdurlname");
var qczjsdhd=$XidN.read("qczjsdhdname");
var qczjsdbd=$XidN.read("qczjsdbdname");

  const llUrl1={
      url:qczjsdurl,
      headers:JSON.parse(qczjsdhd),
      body:qczjsdbd,
      timeout:60000};
  $XidN.post(llUrl1,function(error, response, data) {
if (logs==1)console.log(data)
var obj=JSON.parse(data);
if(obj.returncode== 0)
result2="时段奖励✅,+10💰金币";
else if(obj.returncode== 111)
result2="说明,"+obj.message;

else
result2="领取失败获取cookie";
result2="<"+result1+">"+result2+"\n";
console.log(result2);
resolve(result2);






})
})
}

















function XidN_qczj() {

  if ($request.headers) {

 var urlval = $request.url;
var md_hd=$request.headers;
var md_bd=$request.body;

if(urlval.indexOf("fasthome/taskcenter/init")>=0)
{

 var ao= $XidN.write(urlval,"qczjurlname");
var so= $XidN.write(md_bd,"qczjbdname");

var bo= $XidN.write(JSON.stringify(md_hd),"qczjhdname");

if (ao==true&&bo==true&&so==true) 
 papa(qichezhijia,"[获取极速版签到数据]","✅成功");}


else
if(urlval.indexOf("fasthome/coin/addcoin")>=0)
{

 var ao= $XidN.write(urlval,"qczjsdurlname");
var so= $XidN.write(md_bd,"qczjsdbdname");
var bo= $XidN.write(JSON.stringify(md_hd),"qczjsdhdname");

if (ao==true&&bo==true&&so==true) 
 papa(qichezhijia,"[获取时段奖励数据]","✅成功");}








}  
}






function papa(x,y,z){

$XidN.notify(x,y,z);}
function getRandom(start, end, fixed = 0) {
  let differ = end - start
  let random = Math.random()
  return (start + differ * random).toFixed(fixed)
}

if ($XidN.isRequest) {
  XidN_qczj()
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

