let SESSION=null;

async function upload(){
let file=document.getElementById("file").files[0];
let form=new FormData();
form.append("file",file);
let res=await fetch("/upload",{method:"POST",body:form});
let data=await res.json();
SESSION=data.session;
loadTable();
fillColumns(data.columns);
}

async function loadTable(){
let res=await fetch("/table/"+SESSION);
let rows=await res.json();
let table=document.getElementById("table");
table.innerHTML="";
if(rows.length==0)return;
let header="<tr>";
Object.keys(rows[0]).forEach(c=>header+="<th>"+c+"</th>");
header+="</tr>";
table.innerHTML+=header;
rows.forEach(r=>{
let tr="<tr>";
Object.values(r).forEach(v=>tr+="<td>"+v+"</td>");
tr+="</tr>";
table.innerHTML+=tr;
});
}

async function searchData(){
let text=document.getElementById("search").value;
let res=await fetch("/search",{method:"POST",headers:{"Content-Type":"application/json"},
body:JSON.stringify({session:SESSION,text:text})});
let rows=await res.json();
let table=document.getElementById("table");
table.innerHTML="";
rows.forEach(r=>{
let tr="<tr>";
Object.values(r).forEach(v=>tr+="<td>"+v+"</td>");
tr+="</tr>";
table.innerHTML+=tr;
});
}

function fillColumns(cols){
let sel=document.getElementById("columns");
let rep=document.getElementById("replaceCol");
cols.forEach(c=>{
sel.innerHTML+=`<option>${c}</option>`;
rep.innerHTML+=`<option>${c}</option>`;
});
}

async function deleteCols(){
let sel=document.getElementById("columns");
let selected=[...sel.selectedOptions].map(o=>o.value);
await fetch("/delete",{method:"POST",headers:{"Content-Type":"application/json"},
body:JSON.stringify({session:SESSION,columns:selected})});
loadTable();
}

async function replaceValue(){
await fetch("/replace",{method:"POST",headers:{"Content-Type":"application/json"},
body:JSON.stringify({
session:SESSION,
column:document.getElementById("replaceCol").value,
old:document.getElementById("old").value,
new:document.getElementById("new").value
})});
loadTable();
}

function download(){
window.location="/download/"+SESSION;
}