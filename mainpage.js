module.exports = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<link rel="icon" href="data:;base64,iVBORw0KGgo=">
<meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no">
<title>{{title}}</title>
<style>
.ip-form {
    display: none;
    padding-top:15px;
    margin:5px;
}
.input-group { 
    padding-top:10px;
}
.result-box { 
    font-family:Courier;
    font-size:0.8em!important;
    /* letter-spacing:-3px; */
}
.result-box-label { 
    font-family:Courier;
    font-size:0.8em!important;
    margin-bottom: 0px;
}
#page-container{
    padding-top:20px;
    max-width:800px;
}
.nav-item{
    cursor: pointer;
}
#ptitle {
    text-align: center;
}
</style>
<script>
function changepage(p,cleardetails=true){
    $(".nav-link").toggleClass("active",false)
    $("#"+p+"btn").toggleClass("active",true);
    $(".ip-form").hide();
    $("#"+p).show();

    pagefuncs = {
        "ipcidr":calccidr,
        "rdns":calcrdns,
        "ntoa":calcnum,
        "subs":calcsubnetlist,
        "ip2cidr":calcrange,
        "mbpscalc":calcmbps
    }
    if(p in pagefuncs){
        if(cleardetails) window.curdetails = {page:p,vals:{}}
        pagefuncs[p](null)
        updateHash()
    }
}

function loadHash(){
    if(window.location.hash){
        var hashval = JSON.parse(atob(window.location.hash.slice(1)))
        window.curdetails = hashval;
    }
    window.firstload = true
    try{
        changepage(window.curdetails['page'],false)
    }catch(e){}
    window.firstload = false
}

function updateHash(){
    var hashval = btoa(JSON.stringify(window.curdetails))
    window.location.hash = hashval
}

function getInputVal(i){
    var v = $(i).val().trim()
    if(window.firstload && i in window.curdetails['vals']){
        v = window.curdetails['vals'][i]
        $(i).val(v)
    }

    return v;
}

function saveInputVal(i,v,update=true){
    window.curdetails['vals'][i]=v
    if(update)updateHash();
}

window.curdetails = {
    page:"ipcidr",
    vals:{"#inputcidr":"1.1.1.0/24"}
};

function getClassFromKind(kind){
    if(kind == "ipv4") return window.ipaddr.IPv4;
    else return window.ipaddr.IPv6
}

function getCIDRFromInput(i){
    try{
        c = window.ipaddr.parseCIDR(i)
        return [i, c[0].kind(), c]
    }catch(e){
        try{
            ip = window.ipaddr.process(i) 
            if(ip.kind()=="ipv4") return [i+"/32", "ipv4", window.ipaddr.parseCIDR(i+"/32")]
            else return [i+"/128", "ipv6", window.ipaddr.parseCIDR(i+"/128")]
        }catch(e){
            return null;
        }
    }
}

function calccidr(el,firstload=false){
    var curvaltxt = getInputVal("#inputcidr")
    var curval = getCIDRFromInput(curvaltxt)

    $("#inputcidr").toggleClass("is-invalid",curval==null && curval != "")
    $("#inputcidr").toggleClass("is-valid",curval!=null)

    if(curval != null){
        var cl = getClassFromKind(curval[1])
        if(curval[1] == "ipv6"){
            var first = cl.firstUsableAddressFromCIDR(curval[0]);
            var last = cl.lastUsableAddressFromCIDR(curval[0]);
            $("#ipcidr-first").val(first.toFixedLengthString())
            $("#ipcidr-last").val(last.toFixedLengthString())
            $("#ipcidr-extra1-label").text("Short")
            $("#ipcidr-extra1").val(first.toString() + "/" + curval[2][1])
            $("#ipcidr-extra2-label").text("Long")
            $("#ipcidr-extra2").val(first.toFixedLengthString() + "/" + curval[2][1])
        }else{
            var net = first = cl.networkAddressFromCIDR(curval[0]);
            var brd = last = cl.broadcastAddressFromCIDR(curval[0]);
            $("#ipcidr-extra1-label").text("Network")
            $("#ipcidr-extra1").val(net.toFixedLengthString())
            $("#ipcidr-extra2-label").text("Broadcast")
            $("#ipcidr-extra2").val(brd.toFixedLengthString())
            if(curval[2][1] < 31){
                first.octets[3] += 1;
                last.octets[3] -= 1;
            }
            $("#ipcidr-first").val(first.toFixedLengthString())
            $("#ipcidr-last").val(last.toFixedLengthString())
        }
        saveInputVal("#inputcidr",curvaltxt)
    }else{
        $("#ipcidr-extra1").val("")
        $("#ipcidr-first").val("")
        $("#ipcidr-last").val("")
        $("#ipcidr-extra2").val("")
    }
}

