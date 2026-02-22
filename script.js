let data = [];
let headers = [];
let history = [];

/* رفع الملف */
document.getElementById("fileInput").addEventListener("change", function(e){
    const file = e.target.files[0];
    const reader = new FileReader();

    reader.onload = function(evt){
        const workbook = XLSX.read(evt.target.result, {type:'binary'});
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const json = XLSX.utils.sheet_to_json(sheet, {header:1});

        headers = json[0];
        data = json.slice(1);

        document.getElementById("tools").style.display="block";

        fillColumnSelectors();
        renderTable(data);
    };

    reader.readAsBinaryString(file);
});

/* عرض الجدول */
function renderTable(rows){
    let html="<table border='1' style='width:100%;background:white;color:black'>";
    html+="<tr>";
    headers.forEach(h=>html+="<th>"+h+"</th>");
    html+="</tr>";

    rows.forEach(r=>{
        html+="<tr>";
        headers.forEach((h,i)=>{
            html+="<td>"+(r[i]||"")+"</td>";
        });
        html+="</tr>";
    });

    html+="</table>";
    document.getElementById("tableArea").innerHTML=html;
}

/* البحث */
document.getElementById("searchBox").addEventListener("input", function(){
    const val=this.value.toLowerCase();

    const filtered=data.filter(row =>
        row.join(" ").toLowerCase().includes(val)
    );

    renderTable(filtered);
});

/* ملء القوائم */
function fillColumnSelectors(){
    const selects=["columnDelete","replaceColumn","similarColumn"];

    selects.forEach(id=>{
        const s=document.getElementById(id);
        s.innerHTML="";
        headers.forEach((h,i)=>{
            const opt=document.createElement("option");
            opt.value=i;
            opt.textContent=h;
            s.appendChild(opt);
        });
    });
}

/* حذف الأعمدة */
function deleteColumns(){
    history.push(JSON.stringify(data));

    const selected=[...document.getElementById("columnDelete").selectedOptions].map(o=>parseInt(o.value));

    headers=headers.filter((_,i)=>!selected.includes(i));
    data=data.map(row=>row.filter((_,i)=>!selected.includes(i)));

    fillColumnSelectors();
    renderTable(data);
}

/* استبدال */
function replaceValues(){
    history.push(JSON.stringify(data));

    const col=parseInt(document.getElementById("replaceColumn").value);
    const oldVal=document.getElementById("oldValue").value;
    const newVal=document.getElementById("newValue").value;

    data=data.map(row=>{
        if(String(row[col])===oldVal) row[col]=newVal;
        return row;
    });

    renderTable(data);
}

/* التراجع */
function undo(){
    if(history.length>0){
        data=JSON.parse(history.pop());
        renderTable(data);
    }
}

/* تحميل */
function downloadFile(){
    const sheet=XLSX.utils.aoa_to_sheet([headers,...data]);
    const wb=XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb,sheet,"Cleaned");
    XLSX.writeFile(wb,"cleaned_data.xlsx");
}
