/***

For Quantumult-X 631+ ONLY!!

[task_local]

event-interaction https://raw.githubusercontent.com/KOP-XIAO/QuantumultX/master/Scripts/traffic-check.js, tag=策略流量查询, img-url=https://raw.githubusercontent.com/Koolson/Qure/master/IconSet/Color/Download.png, enabled=true

ps. 简单查询策略/策略组流量使用统计（仅支持一/二级策略）

@XIAO_KOP

**/

const messageTraffic = {
    action: "get_traffic_statistics"
};

let version = Number($environment.version.split("build")[1])

let result = {
    "title" : "策略流量查詢"
}

var policy = $environment.params
const message = {
    action: "get_customized_policy",
    content: policy

};

let [datad, datau]= [0, 0] //总下载/上传流量
var checked = [] // 已经检查的节点名单
var checkedtraffic = [] //已检查节点的总用量

var pflag=1 //是否是策略，或者简单节点

//策略组 or 节点
$configuration.sendMessage(message).then(resolve => {
    if (resolve.error) {
        console.log(resolve.error);
        $done()
    }
    if (resolve.ret) {
        output=JSON.stringify(resolve.ret[message.content])? JSON.parse(JSON.stringify(resolve.ret[message.content]["candidates"])) : [$environment.params]
        pflag = JSON.stringify(resolve.ret[message.content])? pflag:0
        console.log("节点or策略组："+pflag)
        if (version >=631) {
            console.log("Build "+version)
            DisplayNodeTraffic(output,pflag)
        } else {
            console.log("Build "+version)
            $done({"title":result["title"],"message":"🚫 你的 APP 版本不支持使用此脚本\n\n💡 需要版本 1.0.28（631+）"})
        }
        
    }
    //$done();|
}, reject => {
    // Normally will never happen.
    $done();
});

function getJsonLength(jsonData){
    var jsonLength = 0;
    for(var item in jsonData){
       jsonLength++;
    }
    return jsonLength;
}


// 计算流量信息
var [Tdatad,Tdatau,Udatad,Udatau]=[0,0,0,0]
var total = 0
var gdnode = 0
var gdname = policy

function getServerTraffic(data,nodes){
    //console.log(data.name)
    let type = data.type
    let nname = data.name
    //console.log("下载用量："+(data.rx_transfer/1024/1024).toFixed(1)+"MB")
    if (nodes.indexOf(nname) != -1) {
        if (type == "tcp") {
            //console.log(typeof(Tdatad),typeof(Tdatau))
            Tdatad=(Number(Tdatad)+data.rx_transfer/1024/1024)
            Tdatau=(Number(Tdatau)+data.tx_transfer/1024/1024)
            //console.log(Tdatad,Tdatau)
        } else if (type == "udp") {
            Udatad=(Number(Udatad)+data.rx_transfer/1024/1024)
            Udatau=(Number(Udatau)+data.tx_transfer/1024/1024)
        }
        let total = (data.rx_transfer+data.tx_transfer)/1024/1024
        if (checked.indexOf(nname)==-1) {
            checked.push(nname)
            checkedtraffic.push(total)
        } else {
            checkedtraffic[checked.indexOf(nname)]=checkedtraffic[checked.indexOf(nname)]+total
        }
    } else {
    }      
}

//流量排序
function Rank(){
console.log(checked)
console.log(checkedtraffic)
    checked.sort((prev,next)=> {
        return checkedtraffic[checked.indexOf(next)]-checkedtraffic[checked.indexOf(prev)]
    })
    checkedtraffic.sort((prev,next)=> {
        return next-prev
    })
    console.log(checkedtraffic.map(item => item.toFixed(1)))
    let rst =  checked.map((name, i) => ([i+1,name,CUnit(checkedtraffic[i])].join(": ")))
    console.log(rst.join("\n"))
    let msg = ""
    if (checked.length>=3) {
        msg = "</br>🥇 "+checked[0]+" ☞ "+CUnit(checkedtraffic[0])+"</br></br>🥈 "+checked[1]+" ☞ "+CUnit(checkedtraffic[1])+"</br></br>🥉 "+checked[2]+" ☞ "+CUnit(checkedtraffic[2])
    } else if (checked.length==2) {
        msg = "</br>🥇 "+checked[0]+" ☞ "+CUnit(checkedtraffic[0])+"</br></br>🥈 "+checked[1]+" ☞ "+CUnit(checkedtraffic[1])
    } else if (checked.length==1) {
        msg = "</br>🥇 "+checked[0]+" ☞ "+CUnit(checkedtraffic[0])
    }
    //msg = `<p style="text-align: center; font-family: -apple-system; font-size: small;font-weight: thib">` + msg + `</p>`
    msg = msg!=""? "<font size=2 color=#16A085>"+msg+"</font>" :"<font size=3 color=#CD5C5C> </br></br>无使用节点流量记录</font>"
    return msg
}

//查询流量
function DisplayNodeTraffic(nodes,pflag) {
$configuration.sendMessage(messageTraffic).then(resolve => {
    if (resolve.error) {
        console.log(resolve.error);
    }
    if (resolve.ret) {
        let output=JSON.stringify(resolve.ret, null, 2);
        let len = getJsonLength(resolve.ret)
        for (var item in resolve.ret) {
            getServerTraffic(resolve.ret[item],nodes)
        }   
        //console.log(output);
        content = NodeData(nodes,pflag);
        //console.log(content)
        $done({"title":result["title"],"htmlMessage":content})
    }
    $done();
}, reject => {
    // Normally not gonna happen.
    $done();
});
}

//单位展示
function CUnit(cnt) {
    cnt = Number(cnt)>=1024? (cnt/1024).toFixed(2)+" GB " : cnt.toFixed(1)+" MB "
    return cnt
}

function NodeData(nodes,pflag){
    datad = "<b>TCP : </b>"+" <font color=#2874A6 > "+CUnit(Tdatad)+"⟱ </font>|  <font color=#9B59B6>"+CUnit(Tdatau)+"⟰ </font> "
    datau = "<b>UDP : </b>"+" <font color=#2874A6 > "+CUnit(Udatad)+"⟱ </font>|  <font color=#9B59B6>"+CUnit(Udatau)+"⟰ </font> "
    total = CUnit(Tdatad+Tdatau+Udatad+Udatau)
    Ncontent = "--------------------------------------</br></br>"+[datad,datau].join("</br></br>")+ "</br></br>--------------------------------------</br></br>"
    Ncontent = pflag == 0? Ncontent+"<font color=#CD5C5C>"+"<b>节点</b> ➟ " + policy+ " ☞ "+total+" 流量 </font></br>" : "<font color=#CD5C5C>"+"<b> 策略</b> ➟ " + policy+ " </br></br> 共 『"+checked.length+"/"+nodes.length+"』 个节点  ☞ "+total+" 流量 </font>"+Ncontent+" <font size=5 color=#16A085><b>🏆 排行榜 </b></br></font>"
    Ncontent = pflag == 0? Ncontent : Ncontent +Rank()
    Ncontent = `<p style="text-align: center; font-family: -apple-system; font-size: large; font-weight: thin">` + Ncontent + `</p>`
    //console.log(Ncontent)
    return Ncontent
}