function calcrdns(el){
    var val = getInputVal("#inputrdns")// $("#inputrdns").val().trim()

    var a2i_val = arpa2ip(val);
    var valid = true;
    var label = "Output:";
    var result = "";

    if(a2i_val != null){
        label = "IP Address:"
        result = a2i_val.toFixedLengthString();
    }else{
        var i2a_val = ip2arpa(val);
        if(i2a_val != null){
            label = "rDNS Domain:"
            result = i2a_val;
        }else{
            valid=false;
        }
    }
    if(valid) 
        saveInputVal("#inputrdns",val)

    $("#rdns-res-label").text(label)
    $("#rdns-res").val(result)
    $("#inputrdns").toggleClass("is-invalid",!valid)
    $("#inputrdns").toggleClass("is-valid",valid)
}

function calcnum(el){
    var val = getInputVal("#inputnum") //$("#inputnum").val().trim()

    var outlabels = [];
    var outvalues = [];

    var valid = true;

    const max_ipv4 = BigInt(2)**BigInt(32)-BigInt(1);
    const max_ipv6 = BigInt(2)**BigInt(128)-BigInt(1);

    var possible_outputs = {
        "Hexadecimal": [(i)=>"0x"+i.toString(16),/0x[0-9a-fA-F]+/],
        "Decimal": [(i)=>i.toString(10),/[0-9]+/],
        "Binary": [(i)=>"0b"+i.toString(2),/0b[01]+/],
        "Octal": [(i)=>"0o"+i.toString(8),/0o[0-7]+/],
        "Address": [(i)=>bigint2ip(i).toFixedLengthString(),null]
    }
    var input_type = null;

    try{
        if(val.indexOf(".")==-1 && val.indexOf(":")==-1){
            throw "Invalid IP. But ipaddr likes to eat decimals so we need to check ourselves."
        }
        
        var ip = ipaddr.parse(val)
        var input_type = "Address";

        var ipval = ip2bigint(ip);
    }catch(e){
        for(var type in possible_outputs){
            if(possible_outputs[type][1]!=null && possible_outputs[type][1].test(val)){
                input_type = type;
                break;
            }
        }
        
        if(input_type != null){
            try{
                var ipval = BigInt(val)
                
                if(BigInt(0)>ipval || ipval>max_ipv6){
                    input_type = null;
                    valid = false;
                }
            }catch(e){
                valid=false;
            }
        }else{
            valid=false;
        }
    }
    

    if(input_type != null && valid){
        var cur_out=1;
        for(var x in possible_outputs){
            if(input_type == x) continue

            $("#ntoa-out"+cur_out+"-label").text(x+":")
            $("#ntoa-out"+cur_out).val(possible_outputs[x][0](ipval))
            cur_out += 1
        }
        saveInputVal("#inputnum",val)
    }else{
        for(var i=1;i<=4;i++){
            $("#ntoa-out"+i+"-label").text("Output:")
            $("#ntoa-out"+i).val("")
        }
    }

    $("#inputnum").toggleClass("is-invalid",!valid)
    $("#inputnum").toggleClass("is-valid",valid)
}

