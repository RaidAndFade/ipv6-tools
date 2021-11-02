module.exports = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<link rel="icon" href="data:;base64,iVBORw0KGgo=">
<meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no">
<title>{{title}}</title>
<style>{{bootstrapcss}}</style>
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
    font-family:Courier, monospace;
    font-size:0.8em!important;
    /* letter-spacing:-3px; */
}
.result-box-label { 
    font-family:Courier, monospace;
    font-size:0.8em!important;
    margin-bottom: 0px;
}
#page-container{
    padding-top:20px;
}
#ptitle {
    text-align: center;
}
.subtbl-split{
    background-color: #f0f6fb;
}
.subtbl-clickable{
    cursor: pointer;
}
.subtbl-clickable:hover{
    cursor: pointer;
    background-color: #fafbf2;
}
.nav-link{
    color: inherit !important;
}
.nav-link:focus, .nav-link:hover{
    border-bottom-color: transparent !important;
}
</style>
<script>
const pagefuncs = {
    "ipcidr":calccidr,
    "rdns":calcrdns,
    "ntoa":calcnum,
    "subs":calcsubnetlist,
    "subtbl":calcsubnettable,
    "ip2cidr":calcrange,
    "mbpscalc":calcmbps,
    'about':()=>{}
}
function gotopage(p){
    if(p in pagefuncs){
        window.curdetails = {page:p,vals:{}}
        updateHash()
    }
}
function changepage(p){
    document.querySelectorAll(".nav-link").forEach(e=>e.classList.remove("active"))
    document.querySelector("#"+p+"btn").classList.add("active");
    document.querySelectorAll(".ip-form").forEach(e=>e.style.display="none");
    document.querySelector("#"+p).style.display="block";

    gtag('config', 'UA-86131150-6', { "page_path": "#"+p });

    if(p in pagefuncs){
        pagefuncs[p](null)
    }
}
function loadHash(){
    if(window.location.hash){
        var hashval = JSON.parse(atob(window.location.hash.slice(1)))
        window.curdetails = hashval;
    }
    window.firstload = true
    try{
        changepage(window.curdetails['page'])
    }catch(e){}
    window.firstload = false
}
function updateHash(){
    var hashval = btoa(JSON.stringify(window.curdetails))
    window.location.hash = hashval
}

