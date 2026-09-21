/*

 @𝐗𝐢𝐝𝐍 𝐃𝐃    感谢红鲤鱼大佬
//++++++++++++++++++++++++++++++++-

京东读书 签到可以获得会员和阅读豆

不是会员签到可能只有经验值 自己测试

打开软件签到获取ck 签过到可能获取不到ck

 

surge:本地
京东读书签到 = type=http-request,pattern=^https:\/\/jdread-api\.jd\.com\/*,requires-body=1,max-size=0,script-path=https://raw.githubusercontent.com/XidNDD/2020scripts/master/jddsSign.js

定时 京东读书签到 = type=cron,cronexp=0 10 0 * * *,script-path=https://raw.githubusercontent.com/XidNDD/2020scripts/master/jddsSign.js



圈x:本地
^https:\/\/jdread-api\.jd\.com\/* url script-request-header https://raw.githubusercontent.com/XidNDD/2020scripts/master/jddsSign.js

定时 0 10 0 * * * https://raw.githubusercontent.com/XidNDD/2020scripts/master/jddsSign.js, tag=京东读书签到, enabled=true





loon:本地
http-request ^https:\/\/jdread-api\.jd\.com\/* script-path=https://raw.githubusercontent.com/XidNDD/2020scripts/master/jddsSign.js, requires-body=true, timeout=10, tag=京东读书签到


定时 cron "0 10 0 * * *" script-path=https://raw.githubusercontent.com/XidNDD/2020scripts/master/jddsSign.js, 




MITM= jdread-api.jd.com









*/





const $XidN = XidN();

const logs=0;//设置0关闭日志,1开启日志



//++++++++++++++++++++++++++++++++-


const jingdongdushu="京东读书𝐀𝐏𝐏";








//++++++++++++++++++++++++++++++++


function main()
{
XidN_degin();}



 
async function XidN_degin()
 {
let a0=await XidN_Sign();
 log(jingdongdushu,a0,"");
   
}



  
  
  



function XidN_Sign()
  {
  return  new Promise((resolve, reject) => {
    
   var result1="每日打卡✍🏻";
   var result2="";

var jddsurl=$XidN.read("jddsurlname");
var jddshd=$XidN.read("jddshdname");

  const llUrl1={
      url:jddsurl,
      headers:JSON.parse(jddshd),
      timeout:60000};
  $XidN.post(llUrl1,function(error, response, data) {
if (logs==1)console.log(data)
var obj=JSON.parse(data);
if(obj.result_code==0)
result2="签到✅"+obj.data.daily_award_message+","+obj.data.sign_data.sign_tip_info;
else if(obj.result_code==500)
result2="说明:"+obj.message;
else
result2="签到失败获取cookie";
result2="<"+result1+">"+result2+"\n";
console.log(result2)
resolve(result2);
})
})
}



   
   



function XidN_jdck() {

  if ($request.headers) {

 var urlval = $request.url;
var md_hd=$request.headers;
var md_bd=$request.body;

if(urlval.indexOf("jdread/api/sign?")>=0)
{

 var ao= $XidN.write(urlval,"jddsurlname");

var bo= $XidN.write(JSON.stringify(md_hd),"jddshdname");

if (ao==true&&bo==true) 
 log(jingdongdushu,"[获取签到数据]","✅成功");}

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
  XidN_jdck()
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