function calcsubnetlist(el, changedCIDR){
    var valid = true;

    try{
        var subnettxt = getInputVal("#inputsubscidr")
        var subnet = window.ipaddr.parseCIDR(subnettxt)
        var max_subs = subnet[0].kind()=="ipv4"?32:128;
        if(!changedCIDR){
        
            var possiblesubs = [];

            var optionshtml = "";
            for(var i=subnet[1]+1;i<=max_subs;i++){
                var boldstyle = i%(max_subs==128?4:8)==0&&i!=max_subs?"style='font-weight:bold'":"";
                optionshtml += "<option "+boldstyle+" value='"+i+"'>"+(BigInt(2)**BigInt(i-subnet[1]))+" Subnets (/"+i+")</option>"
            }
            var cidrselect = $("#inputsubssubnet").html(optionshtml);
        }

        var desired_sub = getInputVal("#inputsubssubnet") // $("#inputsubssubnet").val()
        
        if(desired_sub != null && desired_sub > subnet[1] && desired_sub <= max_subs){
            desired_sub = parseInt(desired_sub)
            var html_out = "";
            
            var ipval = ip2bigint(subnet[0])

            var permutations = BigInt(2)**BigInt(desired_sub-subnet[1])
            var subnet_size = BigInt(2)**BigInt(max_subs-desired_sub)

            var ipprefix = ipval-ipval%(BigInt(2)**BigInt(max_subs-subnet[1]))
            for(var i=BigInt(0);i<permutations;i++){
                if(i > BigInt(2048)){
                    html_out="Showing only the first "+i+" subnets. "+(permutations-i)+" subnets hidden.<br>"+html_out;
                    break;
                }
                var subnet_val = ipprefix + subnet_size*i;
                html_out+="<input type='text' readonly class='form-control result-box' value='"+bigint2ip(subnet_val,subnet[0].kind())+"/"+desired_sub+"'/>"
            }

            $("#subcalc-out").html(html_out)
            saveInputVal("#inputsubscidr",subnettxt)
            saveInputVal("#inputsubssubnet",desired_sub)
        }
    }catch(e){
        valid=false;
    }

    $("#inputsubscidr").toggleClass("is-invalid",!valid)
    $("#inputsubscidr").toggleClass("is-valid",valid)
}

function calcmbps(el, mbps_changed=null){
    var mbps_val, gb_val, valid=true;
    const mbps_to_gb = 86400*30.5/1000/8;

    if(mbps_changed == null && "last_change" in window.curdetails['vals'])
        mbps_changed=window.curdetails['vals']["last_change"]

    var changed_element = mbps_changed?"#inputmbps-rate":"#inputmbps-gb"
    var other_element =  mbps_changed?"#inputmbps-gb":"#inputmbps-rate"

    try{
        var changed_val = parseInt(getInputVal(changed_element))
        if(!isNaN(changed_val) && isFinite(changed_val)){
            var other_val = changed_val*(mbps_changed?mbps_to_gb:1/mbps_to_gb)
            $(other_element).val(other_val)
            saveInputVal(changed_element,changed_val,false)
            window.curdetails['vals']["last_change"]=mbps_changed
            updateHash()
        }else{
            valid=false;
        }
    }catch(e){valid=false;}
    
    $(changed_element).toggleClass("is-invalid",!valid)
    $(other_element).toggleClass("is-invalid",false)
}

var net_sizes = {"ipv4":{},"ipv6":{}};
for(var i=128;i>=0;i--){
    if(i<=32){
        net_sizes["ipv4"][i]=BigInt(2)**BigInt(32-i)
    }
    net_sizes["ipv6"][i]=BigInt(2)**BigInt(128-i)
}