function getInputVal(i){
    var v = document.querySelector(i).value.trim()
    if(window.firstload && i in window.curdetails['vals']){
        v = window.curdetails['vals'][i]
        document.querySelector(i).value = v
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

function netmask_ip_to_cidr(i){
    var binary_repr = ip2bigint(i).toString(2)

    var lastonepos = binary_repr.lastIndexOf("1")
    var firstzeropos = binary_repr.indexOf("0")

    if((binary_repr.length==32 || binary_repr.length==128) && (lastonepos < firstzeropos || firstzeropos==-1 || lastonepos==-1)){
        return lastonepos+1;
    }
    return null;
}

function getCIDRFromInput(i){
    try{
        c = window.ipaddr.parseCIDR(i)
        return [i, c[0].kind(), c, true]
    }catch(e){
        try{
            if(i.indexOf("/")>=0){
                ip = window.ipaddr.process(i.split("/")[0]) 
                netmask=window.ipaddr.process(i.split("/")[1])
                if(ip.kind() != netmask.kind()) return null;
                i=i.split("/")[0];
            }else{
                ip = window.ipaddr.process(i) 
                netmask = window.ipaddr.process(ip.kind()=="ipv4"?"255.255.255.255":"ffff:ffff:ffff:ffff:ffff:ffff:ffff:ffff")
            }
            nm_cidr = netmask_ip_to_cidr(netmask)
            if(nm_cidr==null) return null;
            return [i+"/"+nm_cidr, ip.kind(), window.ipaddr.parseCIDR(i+"/"+nm_cidr),false]
        }catch(e){
            console.log(e)
            return null;
        }
    }
}

function calccidr(el,firstload=false){
    var curvaltxt = getInputVal("#inputcidr")
    var curval = getCIDRFromInput(curvaltxt)

    document.querySelector("#inputcidr").classList.toggle("is-invalid", curval==null && curval != "")
    document.querySelector("#inputcidr").classList.toggle("is-valid", curval!=null)

    if(curval != null){
        var cl = getClassFromKind(curval[1])
        if(curval[1] == "ipv6"){
            var first = cl.firstUsableAddressFromCIDR(curval[0]);
            var last = cl.lastUsableAddressFromCIDR(curval[0]);
            document.querySelector("#ipcidr-first").value = first.toFixedLengthString()
            document.querySelector("#ipcidr-last").value = last.toFixedLengthString()
            document.querySelector("#ipcidr-extra1-label").textContent = "Short"
            document.querySelector("#ipcidr-extra1").value = first.toString() + "/" + curval[2][1]
            document.querySelector("#ipcidr-extra2-label").textContent = "Long"
            document.querySelector("#ipcidr-extra2").value = first.toFixedLengthString() + "/" + curval[2][1]

            document.querySelector("#ipcidr-extra3-label").textContent = curval[3]?"Netmask":"CIDR"
            document.querySelector("#ipcidr-extra3").value = curval[3]?bigint2ip(BigInt("0b"+"1".repeat(curval[2][1])+"0".repeat(128-curval[2][1]))).toFixedLengthString():curval[2][1]
        }else{
            var net = first = cl.networkAddressFromCIDR(curval[0]);
            var brd = last = cl.broadcastAddressFromCIDR(curval[0]);
            document.querySelector("#ipcidr-extra1-label").textContent = "Network"
            document.querySelector("#ipcidr-extra1").value = net.toFixedLengthString()
            document.querySelector("#ipcidr-extra2-label").textContent = "Broadcast"
            document.querySelector("#ipcidr-extra2").value = brd.toFixedLengthString()

            document.querySelector("#ipcidr-extra3-label").textContent = curval[3]?"Netmask":"CIDR"
            document.querySelector("#ipcidr-extra3").value = curval[3]?bigint2ip(BigInt("0b"+"1".repeat(curval[2][1])+"0".repeat(32-curval[2][1]))).toFixedLengthString():curval[2][1]

            if(curval[2][1] < 31){
                first.octets[3] += 1;
                last.octets[3] -= 1;
            }
            document.querySelector("#ipcidr-first").value = first.toFixedLengthString()
            document.querySelector("#ipcidr-last").value = last.toFixedLengthString()
        }
        saveInputVal("#inputcidr",curvaltxt)
    }else{
        document.querySelector("#ipcidr-first").value = ""
        document.querySelector("#ipcidr-last").value = ""
        document.querySelector("#ipcidr-extra1").value = ""
        document.querySelector("#ipcidr-extra2").value = ""
        document.querySelector("#ipcidr-extra3").value = ""
    }
}

function calcrdns(el){
    var val = getInputVal("#inputrdns")// document.querySelector("#inputrdns").value.trim()

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

    document.querySelector("#rdns-res-label").textContent = label
    document.querySelector("#rdns-res").value = result
    document.querySelector("#inputrdns").classList.toggle("is-invalid",!valid)
    document.querySelector("#inputrdns").classList.toggle("is-valid",valid)
}

function calcnum(el){
    var val = getInputVal("#inputnum") //document.querySelector("#inputnum").value.trim()

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

            document.querySelector("#ntoa-out"+cur_out+"-label").textContent = x+":"
            document.querySelector("#ntoa-out"+cur_out).value = possible_outputs[x][0](ipval)
            cur_out += 1
        }
        saveInputVal("#inputnum",val)
    }else{
        for(var i=1;i<=4;i++){
            document.querySelector("#ntoa-out"+i+"-label").textContent = "Output:"
            document.querySelector("#ntoa-out"+i).value = ""
        }
    }

    document.querySelector("#inputnum").classList.toggle("is-invalid",!valid)
    document.querySelector("#inputnum").classList.toggle("is-valid",valid)
}

function splittblleaf(id,el){
    var subnettxt = getInputVal("#inputsubtblcidr")
    try{
        var subnet = window.ipaddr.parseCIDR(subnettxt)
        var max_subs = subnet[0].kind()=="ipv4"?32n:128n;
        console.log(id);
        if(bigint_log2(id)+1+subnet[1]<=max_subs && bigint_log2(id)>=0 && id>=0 ){
            window.subtblbreakdown.push(id.toString());
            calcsubnettable(null);
        }
    }catch(e){}
}

function mergetblleaf(id,el){
    console.log(id);
    window.subtblbreakdown.splice(window.subtblbreakdown.indexOf(id),1);
    calcsubnettable(null);
}

function clearsubnettable(){
    window.subtblbreakdown=[];
    calcsubnettable(null);
}

