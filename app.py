from flask import Flask, request, jsonify, send_file, render_template
import pandas as pd
import os
import uuid
import re
from rapidfuzz import fuzz

app = Flask(__name__)
SESSION_FOLDER = "sessions"
os.makedirs(SESSION_FOLDER, exist_ok=True)

def normalize_arabic(text):
    if pd.isna(text):
        return ""
    text=str(text)
    text=re.sub(r'[\u0617-\u061A\u064B-\u0652]','',text)
    text=re.sub('[إأآا]','ا',text)
    text=re.sub('ى','ي',text)
    text=re.sub('ؤ','و',text)
    text=re.sub('ئ','ي',text)
    text=re.sub('ة','ه',text)
    text=re.sub(r'\bال','',text)
    text=re.sub(r'[^\w\s]','',text)
    text=re.sub(r'\s+',' ',text).strip()
    return text

def smart_similarity(a,b):
    a=normalize_arabic(a)
    b=normalize_arabic(b)
    words_a=set(a.split())
    words_b=set(b.split())
    inter=len(words_a & words_b)
    union=len(words_a | words_b)
    if union==0:
        return 0
    word_ratio=inter/union
    char_ratio=fuzz.ratio(a,b)/100
    return (word_ratio*0.7)+(char_ratio*0.3)

@app.route("/")
def home():
    return render_template("index.html")

@app.route("/upload", methods=["POST"])
def upload():
    file=request.files["file"]
    session_id=str(uuid.uuid4())
    path=os.path.join(SESSION_FOLDER, session_id+".xlsx")

    if file.filename.endswith(".csv"):
        df=pd.read_csv(file)
    else:
        df=pd.read_excel(file)

    df.to_excel(path,index=False)
    return jsonify({"session":session_id,"columns":list(df.columns)})

@app.route("/table/<session_id>")
def table(session_id):
    df=pd.read_excel(os.path.join(SESSION_FOLDER,session_id+".xlsx"))
    return jsonify(df.head(500).to_dict(orient="records"))

@app.route("/search", methods=["POST"])
def search():
    data=request.json
    session_id=data["session"]
    text=data["text"]
    df=pd.read_excel(os.path.join(SESSION_FOLDER,session_id+".xlsx"))
    mask=df.astype(str).apply(lambda r:r.str.contains(text,case=False,na=False)).any(axis=1)
    df=df[mask]
    return jsonify(df.head(500).to_dict(orient="records"))

@app.route("/delete", methods=["POST"])
def delete():
    data=request.json
    session_id=data["session"]
    cols=data["columns"]
    path=os.path.join(SESSION_FOLDER,session_id+".xlsx")
    df=pd.read_excel(path)
    df.drop(columns=cols,inplace=True)
    df.to_excel(path,index=False)
    return jsonify({"status":"ok"})

@app.route("/replace", methods=["POST"])
def replace():
    data=request.json
    session_id=data["session"]
    col=data["column"]
    old=data["old"]
    new=data["new"]
    path=os.path.join(SESSION_FOLDER,session_id+".xlsx")
    df=pd.read_excel(path)
    df[col]=[new if str(x)==old else x for x in df[col]]
    df.to_excel(path,index=False)
    return jsonify({"status":"ok"})

@app.route("/download/<session_id>")
def download(session_id):
    path=os.path.join(SESSION_FOLDER,session_id+".xlsx")
    return send_file(path,as_attachment=True,download_name="cleaned_data.xlsx")

import os
if __name__ == "__main__":
    port=int(os.environ.get("PORT",5000))
    app.run(host="0.0.0.0",port=port)