function calcrange(el){
    var firstip,firstiptxt,lastip,lastiptxt,html_out="";
    var firstvalid=true,lastvalid=true;
    try{
        firstiptxt = getInputVal("#inputcidr-firstip")
        firstip=window.ipaddr.parse(firstiptxt)
    }catch(e){firstvalid=false;}
    try{
        lastiptxt = getInputVal("#inputcidr-lastip")
        lastip=window.ipaddr.parse(lastiptxt)
    }catch(e){lastvalid=false;}

    if(firstvalid && lastvalid){
        var firstval = ip2bigint(firstip);
        var lastval = ip2bigint(lastip);
        var single_ip_size = firstip.kind()=="ipv4"?32:128;
        if(firstip.kind()==lastip.kind() && firstval<=lastval){
            var netmap = [];

            var curval = firstval;
            while(curval<=lastval){
                var max_size = maxprefix(curval,firstip.kind())
                var val_dif = lastval-curval+BigInt(1);
                var max_diff = single_ip_size- bigint_log2(val_dif.toString());//Math.floor(val_dif.toString().length * Math.log2(10) + Math.log2(parseFloat("0." + val_dif)));
                
                var prefix = max_size>max_diff?max_size:max_diff;

                netmap.push([curval,prefix]);

                curval += net_sizes[firstip.kind()][prefix]
            }

            var count=0;
            for(var net of netmap){
                if(count++ > 2048){
                    html_out="Showing only the first "+i+" subnets. "+(permutations-i)+" subnets hidden.<br>"+html_out;
                    break;
                }
                html_out+="<input type='text' readonly class='form-control result-box' value='"+bigint2ip(net[0],firstip.kind()).toFixedLengthString()+"/"+net[1]+"'/>"
            }
            saveInputVal("#inputcidr-firstip",firstiptxt)
            saveInputVal("#inputcidr-lastip",lastiptxt)
        }else{
            firstvalid = false
            lastvalid = false;
        }
    }
    $("#inputcidr-firstip").toggleClass("is-invalid",!firstvalid)
    $("#inputcidr-lastip").toggleClass("is-invalid",!lastvalid)
    $("#inputcidr-firstip").toggleClass("is-valid",firstvalid)
    $("#inputcidr-lastip").toggleClass("is-valid",lastvalid)
    $("#ip2cidr-out").html(html_out)
}
</script>
<style>{{bootstrapcss}}</style>
<script>
{{jqueryjs}}
{{popperjs}}
{{bootstrapjs}}
{{ipaddrjs}}
{{bigintjs}}
</script>
<!-- <link rel="stylesheet" href="https://stackpath.bootstrapcdn.com/bootstrap/4.5.0/css/bootstrap.min.css" integrity="sha384-9aIt2nRpC12Uk9gS9baDl411NQApFmC26EwAOH8WgZl5MYYxFfc+NcPb1dKGj7Sk" crossorigin="anonymous"> -->
<!-- <script src="https://code.jquery.com/jquery-3.5.1.slim.min.js" integrity="sha384-DfXdz2htPH0lsSSs5nCTpuj/zy4C+OGpamoFVy38MVBnE+IbbVYUew+OrCXaRkfj" crossorigin="anonymous"></script> -->
<!-- <script src="https://cdn.jsdelivr.net/npm/popper.js@1.16.0/dist/umd/popper.min.js" integrity="sha384-Q6E9RHvbIyZFJoft+2mJbHaEWldlvI9IOYy5n3zV9zzTtmI3UksdQRVvoxMfooAo" crossorigin="anonymous"></script> -->
<!-- <script src="https://stackpath.bootstrapcdn.com/bootstrap/4.5.0/js/bootstrap.min.js" integrity="sha384-OgVRvuATP1z7JjHLkuOU7Xw704+h835Lr+6QL9UvYjZE3Ipu6Tp75j7Bh/kR0JKI" crossorigin="anonymous"></script> -->
<!-- <script src="https://cdnjs.cloudflare.com/ajax/libs/ipaddr.js/1.9.1/ipaddr.min.js" integrity="sha512-PjCdew0WqybdnWhii1fl13pGKtBEZEsvs7Y78JW7aNWFHZemM257wxVQxktnV3u8qU6i/qcOqWVPneUL+oCsWw==" crossorigin="anonymous"></script> -->
<!-- <script src="https://peterolson.github.io/BigInteger.js/BigInteger.min.js"></script> -->
<!-- Global site tag (gtag.js) - Google Analytics -->
<script async src="https://www.googletagmanager.com/gtag/js?id=UA-86131150-6"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());

  gtag('config', 'UA-86131150-6', {
  'linker': {
    'domains': ['ipv6.tools', 'ipv4.tools']
  }
});
</script>
<script>
    navigator.serviceWorker.register("swcacher.sw.js",{"updateViaCache":"all"})

    // Computes the number of 1-bits in a byte
    // Source: http://www.hackersdelight.org/hdcodetxt/pop.c.txt
    function countOneBits(x) {
        var _0x55555555 = BigInt(0x55555555);
        var _0x33333333 = BigInt(0x33333333);
        var _0x0f0f0f0f = BigInt(0x0F0F0F0F);
        var _0x0000003F = BigInt(0x0000003F);
        x = x - ((x >> BigInt(1)) & _0x55555555);
        x = (x & _0x33333333) + ((x >> BigInt(2)) & _0x33333333);
        x = (x + (x >> BigInt(4))) & _0x0f0f0f0f;
        x = x + (x >> BigInt(8));
        x = x + (x >> BigInt(16));
        return x & _0x0000003F;
    }

    function bigint_log2(x){
        for(var i=0;i<128;i++){
            if(x<net_sizes['ipv6'][128-i]){
                return i-1;
            }
        }
        return null;
    }

    function maxprefix(ip,kind="ipv4") {
        if(kind=="ipv4"){
            return countOneBits(-(ip & -(ip)))
        }else{
            var _0xffffffff = BigInt(0xffffffff);
            var _32n = BigInt(32);
            var num = -(ip & -(ip));
            var count = BigInt(0);
            for(var i=0;i<=3;i++){
                count += countOneBits(num & _0xffffffff)
                num = num>>_32n
            }
            return count 
        }
    }

    function arpa2ip(arpa){
        var v4arpa = arpa.match(/^((?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])(?:\\.(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])){3})\\.[iI][nN]-[aA][dD][dD][rR]\\.[aA][rR][pP][aA]$/)
        if(v4arpa != null){
            return new window.ipaddr.IPv4(v4arpa[1].split(".").reverse())
        }
        var v6arpa = arpa.match(/^((?:[0-9a-fA-F]\.){31}[0-9a-fA-F])\\.[iI][pP]6\\.[aA][rR][pP][aA]$/)
        if(v6arpa != null){
            var addr = [];
            var digits = v6arpa[1].split(".").reverse()
            for(var i=0;i<32;i+=2){
                addr.push((parseInt(digits[i],16)<<4)
                   +(parseInt(digits[i+1],16)))
            }
            return new window.ipaddr.IPv6(addr)
        }
        return null;
    }

    function ip2arpa(ip){
        try{
            var ip = ipaddr.parse(ip)
            if(ip != null){
                if(ip.kind() == "ipv4"){
                    return ip.toString().split(".").reverse().join(".")+".ip-addr.arpa";
                }else{
                    return ip.toFixedLengthString().replace(/:/g,"").split("").reverse().join(".")+".ip6.arpa";
                }
            }
        }catch(e){return null;}
    }

    function ip2bigint(ip){
        var ipval = BigInt(0);
        if(ip.kind()=="ipv4"){
            for(var i=0;i<4;i++){
                ipval = BigInt(ip.octets[i])+(ipval<<BigInt(8))
            }
        }else{
            for(var i=0;i<8;i++){
                ipval = BigInt(ip.parts[i])+(ipval<<BigInt(16))
            }
        }
        return ipval;
    }

    function bigint2ip(num,kind=null){
        var max_ipv4 = BigInt(2)**BigInt(32)-BigInt(1);
        if(kind == "ipv6" || (kind==null && num>max_ipv4)){
            var parts = [];
            for(var j=0;j<8;j++){
                parts.push(num&BigInt(0xffff))
                num=num>>BigInt(16)
            }
            return new ipaddr.IPv6(parts.reverse())
        }else{
            var parts = [];
            for(var j=0;j<4;j++){
                parts.push(num&BigInt(0xff))
                num=num>>BigInt(8)
            }
            return new ipaddr.IPv4(parts.reverse())
        }
    }

    {
        // Botch job #1, Remake the tostring and make them work.
        window.ipaddr.IPv6.oldparseCIDR = window.ipaddr.IPv6.parseCIDR
        function newparse(string){
            var r = this.oldparseCIDR(string);

            r.toString = function(){return this[0].toString()+"/"+this[1]}
            Object.defineProperty(r, "toFixedLengthString", {value:function(){return this[0].toFixedLengthString()+"/"+this[1]}})

            return r;
        }

        window.ipaddr.IPv6.parseCIDR = newparse;
    }

    // Botch job #2, make them similar in function (so that we can behave polymorphically)
    window.ipaddr.IPv4.prototype.toFixedLengthString = window.ipaddr.IPv4.prototype.toString
    window.ipaddr.IPv6.subnetMaskFromPrefixLength = function(len){
        var mask = [];
        var ones = len;
        var zeros = 128-len;
        while(ones>=8){
            mask.push(0b11111111)
            ones -= 8;
        }

        if(ones > 0){
            middle = 0b0;
            while(ones>0){
                middle = (1<<8)+middle>>1
                ones -= 1;
            }
            mask.push(middle)
        }
        
        zeros = zeros - zeros % 8
        for(var x=0;x<zeros/8;x++){
            mask.push(0b0);
        }
        return mask;
    }
    // window.ipaddr.IPv4.firstUsableAddressFromCIDR = function (cidr) {
    //     net = window.IPv4.networkAddressFromCIDR(cidr);
    //     net.octets[3]+=1;
    //     return net
    // }
    // window.ipaddr.IPv4.lastUsableAddressFromCIDR = function (cidr) {
    //     net = window.IPv4.broadcastAddressFromCIDR(cidr);
    //     net.octets[3]-=1;
    //     return net
    // }
    window.ipaddr.IPv6.firstUsableAddressFromCIDR = function (string) {
        let cidr, i, ipInterfaceOctets, octets, subnetMaskOctets;
        try {
            cidr = this.parseCIDR(string);
            ipInterfaceOctets = cidr[0].toByteArray();
            subnetMaskOctets = this.subnetMaskFromPrefixLength(cidr[1]);
            octets = [];
            i = 0;
            while (i < 16) {
                // Network address is bitwise AND between ip interface and mask
                octets.push(parseInt(ipInterfaceOctets[i], 10) & subnetMaskOctets[i]);
                i++;
            }
            return new this(octets);
        } catch (e) {
            console.log(e)
            throw new Error('ipaddr: the address does not have IPv6 CIDR format');
        }
    };
    
    // really gets the LAST address, but we're adapting to this library
    window.ipaddr.IPv6.lastUsableAddressFromCIDR = function (string) { 
        let cidr, i, ipInterfaceOctets, octets, subnetMaskOctets;
        try {
            cidr = this.parseCIDR(string);
            ipInterfaceOctets = cidr[0].toByteArray();
            subnetMaskOctets = this.subnetMaskFromPrefixLength(cidr[1]);
            octets = [];
            i = 0;
            while (i < 16) {
                // Network address is bitwise AND between ip interface and mask
                octets.push(parseInt(ipInterfaceOctets[i], 10) | subnetMaskOctets[i] ^ 255);
                i+=1;
            }
            return new this(octets);
        } catch (e) {
            console.log(e)
            throw new Error('ipaddr: the address does not have IPv6 CIDR format');
        }
    };
