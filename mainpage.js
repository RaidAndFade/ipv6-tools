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
    max-width:800px;
}
</style>
<script>
function changepage(p){
    $(".nav-link").toggleClass("active",false)
    $("#"+p+"btn").toggleClass("active",true);
    $(".ip-form").hide();
    $("#"+p).show();
}

window.curval = null;

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

function calccidr(el){
    if(el.id == "inputcidr"){ // they changed the entire input. ez
        window.curval = getCIDRFromInput($("#inputcidr").val().trim())
    }

    $("#inputcidr").toggleClass("is-invalid",window.curval==null && $("#inputcidr").val() != "")
    $("#inputcidr").toggleClass("is-valid",window.curval!=null)

    if(window.curval != null){
        var cl = getClassFromKind(window.curval[1])
        if(window.curval[1] == "ipv6"){
            var first = cl.firstUsableAddressFromCIDR(window.curval[0]);
            var last = cl.lastUsableAddressFromCIDR(window.curval[0]);
            $("#ipcidr-first").val(first.toFixedLengthString())
            $("#ipcidr-last").val(last.toFixedLengthString())
            $("#ipcidr-extra1-label").text("Short")
            $("#ipcidr-extra1").val(first.toString() + "/" + window.curval[2][1])
            $("#ipcidr-extra2-label").text("Long")
            $("#ipcidr-extra2").val(first.toFixedLengthString() + "/" + window.curval[2][1])
        }else{
            var net = first = cl.networkAddressFromCIDR(window.curval[0]);
            var brd = last = cl.broadcastAddressFromCIDR(window.curval[0]);
            $("#ipcidr-extra1-label").text("Network")
            $("#ipcidr-extra1").val(net.toFixedLengthString())
            $("#ipcidr-extra2-label").text("Broadcast")
            $("#ipcidr-extra2").val(brd.toFixedLengthString())
            if(window.curval[2][1] < 31){
                first.octets[3] += 1;
                last.octets[3] -= 1;
            }
            $("#ipcidr-first").val(first.toFixedLengthString())
            $("#ipcidr-last").val(last.toFixedLengthString())
        }
    }else{
        $("#ipcidr-extra1").val("")
        $("#ipcidr-first").val("")
        $("#ipcidr-last").val("")
        $("#ipcidr-extra2").val("")
    }
}

function calcrdns(el){
    var val = $("#inputrdns").val().trim()

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

    $("#rdns-res-label").text(label)
    $("#rdns-res").val(result)
    $("#inputrdns").toggleClass("is-invalid",!valid)
    $("#inputrdns").toggleClass("is-valid",valid)
}

function calcnum(el){
    var val = $("#inputnum").val().trim()

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
        var subnet = window.ipaddr.parseCIDR($("#inputsubscidr").val().trim())
        var max_subs = subnet[0].kind()=="ipv4"?32:128;
        if(!changedCIDR){
        
            var possiblesubs = [];

            var optionshtml = "";
            for(var i=subnet[1]+1;i<=max_subs;i++){
                optionshtml += "<option value='"+i+"'>"+(BigInt(2)**BigInt(i-subnet[1]))+" Subnets (/"+i+")</option>"
            }
            var cidrselect = $("#inputsubssubnet").html(optionshtml);
        }

        var desired_sub = $("#inputsubssubnet").val()
        
        if(desired_sub != null && desired_sub > subnet[1] && desired_sub <= max_subs){
            desired_sub = parseInt(desired_sub)
            var html_out = "";
            
            var ipval = ip2bigint(subnet[0])

            var permutations = BigInt(2)**BigInt(desired_sub-subnet[1])
            var subnet_size = BigInt(2)**BigInt(max_subs-desired_sub)

            var ipprefix = ipval-ipval%(BigInt(2)**BigInt(max_subs-subnet[1]))
            for(var i=BigInt(0);i<permutations;i++){
                var subnet = ipprefix + subnet_size*i;
                html_out+="<input type='text' readonly class='form-control result-box' value='"+bigint2ip(subnet)+"/"+desired_sub+"'/>"
            }

            $("#subcalc-out").html(html_out);
        }
    }catch(e){
        valid=false;
    }

    $("#inputsubscidr").toggleClass("is-invalid",!valid)
    $("#inputsubscidr").toggleClass("is-valid",valid)
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
<script>
    navigator.serviceWorker.register("swcacher.sw.js",{"updateViaCache":"all"})
    
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
    <div id="ptitle" class="col-xs-12"><h1>IP Tools</h1></div>
    <ul class="col-xs-12 nav nav-tabs">
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
            <a class="nav-link" id="subsbtn" onclick="changepage('ip2cidr')">IPs to CIDRs</a>
        </li>
        <li class="nav-item">
            <a class="nav-link" id="subsbtn" onclick="changepage('mbpscalc')">mbps to GB/mo</a>
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
                <label for="subcalc-out" id="ntoa-out3-label" class="result-box-label col-12">Possible Subnets:</label>
                <div id="subcalc-out" class="col-12"></div>
            </div>
        </div>
    </div>
    <div id="ip2cidr" class="col-12 container justify-content-center ip-form">
        IPs to CIDRs is a Work In Progress...
    </div>
    <div id="mbpscalc" class="col-12 container justify-content-center ip-form">
        MBPS to GB/mo Calculator is a Work In Progress...
    </div>
</div>
</div>
<script>
changepage("ipcidr");
</script>
</body>
</html>
`