function calcsubnettable(el){
    const show_only_most_specific = true;

    var subnettxt = getInputVal("#inputsubtblcidr")
    try{
        var subnet = window.ipaddr.parseCIDR(subnettxt)
    }catch(e){
        document.querySelector("#inputsubtblcidr").classList.toggle("is-invalid",true)
        document.querySelector("#inputsubtblcidr").classList.toggle("is-valid",false)
        return;
    }
    document.querySelector("#inputsubtblcidr").classList.toggle("is-invalid",false)
    document.querySelector("#inputsubtblcidr").classList.toggle("is-valid",true)

    var max_subs = subnet[0].kind()=="ipv4"?32n:128n;

    if(!window.subtblbreakdown){
        window.subtblbreakdown=window.curdetails['subtbl']||[];
    }

    var tblbreakdown = window.subtblbreakdown;
    if(curdetails['tbldata'])
        tblbreakdown = curdetails['tbldata']
    
    var output = [];
    var merges = [];
    var tobreak = [1n];
    var maxdepth = 0n;
    var sub_cidr = BigInt(subnet[1])
    while(tobreak.length>0){
        var breaking = tobreak.pop()
        var cursubdepth = BigInt(bigint_log2(breaking))

        if(breaking<0) continue;

        if(sub_cidr+cursubdepth>max_subs || cursubdepth<0) continue;
        
        if(cursubdepth > maxdepth) maxdepth = cursubdepth;

        if(tblbreakdown.indexOf(breaking+"")<0){
            output.push([cursubdepth,breaking]);
        }else{
            var leftleaf = (breaking<<1n)
            var rightleaf = (breaking<<1n)+1n
            
            tobreak.push(rightleaf)
            tobreak.push(leftleaf)
        }
    }

    var outtable = Object.assign(document.createElement("table"), {className: "table table-bordered table-hover table-sm"});

    emptycells = [];
    leafrowmap = {};
    rows = {};
    cur_ip_count = BigInt(0);
    var rowlens = {}

    var cl = getClassFromKind(subnet[0].kind())

    if(subnet[0].kind()=="ipv4")
        first_ip = cl.networkAddressFromCIDR(subnettxt)
    else
        first_ip = cl.firstUsableAddressFromCIDR(subnettxt)

    for(var y=0;y<output.length;y++){
        var row = document.createElement("tr");
        rows[y] = row;
        outtable.appendChild(row);
        var treeval = output[y];

        emptycells.push(treeval[1])
        leafrowmap[treeval[1]] = y;
        rowlens[treeval[1]] = 1

        new_subnet_cidr = sub_cidr+treeval[0]
        leaftext = "";

        new_subnet = bigint2ip(ip2bigint(first_ip) + cur_ip_count,first_ip.kind())

        if(new_subnet.kind() != first_ip.kind()){
            break
        }

        leaftext += new_subnet+"/"+(new_subnet_cidr);

        cur_ip_count += BigInt(2)<<BigInt(max_subs-new_subnet_cidr-1n)

        var leafcell = Object.assign(document.createElement("td"), {
            textContent: leaftext,
            colSpan: Number(maxdepth-treeval[0]+1n),
            className: "subtbl-expanded subtbl-clickable"
        })
        leafcell.addEventListener("click", splittblleaf.bind(null,treeval[1]))
        row.appendChild(leafcell)
    }


    while(emptycells.length>0){
        var leafid = -1n;
        for(i=0;i<emptycells.length;i++){
            if(emptycells[i]>leafid)leafid=emptycells[i];
        }
        if(leafid==-1)break;

        emptycells.splice(emptycells.indexOf(leafid),1)

        var leafrow = leafrowmap[leafid]

        if(!leafrow) continue;

        if(leafrowmap[leafid-1n] == leafrow-rowlens[leafid-1n]){
            var leaflen = rowlens[leafid-1n]
            var rowlen = rowlens[leafid-1n] + rowlens[leafid]

            delete leafrowmap[leafid];
            delete leafrowmap[leafid-1n];

            var depth = BigInt(bigint_log2(leafid))-1n

            var cell = Object.assign(document.createElement("td"), {
                textContent: "/"+(sub_cidr+depth),
                rowSpan: Number(rowlen),
                className: "subtbl-split"
            })
                
            if(rowlen == 2){
                cell.addEventListener("click", mergetblleaf.bind(null,leafid>>1n))
                cell.classList.add("subtbl-clickable")
            }
            rows[leafrow-leaflen].prepend(cell)
            leafrowmap[leafid>>1n] = leafrow-leaflen;
            rowlens[leafid>>1n] = rowlen
            emptycells.push(leafid>>1n)
        }
    }

/*        for(var x=maxdepth;x>0;x--){
            if(x==treeval[0]){
                var cell = Object.assign(document.createElement("td"), {textContent: treeval[1]+":"+(subnet[1]+treeval[0])})
                row.prepend(cell)
                if(x<maxdepth){
                    cell.colSpan=maxdepth-x+1
                }
            }else{
                var cell = Object.assign(document.createElement("td"), {textContent: treeval[1]+"{"+x+","+y+"}"})
                row.prepend(cell)
                emptycells.push(treeval[1])
            }
        }*/

    document.querySelector("#subtblcontainer").textContent = "";
    document.querySelector("#subtblcontainer").appendChild(outtable);

    window.curdetails['subtbl']=window.subtblbreakdown;
    // this calls updatehash, otherwise we would have to manually
    saveInputVal("#inputsubtblcidr",subnettxt)
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
            var cidrselect = document.querySelector("#inputsubssubnet").innerHTML = optionshtml;
        }

        var desired_sub = getInputVal("#inputsubssubnet") // document.querySelector("#inputsubssubnet").value
        
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

            document.querySelector("#subcalc-out").innerHTML = html_out
            saveInputVal("#inputsubscidr",subnettxt)
            saveInputVal("#inputsubssubnet",desired_sub)
        }
    }catch(e){
        valid=false;
    }

    document.querySelector("#inputsubscidr").classList.toggle("is-invalid",!valid)
    document.querySelector("#inputsubscidr").classList.toggle("is-valid",valid)
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
            document.querySelector(other_element).value = other_val
            saveInputVal(changed_element,changed_val,false)
            window.curdetails['vals']["last_change"]=mbps_changed
            updateHash()
        }else{
            valid=false;
        }
    }catch(e){valid=false;}
    
    document.querySelector(changed_element).classList.toggle("is-invalid",!valid)
    document.querySelector(other_element).classList.toggle("is-invalid",false)
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
    document.querySelector("#inputcidr-firstip").classList.toggle("is-invalid",!firstvalid)
    document.querySelector("#inputcidr-lastip").classList.toggle("is-invalid",!lastvalid)
    document.querySelector("#inputcidr-firstip").classList.toggle("is-valid",firstvalid)
    document.querySelector("#inputcidr-lastip").classList.toggle("is-valid",lastvalid)
    document.querySelector("#ip2cidr-out").innerHTML = html_out
}
</script>
<script>
{{bootstrapjs}}
{{ipaddrjs}}
{{bigintjs}}
</script>
<!-- <link rel="stylesheet" href="https://stackpath.bootstrapcdn.com/bootstrap/4.5.0/css/bootstrap.min.css" integrity="sha384-9aIt2nRpC12Uk9gS9baDl411NQApFmC26EwAOH8WgZl5MYYxFfc+NcPb1dKGj7Sk" crossorigin="anonymous"> -->
<!-- <script src="https://code.jquery.com/jquery-3.5.1.slim.min.js" integrity="sha384-DfXdz2htPH0lsSSs5nCTpuj/zy4C+OGpamoFVy38MVBnE+IbbVYUew+OrCXaRkfj" crossorigin="anonymous"></script> -->
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
      'linker': { 'domains': ['ipv6.tools', 'ipv4.tools'] },
      "send_page_view": false
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
                    return ip.toString().split(".").reverse().join(".")+".in-addr.arpa";
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
    <nav>
    <ul class="col-12 nav nav-tabs justify-content-center">
        <li class="nav-item">
            <a class="nav-link" id="ipcidrbtn" href="javascript:gotopage('ipcidr')">IP/CIDR</a>
        </li>
        <li class="nav-item">
            <a class="nav-link" id="rdnsbtn" href="javascript:gotopage('rdns')">rDNS</a>
        </li>
        <li class="nav-item">
            <a class="nav-link" id="ntoabtn" href="javascript:gotopage('ntoa')">IP-Numeric</a>
        </li>
        <li class="nav-item">
            <a class="nav-link" id="subsbtn" href="javascript:gotopage('subs')">Subnet Calc</a>
        </li>
        <li class="nav-item">
            <a class="nav-link" id="subtblbtn" href="javascript:gotopage('subtbl')">Subnet Table</a>
        </li>
        <li class="nav-item">
            <a class="nav-link" id="ip2cidrbtn" href="javascript:gotopage('ip2cidr')">IPs to CIDRs</a>
        </li>
        <li class="nav-item">
            <a class="nav-link" id="mbpscalcbtn" href="javascript:gotopage('mbpscalc')">mbps to GB/mo</a>
        </li>
        <li class="nav-item">
            <a class="nav-link" id="aboutbtn" href="javascript:gotopage('about')">About</a>
        </li>
    </ul>
    </nav>
    <div id="ipcidr" class="col-12 container justify-content-center ip-form">
        <div class="row data-row">
            <div class="col-12">
            <div class="input-group">
                <span class="input-group-text result-box" id="basic-addon1">IP/CIDR</span>
                <input id="inputcidr" type="text" class="form-control result-box" onkeyup='calccidr(this)' aria-describedby="basic-addon1">
            </div>
            </div>
        </div>
        <div class="row data-row">
            <div class="col-12 col-md-6">
                <label for="ipcidr-first" class="result-box-label col-12">First Usable</label>
                <input id="ipcidr-first" type="text" class="form-control result-box" readonly>
            </div>
            <div class="col-12 col-md-6">
                <label for="ipcidr-last" class="result-box-label col-12">Last Usable</label>
                <input id="ipcidr-last" type="text" class="form-control result-box" readonly>
            </div>
            <div class="col-12 col-md-6">
                <label for="ipcidr-extra1" id="ipcidr-extra1-label" class="result-box-label col-12">Network</label>
                <input id="ipcidr-extra1" type="text" class="form-control result-box" readonly>
            </div>
            
            <div class="col-12 col-md-6">
                <label for="ipcidr-extra2" id="ipcidr-extra2-label" class="result-box-label col-12">Broadcast</label>
                <input id="ipcidr-extra2" type="text" class="form-control result-box" readonly>
            </div>

            <div class="col-12 col-md-6">
                <label for="ipcidr-extra3" id="ipcidr-extra3-label" class="result-box-label col-12">Netmask/CIDR</label>
                <input id="ipcidr-extra3" type="text" class="form-control result-box" readonly>
            </div>
        </div>
        
    </div>
    <div id="rdns" class="col-12 container justify-content-center ip-form">
        <div class="row data-row">
            <div class="col-12">
            <div class="input-group">
                <span class="input-group-text result-box" id="basic-addon1">IP/rDNS</span>
                <input id="inputrdns" type="text" class="form-control result-box" onkeyup='calcrdns(this)' aria-describedby="basic-addon1">
            </div>
            </div>
        </div>
        <div class="row data-row">
            <div class="col-12">
                <label for="rdns-res" id="rdns-res-label" class="result-box-label col-12">Output:</label>
                <input id="rdns-res" type="text" class="form-control result-box" readonly>
            </div>
        </div>
    </div>
    <div id="ntoa" class="col-12 container justify-content-center ip-form">
        <div class="row data-row">
            <div class="col-12">
            <div class="input-group">
                <span class="input-group-text result-box" id="basic-addon1">IP/Number</span>
                <input id="inputnum" type="text" class="form-control result-box" onkeyup='calcnum(this)' aria-describedby="basic-addon1">
            </div>
            </div>
        </div>
        <div class="row data-row">
            <div class="col-12 col-md-6">
                <label for="ntoa-out1" id="ntoa-out1-label" class="result-box-label col-12">Output:</label>
                <input id="ntoa-out1" type="text" class="form-control result-box" readonly>
            </div>
            <div class="col-12 col-md-6">
                <label for="ntoa-out2" id="ntoa-out2-label" class="result-box-label col-12">Output:</label>
                <input id="ntoa-out2" type="text" class="form-control result-box" readonly>
            </div>
            <div class="col-12 col-md-6">
                <label for="ntoa-out3" id="ntoa-out3-label" class="result-box-label col-12">Output:</label>
                <input id="ntoa-out3" type="text" class="form-control result-box" readonly>
            </div>
            <div class="col-12 col-md-6">
                <label for="ntoa-out4" id="ntoa-out4-label" class="result-box-label col-12">Output:</label>
                <input id="ntoa-out4" type="text" class="form-control result-box" readonly>
            </div>
        </div>
    </div>
    <div id="subs" class="col-12 container justify-content-center ip-form">
        <div class="row data-row">
            <div class="col-12 col-sm-6">
            <div class="input-group">
                <span class="input-group-text result-box" id="basic-addon1">CIDR Prefix</span>
                <input id="inputsubscidr" type="text" class="form-control result-box" onkeyup='calcsubnetlist(this,false)' aria-describedby="basic-addon1">
            </div>
            </div>
            <div class="col-12 col-sm-6">
            <div class="input-group">
                <span class="input-group-text result-box" id="basic-addon1">Desired Subnets</span>
                <select id="inputsubssubnet" class="form-select result-box" onchange='calcsubnetlist(this,true)' aria-describedby="basic-addon1"></select>
            </div>
            </div>
        </div>
        <div class="row data-row">
            <div class="col-12">
                <label for="subcalc-out" class="result-box-label col-12">Possible Subnets:</label>
                <div id="subcalc-out" class="col-12"></div>
            </div>
        </div>
    </div>
    <div id="subtbl" class="col-12 container justify-content-center ip-form">
        <div class="row data-row">
            <div class="col-9">
            <div class="input-group">
                <span class="input-group-text result-box" id="basic-addon1">CIDR Prefix</span>
                <input id="inputsubtblcidr" type="text" class="form-control result-box" onkeyup='calcsubnettable(this)' aria-describedby="basic-addon1">
            </div>
            </div>
            <div class="col-3">
            <div class="input-group">
                <button class="btn btn-secondary btn-sm col-12" onclick='clearsubnettable()'>Reset</button>
            </div>
            </div>
        </div>
        <div id="subtblcontainer" class="row data-row px-3 mt-2">
        </div>
    </div>
    <div id="ip2cidr" class="col-12 container justify-content-center ip-form">
        <div class="row data-row">
            <div class="col-12 col-sm-6">
            <div class="input-group">
                <span class="input-group-text result-box" id="basic-addon1">First IP</span>
                <input id="inputcidr-firstip" type="text" class="form-control result-box" onkeyup='calcrange(this)' aria-describedby="basic-addon1">
            </div>
            </div>
            <div class="col-12 col-sm-6">
            <div class="input-group">
                <span class="input-group-text result-box" id="basic-addon1">Last IP</span>
                <input id="inputcidr-lastip" type="text" class="form-control result-box" onkeyup='calcrange(this)' aria-describedby="basic-addon1">
            </div>
            </div>
        </div>
        <div class="row data-row">
            <div class="col-12">
                <label for="ip2cidr-out" class="result-box-label col-12">Encompassing Subnets:</label>
                <div id="ip2cidr-out" class="col-12"></div>
            </div>
        </div>
    </div>
    <div id="mbpscalc" class="col-12 container justify-content-center ip-form">
        <div class="row data-row">
            <div class="col-12 col-sm-6">
            <div class="input-group">
                <span class="input-group-text result-box" id="basic-addon1">mbps</span>
                <input id="inputmbps-rate" type="text" class="form-control result-box" onkeyup='calcmbps(this,true)' aria-describedby="basic-addon1">
            </div>
            </div>
            <div class="col-12 col-sm-6">
            <div class="input-group">
                <span class="input-group-text result-box" id="basic-addon2">GB/mo</span>
                <input id="inputmbps-gb" type="text" class="form-control result-box" onkeyup='calcmbps(this,false)' aria-describedby="basic-addon2">
            </div>
            </div>
        </div>
    </div>
    <div id="about" class="col-12 container justify-content-center ip-form">
        <div>
            <p>Welcome! This is an all-in-one networking utility made by <a href="https://github.com/raidandfade">RaidAndFade</a>. 
            <br>If you have any suggestions please feel free to make a PR or Issue on the <a href="https://github.com/RaidAndFade/ipv6-tools">Github Repo</a>.
            <br>Keep up with my projects on Discord. <a href="https://discord.gg/aEyewR5J">https://discord.gg/aEyewR5J</a>
            <br>Check out <a href="https://xenyth.cloud">Xenyth Cloud</a>
            <br><br>Tips and Tricks for IP Tools:
            <br><ul>
                <li>Your link stores your input! Share your input with others or save it for later.</li>
                <li>Both ipv4.tools and ipv6.tools support IPv4 and IPv6, the name is just cosmetic.</li>
                <li>The site uses service workers, and is fully self-contained. You can use it offline after first load!</li>
            </ul>
            </p>
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