</script>
</head>
<body>
<div class="container" id="page-container">
    <div id="ptitle" class="col-12"><h1>IP Tools</h1></div>
    <ul class="col-12 nav nav-tabs justify-content-center">
        <li class="nav-item">
            <a class="nav-link" id="ipcidrbtn" onclick="changepage('ipcidr')">IP/CIDR</a>
        </li>
        <li class="nav-item">
            <a class="nav-link" id="rdnsbtn" onclick="changepage('rdns')">rDNS</a>
        </li>
        <li class="nav-item">
            <a class="nav-link" id="ntoabtn" onclick="changepage('ntoa')">IP-Numeric</a>
        </li>
        <li class="nav-item">
            <a class="nav-link" id="subsbtn" onclick="changepage('subs')">Subnet Calc</a>
        </li>
        <li class="nav-item">
            <a class="nav-link" id="ip2cidrbtn" onclick="changepage('ip2cidr')">IPs to CIDRs</a>
        </li>
        <li class="nav-item">
            <a class="nav-link" id="mbpscalcbtn" onclick="changepage('mbpscalc')">mbps to GB/mo</a>
        </li>
    </ul>
    <div id="ipcidr" class="col-12 container justify-content-center ip-form">
        <div class="row data-row">
            <div class="input-group col-12">
                <div class="input-group-prepend">
                <span class="input-group-text result-box" id="basic-addon1">IP/CIDR</span>
                </div>
                <input id="inputcidr" type="text" class="form-control result-box" onkeyup='calccidr(this)' aria-describedby="basic-addon1">
            </div>
        </div>
        <div class="row data-row">
            <div class="input-group inputGroup-sizing-sm col-12 col-md-6">
                <label for="ipcidr-first" class="result-box-label col-12">First Usable</label>
                <input id="ipcidr-first" type="text" class="form-control result-box" readonly>
            </div>
            <div class="input-group inputGroup-sizing-sm col-12 col-md-6">
                <label for="ipcidr-last" class="result-box-label col-12">Last Usable</label>
                <input id="ipcidr-last" type="text" class="form-control result-box" readonly>
            </div>
            <div class="input-group inputGroup-sizing-sm col-12 col-md-6">
                <label for="ipcidr-extra1" id="ipcidr-extra1-label" class="result-box-label col-12">Network</label>
                <input id="ipcidr-extra1" type="text" class="form-control result-box" readonly>
            </div>
            
            <div class="input-group inputGroup-sizing-sm col-12 col-md-6">
                <label for="ipcidr-extra2" id="ipcidr-extra2-label" class="result-box-label col-12">Broadcast</label>
                <input id="ipcidr-extra2" type="text" class="form-control result-box" readonly>
            </div>
        </div>
        
    </div>
    <div id="rdns" class="col-12 container justify-content-center ip-form">
        <div class="row data-row">
            <div class="input-group col-12">
                <div class="input-group-prepend">
                <span class="input-group-text result-box" id="basic-addon1">IP/rDNS</span>
                </div>
                <input id="inputrdns" type="text" class="form-control result-box" onkeyup='calcrdns(this)' aria-describedby="basic-addon1">
            </div>
        </div>
        <div class="row data-row">
            <div class="input-group inputGroup-sizing-sm col-12">
                <label for="rdns-res" id="rdns-res-label" class="result-box-label col-12">Output:</label>
                <input id="rdns-res" type="text" class="form-control result-box" readonly>
            </div>
        </div>
    </div>
    <div id="ntoa" class="col-12 container justify-content-center ip-form">
        <div class="row data-row">
            <div class="input-group col-12">
                <div class="input-group-prepend">
                <span class="input-group-text result-box" id="basic-addon1">IP/Number</span>
                </div>
                <input id="inputnum" type="text" class="form-control result-box" onkeyup='calcnum(this)' aria-describedby="basic-addon1">
            </div>
        </div>
        <div class="row data-row">
            <div class="input-group inputGroup-sizing-sm col-12 col-md-6">
                <label for="ntoa-out1" id="ntoa-out1-label" class="result-box-label col-12">Output:</label>
                <input id="ntoa-out1" type="text" class="form-control result-box" readonly>
            </div>
            <div class="input-group inputGroup-sizing-sm col-12 col-md-6">
                <label for="ntoa-out2" id="ntoa-out2-label" class="result-box-label col-12">Output:</label>
                <input id="ntoa-out2" type="text" class="form-control result-box" readonly>
            </div>
            <div class="input-group inputGroup-sizing-sm col-12 col-md-6">
                <label for="ntoa-out3" id="ntoa-out3-label" class="result-box-label col-12">Output:</label>
                <input id="ntoa-out3" type="text" class="form-control result-box" readonly>
            </div>
            <div class="input-group inputGroup-sizing-sm col-12 col-md-6">
                <label for="ntoa-out4" id="ntoa-out4-label" class="result-box-label col-12">Output:</label>
                <input id="ntoa-out4" type="text" class="form-control result-box" readonly>
            </div>
        </div>
    </div>
    <div id="subs" class="col-12 container justify-content-center ip-form">
        <div class="row data-row">
            <div class="input-group col-12 col-sm-6">
                <div class="input-group-prepend">
                <span class="input-group-text result-box" id="basic-addon1">CIDR Prefix</span>
                </div>
                <input id="inputsubscidr" type="text" class="form-control result-box" onkeyup='calcsubnetlist(this,false)' aria-describedby="basic-addon1">
            </div>
            <div class="input-group col-12 col-sm-6">
                <div class="input-group-prepend">
                <span class="input-group-text result-box" id="basic-addon1">Desired Subnets</span>
                </div>
                <select id="inputsubssubnet" class="form-control result-box" onchange='calcsubnetlist(this,true)' aria-describedby="basic-addon1"></select>
            </div>
        </div>
        <div class="row data-row">
            <div class="input-group inputGroup-sizing-sm col-12">
                <label for="subcalc-out" class="result-box-label col-12">Possible Subnets:</label>
                <div id="subcalc-out" class="col-12"></div>
            </div>
        </div>
    </div>
    <div id="ip2cidr" class="col-12 container justify-content-center ip-form">
        <div class="row data-row">
            <div class="input-group col-12 col-sm-6">
                <div class="input-group-prepend">
                <span class="input-group-text result-box" id="basic-addon1">First IP</span>
                </div>
                <input id="inputcidr-firstip" type="text" class="form-control result-box" onkeyup='calcrange(this)' aria-describedby="basic-addon1">
            </div>
            <div class="input-group col-12 col-sm-6">
                <div class="input-group-prepend">
                <span class="input-group-text result-box" id="basic-addon1">Last IP</span>
                </div>
                <input id="inputcidr-lastip" type="text" class="form-control result-box" onkeyup='calcrange(this)' aria-describedby="basic-addon1">
            </div>
        </div>
        <div class="row data-row">
            <div class="input-group inputGroup-sizing-sm col-12">
                <label for="ip2cidr-out" class="result-box-label col-12">Encompassing Subnets:</label>
                <div id="ip2cidr-out" class="col-12"></div>
            </div>
        </div>
    </div>
    <div id="mbpscalc" class="col-12 container justify-content-center ip-form">
        <div class="row data-row">
            <div class="input-group col-12 col-sm-6">
                <div class="input-group-prepend">
                <span class="input-group-text result-box" id="basic-addon1">mbps</span>
                </div>
                <input id="inputmbps-rate" type="text" class="form-control result-box" onkeyup='calcmbps(this,true)' aria-describedby="basic-addon1">
            </div>
            <div class="input-group col-12 col-sm-6">
                <div class="input-group-prepend">
                <span class="input-group-text result-box" id="basic-addon2">GB/mo</span>
                </div>
                <input id="inputmbps-gb" type="text" class="form-control result-box" onkeyup='calcmbps(this,false)' aria-describedby="basic-addon2">
            </div>
        </div>
    </div>
</div>
</div>
<script>
loadHash()
window.onhashchange = function(){
    loadHash()
}
</script>
</body>
</html>
`