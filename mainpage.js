module.exports = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
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

    if(window.curval != null){
        var cl = getClassFromKind(window.curval[1])
        var net = first = cl.networkAddressFromCIDR(window.curval[0]);
        var brd = last = cl.broadcastAddressFromCIDR(window.curval[0]);
        $("#ipcidr-net").val(net.toString())
        $("#ipcidr-broad").val(brd.toString())
        if(window.curval[1]=="ipv4" && window.curval[2][1] != 32){
            first.octets[3] += 1;
            last.octets[3] -= 1;
        }
        $("#ipcidr-first").val(first.toString())
        $("#ipcidr-last").val(last.toString())
    }else{
        $("#ipcidr-net").val("")
        $("#ipcidr-first").val("")
        $("#ipcidr-last").val("")
        $("#ipcidr-broad").val("")
    }
}
</script>
<link rel="stylesheet" href="https://stackpath.bootstrapcdn.com/bootstrap/4.5.0/css/bootstrap.min.css" integrity="sha384-9aIt2nRpC12Uk9gS9baDl411NQApFmC26EwAOH8WgZl5MYYxFfc+NcPb1dKGj7Sk" crossorigin="anonymous">
<script src="https://code.jquery.com/jquery-3.5.1.slim.min.js" integrity="sha384-DfXdz2htPH0lsSSs5nCTpuj/zy4C+OGpamoFVy38MVBnE+IbbVYUew+OrCXaRkfj" crossorigin="anonymous"></script>
<script src="https://cdn.jsdelivr.net/npm/popper.js@1.16.0/dist/umd/popper.min.js" integrity="sha384-Q6E9RHvbIyZFJoft+2mJbHaEWldlvI9IOYy5n3zV9zzTtmI3UksdQRVvoxMfooAo" crossorigin="anonymous"></script>
<script src="https://stackpath.bootstrapcdn.com/bootstrap/4.5.0/js/bootstrap.min.js" integrity="sha384-OgVRvuATP1z7JjHLkuOU7Xw704+h835Lr+6QL9UvYjZE3Ipu6Tp75j7Bh/kR0JKI" crossorigin="anonymous"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/ipaddr.js/1.9.1/ipaddr.min.js" integrity="sha512-PjCdew0WqybdnWhii1fl13pGKtBEZEsvs7Y78JW7aNWFHZemM257wxVQxktnV3u8qU6i/qcOqWVPneUL+oCsWw==" crossorigin="anonymous"></script>
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
                <span class="input-group-text" id="basic-addon1">IP/CIDR</span>
                </div>
                <input id="inputcidr" type="text" class="form-control" onkeyup='calccidr(this)' aria-describedby="basic-addon1">
            </div>
        </div>
        <div class="row data-row">
            <div class="input-group col-12 col-md-6">
                <div class="input-group-prepend">
                <span class="input-group-text" id="basic-addon1">Network</span>
                </div>
                <input id="ipcidr-net" type="text" class="form-control" disabled aria-describedby="basic-addon1">
            </div>
            <div class="input-group col-12 col-md-6">
                <div class="input-group-prepend">
                <span class="input-group-text" id="basic-addon1">Broadcast</span>
                </div>
                <input id="ipcidr-broad" type="text" class="form-control" disabled aria-describedby="basic-addon1">
            </div>
            <div class="input-group col-12 col-md-6">
                <div class="input-group-prepend">
                <span class="input-group-text" id="basic-addon1">First</span>
                </div>
                <input id="ipcidr-first" type="text" class="form-control" disabled aria-describedby="basic-addon1">
            </div>
            <div class="input-group col-12 col-md-6">
                <div class="input-group-prepend">
                <span class="input-group-text" id="basic-addon1">Last</span>
                </div>
                <input id="ipcidr-last" type="text" class="form-control" disabled aria-describedby="basic-addon1">
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