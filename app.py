import streamlit as st
import pandas as pd
import io

# إعدادات الصفحة
st.set_page_config(page_title="محلل ملفات Excel المتقدم", layout="wide")

# تصميم CSS لتحسين المظهر وجعله يشبه الصورة
st.markdown("""
    <style>
    @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;700&display=swap');
    html, body, [class*="css"] { font-family: 'Cairo', sans-serif; text-align: right; direction: rtl; }
    .stButton>button { background-image: linear-gradient(to right, #6a11cb 0%, #2575fc 100%); color: white; border: none; border-radius: 8px; padding: 10px 24px; width: 100%; }
    .uploadedFile { border: 2px dashed #6a11cb; border-radius: 10px; padding: 20px; }
    </style>
    """, unsafe_allow_html=True)

st.markdown("<h1 style='text-align: center; color: #4A00E0;'>📊 محلل ملفات Excel المتقدم</h1>", unsafe_allow_html=True)
st.markdown("<p style='text-align: center;'>أداة شاملة لقراءة وتحليل وتعديل ملفات Excel</p>", unsafe_allow_html=True)

# رفع الملف
uploaded_file = st.file_uploader("اسحب الملف هنا أو انقر للاختيار", type=["xlsx", "xls", "csv"])

if uploaded_file:
    # حفظ البيانات في الذاكرة (Session State)
    if 'df' not in st.session_state:
        if uploaded_file.name.endswith('.csv'):
            st.session_state.df = pd.read_csv(uploaded_file)
        else:
            st.session_state.df = pd.read_excel(uploaded_file)

    df = st.session_state.df

    # خيارات التحكم
    st.divider()
    selected_cols = st.multiselect("اختر الأعمدة للإجراء:", df.columns)
    
    col1, col2, col3 = st.columns(3)
    
    with col1:
        if st.button("🗑️ حذف المحدد"):
            if not selected_cols:
                st.warning("يرجى تحديد أعمدة أولاً")
            else:
                st.session_state.confirm_delete = True

    # منطق التأكيد قبل الحذف
    if st.session_state.get('confirm_delete', False):
        st.error(f"⚠️ هل أنت متأكد من حذف {len(selected_cols)} أعمدة؟")
        c1, c2 = st.columns(2)
        with c1:
            if st.button("✅ تأكيد الحذف"):
                st.session_state.df = df.drop(columns=selected_cols)
                st.session_state.confirm_delete = False
                st.rerun()
        with c2:
            if st.button("❌ إلغاء"):
                st.session_state.confirm_delete = False
                st.rerun()

    with col2:
        if st.button("📋 المتكررات"):
            if selected_cols:
                dupes = df[selected_cols].duplicated().sum()
                st.info(f"عدد الصفوف المتكررة في الأعمدة المختارة: {dupes}")
            else:
                st.info(f"إجمالي المتكررات في الجدول: {df.duplicated().sum()}")

    with col3:
        # تحويل البيانات لتحميلها
        output = io.BytesIO()
        with pd.ExcelWriter(output, engine='xlsxwriter') as writer:
            df.to_excel(writer, index=False)
        st.download_button(label="💾 تصدير إلى Excel", data=output.getvalue(), file_name="modified_file.xlsx")

    # عرض الجدول
    st.subheader("👀 معاينة البيانات")
    st.dataframe(df, use_container_width=True)
