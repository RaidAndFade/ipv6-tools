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
            if(window.curval[2][1] != 32){
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
</script>
<link rel="stylesheet" href="https://stackpath.bootstrapcdn.com/bootstrap/4.5.0/css/bootstrap.min.css" integrity="sha384-9aIt2nRpC12Uk9gS9baDl411NQApFmC26EwAOH8WgZl5MYYxFfc+NcPb1dKGj7Sk" crossorigin="anonymous">
<script src="https://code.jquery.com/jquery-3.5.1.slim.min.js" integrity="sha384-DfXdz2htPH0lsSSs5nCTpuj/zy4C+OGpamoFVy38MVBnE+IbbVYUew+OrCXaRkfj" crossorigin="anonymous"></script>
<script src="https://cdn.jsdelivr.net/npm/popper.js@1.16.0/dist/umd/popper.min.js" integrity="sha384-Q6E9RHvbIyZFJoft+2mJbHaEWldlvI9IOYy5n3zV9zzTtmI3UksdQRVvoxMfooAo" crossorigin="anonymous"></script>
<script src="https://stackpath.bootstrapcdn.com/bootstrap/4.5.0/js/bootstrap.min.js" integrity="sha384-OgVRvuATP1z7JjHLkuOU7Xw704+h835Lr+6QL9UvYjZE3Ipu6Tp75j7Bh/kR0JKI" crossorigin="anonymous"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/ipaddr.js/1.9.1/ipaddr.min.js" integrity="sha512-PjCdew0WqybdnWhii1fl13pGKtBEZEsvs7Y78JW7aNWFHZemM257wxVQxktnV3u8qU6i/qcOqWVPneUL+oCsWw==" crossorigin="anonymous"></script>
<script src="https://peterolson.github.io/BigInteger.js/BigInteger.min.js"></script>
<script>
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
            <a class="nav-link" id="ntoabtn" onclick="changepage('ntoa')">Binary/Decimal/Hex</a>
        </li>
        <li class="nav-item">
            <a class="nav-link" id="subsbtn" onclick="changepage('subs')">Subnets</a>
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
</div>
</div>
<script>
(function(){
    changepage("ipcidr");
})();
</script>
</body>
</html>
`