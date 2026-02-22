/* ===============================
   محرك قراءة وتنظيف ملفات Excel
   =============================== */

let workbook;
let worksheet;
let jsonData = null;

/* ===== عند رفع الملف ===== */
document.getElementById("fileInput").addEventListener("change", function (e) {

    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onload = function (event) {

        const data = new Uint8Array(event.target.result);

        // قراءة ملف الاكسل
        workbook = XLSX.read(data, { type: "array" });

        const firstSheet = workbook.SheetNames[0];
        worksheet = workbook.Sheets[firstSheet];

        // تحويل الاكسل الى مصفوفة
        jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

        alert("✔ تم رفع الملف بنجاح");
    };

    reader.readAsArrayBuffer(file);
});


/* ===== توحيد الحروف العربية ===== */
function normalizeArabic(text) {

    if (!text) return "";

    return text.toString()
        .replace(/[إأآا]/g, "ا")
        .replace(/ى/g, "ي")
        .replace(/ؤ/g, "و")
        .replace(/ئ/g, "ي")
        .replace(/ة/g, "ه")
        .replace(/[ًٌٍَُِّْ]/g, "")
        .replace(/\s+/g, " ")
        .trim()
        .toLowerCase();
}


/* ===== تنظيف الملف ===== */
function processFile() {

    const searchValue = document.getElementById("searchText").value;
    const search = normalizeArabic(searchValue);

    if (!jsonData) {
        alert("⚠ ارفع ملف Excel أولاً");
        return;
    }

    if (search === "") {
        alert("⚠ اكتب كلمة للبحث");
        return;
    }

    let result = [];

    // المرور على جميع الصفوف
    for (let i = 0; i < jsonData.length; i++) {

        let row = jsonData[i];
        if (!row) continue;

        let rowText = normalizeArabic(row.join(" "));

        // إذا لم يحتوي الكلمة → احتفظ بالصف
        if (!rowText.includes(search)) {
            result.push(row);
        }
    }

    if (result.length === 0) {
        alert("لم يتم العثور على بيانات بعد التنظيف");
        return;
    }

    /* ===== إنشاء ملف Excel جديد ===== */

    const newSheet = XLSX.utils.aoa_to_sheet(result);
    const newWorkbook = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(newWorkbook, newSheet, "Cleaned_Data");

    const excelBuffer = XLSX.write(newWorkbook, {
        bookType: "xlsx",
        type: "array"
    });

    const blob = new Blob(
        [excelBuffer],
        { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }
    );

    const url = URL.createObjectURL(blob);

    const downloadBtn = document.getElementById("downloadBtn");
    downloadBtn.href = url;
    downloadBtn.download = "cleaned_data.xlsx";
    downloadBtn.style.display = "inline-block";
    downloadBtn.innerText = "⬇ تحميل الملف بعد التنظيف";
}
