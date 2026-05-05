import * as XLSX from "xlsx";
import { useState, useCallback } from "react";

const STEPS = [
  { id: "s1", icon: "🗂️", text: "بررسی سابقه خرید مشتری" },
  { id: "s2", icon: "📋", text: "تحلیل درخواست‌های قبلی و نرخ تبدیل" },
  { id: "s3", icon: "🔍", text: "اعتبارسنجی Part Number ها" },
  { id: "s4", icon: "🤖", text: "تحلیل هوشمند با Claude AI" },
  { id: "s5", icon: "📊", text: "آماده‌سازی گزارش نهایی" },
];

function delay(ms) { return new Promise(r => setTimeout(r, ms)); }

function findColumn(rows, candidates) {
  if (!rows || !rows.length) return null;
  const keys = Object.keys(rows[0]);
  for (const c of candidates) {
    const found = keys.find(k => k.toLowerCase().includes(c.toLowerCase()));
    if (found) return found;
  }
  return null;
}

function analyzePurchase(rows, customer) {
  if (!rows || !customer) return null;
  const nameCol = findColumn(rows, ["customer","مشتری","name","نام","company","شرکت"]);
  const amountCol = findColumn(rows, ["amount","مبلغ","price","قیمت","total","جمع"]);
  if (!nameCol) return { found: false };
  const matched = rows.filter(r => {
    const val = String(r[nameCol] || "").toLowerCase();
    return val.includes(customer.toLowerCase()) || customer.toLowerCase().includes(val.split(" ")[0]);
  });
  const totalAmount = matched.reduce((s, r) => s + (parseFloat(r[amountCol]) || 0), 0);
  return { found: matched.length > 0, count: matched.length, totalAmount };
}

function analyzeRequests(rows25, rows26, customer) {
  const allRows = [...(rows25 || []), ...(rows26 || [])];
  if (!allRows.length || !customer) return null;
  const nameCol = findColumn(allRows, ["customer","مشتری","name","نام","company","شرکت"]);
  const statusCol = findColumn(allRows, ["status","وضعیت","result","نتیجه"]);
  if (!nameCol) return { found: false };
  const matched = allRows.filter(r => {
    const val = String(r[nameCol] || "").toLowerCase();
    return val.includes(customer.toLowerCase()) || customer.toLowerCase().includes(val.split(" ")[0]);
  });
  const converted = matched.filter(r => {
    const s = String(r[statusCol] || "").toLowerCase();
    return s.includes("تایید") || s.includes("confirm") || s.includes("order") || s.includes("خرید") || s.includes("فروش");
  });
  return {
    found: matched.length > 0,
    totalRequests: matched.length,
    converted: converted.length,
    conversionRate: matched.length > 0 ? Math.round((converted.length / matched.length) * 100) : 0,
  };
}

async function callClaude(apiKey, prompt) {
  const response = await fetch("/api/claude", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 2000,
      messages: [{ role: "user", content: prompt }],
    }),
  });
  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error?.message || "HTTP " + response.status);
  }
  const data = await response.json();
  const text = data.content.map(c => c.text || "").join("");
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("فرمت پاسخ نامعتبر");
  return JSON.parse(jsonMatch[0]);
}

function buildPrompt(customer, rfqNum, parts, notes, purchase, request) {
  const pInfo = purchase?.found
    ? `${purchase.count} بار خرید قبلی، جمع: ${purchase.totalAmount.toLocaleString()}`
    : purchase?.found === false ? "مشتری جدید" : "فایل بارگذاری نشده";
  const rInfo = request?.found
    ? `${request.totalRequests} درخواست، ${request.converted} تبدیل، نرخ: ${request.conversionRate}%`
    : request?.found === false ? "سابقه‌ای ندارد" : "فایل بارگذاری نشده";
  return `تو متخصص فروش قطعات اتوماسیون صنعتی هستی. فقط JSON خالص برگردان.
مشتری: ${customer||"نامشخص"} | RFQ: ${rfqNum||"—"} | یادداشت: ${notes||"ندارد"}
سابقه خرید: ${pInfo} | سابقه درخواست: ${rInfo}
قطعات:
${parts.join("\n")}
JSON:
{"customerScore":80,"customerLevel":"VIP","dealValue":"بالا","priority":"فوری","parts":[{"partNumber":"...","manufacturer":"Siemens","description":"...","application":"...","status":"active","statusLabel":"موجود","marketPrice":"...","alternatives":"...","eolNote":""}],"recommendation":"...","risks":"...","nextStep":"..."}`;
}

function Tag({ color, children }) {
  const c = { blue:{background:"rgba(59,130,246,0.15)",color:"#60a5fa"}, green:{background:"rgba(16,185,129,0.15)",color:"#34d399"}, yellow:{background:"rgba(245,158,11,0.15)",color:"#fbbf24"}, red:{background:"rgba(239,68,68,0.15)",color:"#f87171"} };
  return <span style={{fontSize:11,padding:"3px 10px",borderRadius:20,fontWeight:600,...c[color]}}>{children}</span>;
}

function SBadge({ status }) {
  const m = { active:{bg:"rgba(16,185,129,0.15)",color:"#34d399",label:"موجود"}, eol:{bg:"rgba(239,68,68,0.15)",color:"#f87171",label:"توقف تولید"}, warning:{bg:"rgba(245,158,11,0.15)",color:"#fbbf24",label:"احتیاط"} };
  const s = m[status]||{bg:"rgba(148,163,184,0.15)",color:"#94a3b8",label:status||"نامشخص"};
  return <span style={{fontSize:10,padding:"2px 8px",borderRadius:20,fontWeight:600,background:s.bg,color:s.color}}>{s.label}</span>;
}

export default function App() {
  const [apiKey, setApiKey] = useState("");
  const [files, setFiles] = useState({ purchase:null, req25:null, req26:null });
  const [fileLabels, setFileLabels] = useState({ purchase:"", req25:"", req26:"" });
  const [customer, setCustomer] = useState("");
  const [rfqNum, setRfqNum] = useState("");
  const [partsRaw, setPartsRaw] = useState("");
  const [notes, setNotes] = useState("");
  const [phase, setPhase] = useState("idle");
  const [steps, setSteps] = useState(STEPS.map(s=>({...s,state:"waiting"})));
  const [result, setResult] = useState(null);
  const [toast, setToast] = useState("");
  const [apiTested, setApiTested] = useState(false);

  const showToast = msg => { setToast(msg); setTimeout(()=>setToast(""),3500); };
  const isReady = apiKey.startsWith("sk-ant") && partsRaw.trim().length > 0;

const loadFile = useCallback((e, key) => {
  const file = e.target.files[0]; 
  if(!file) return;

  const reader = new FileReader();

  reader.onload = ev => {
    try {
      // ✅ FIX: استفاده مستقیم از XLSX
      const wb = XLSX.read(ev.target.result,{type:"binary"});

      const rows = [];
      wb.SheetNames.forEach(n=>{
        rows.push(...XLSX.utils.sheet_to_json(wb.Sheets[n],{defval:""}));
      });

      setFiles(f=>({...f,[key]:rows}));
      setFileLabels(l=>({...l,[key]:`✓ ${rows.length} ردیف`}));

      showToast(`${file.name} بارگذاری شد`);

    } catch(err){
      showToast("خطا: "+err.message);
    }
  };

  reader.readAsBinaryString(file);
},[]);

const testApi = async () => {
  if(!apiKey.startsWith("sk-ant")){
    showToast("کلید باید با sk-ant شروع شود");
    return;
  }

  showToast("در حال تست...");

  try {
    const r = await fetch("/api/claude", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 10,
        messages: [{ role: "user", content: "hi" }]
      })
    });

    if(r.ok){
      setApiTested(true);
      showToast("✅ اتصال موفق!");
    } else {
      const d = await r.json();
      showToast("❌ " + (d.error?.message || r.status));
    }

  } catch(e){
    showToast("❌ خطا: " + e.message);
  }
};

  const setStepState = (id,st) => setSteps(prev=>prev.map(s=>s.id===id?{...s,state:st}:s));

  const startAnalysis = async () => {
    if(!isReady) return;
    const parts = partsRaw.split("\n").map(l=>l.trim()).filter(Boolean);
    setPhase("running"); setSteps(STEPS.map(s=>({...s,state:"waiting"}))); setResult(null);
    setStepState("s1","active"); await delay(400);
    const purchase = analyzePurchase(files.purchase, customer); setStepState("s1","done");
    setStepState("s2","active"); await delay(400);
    const request = analyzeRequests(files.req25,files.req26,customer); setStepState("s2","done");
    setStepState("s3","active"); await delay(500); setStepState("s3","done");
    setStepState("s4","active");
    let ai;
    try {
      ai = await callClaude(apiKey, buildPrompt(customer,rfqNum,parts,notes,purchase,request));
      setStepState("s4","done");
    } catch(err){ setStepState("s4","error"); setPhase("error"); showToast("خطا: "+err.message); return; }
    setStepState("s5","active"); await delay(300); setStepState("s5","done");
    await delay(400);
    setResult({ai,purchase,request,parts,customer,rfqNum});
    setPhase("done");
  };

  const copyReport = () => {
    if(!result) return;
    const {ai,customer:c,rfqNum:r} = result;
    navigator.clipboard.writeText(`گزارش RFQ\nمشتری: ${c} | RFQ: ${r}\nامتیاز: ${ai.customerScore} | ${ai.customerLevel}\nارزش: ${ai.dealValue} | اولویت: ${ai.priority}\n\n${ai.recommendation}\n${ai.risks}\n${ai.nextStep}`)
      .then(()=>showToast("✅ کپی شد"));
  };

  const bg="#0f1117", bg2="#161b27", bg3="#1e2538", bdr="#2a3148";
  const card = {background:bg2,border:`1px solid ${bdr}`,borderRadius:14,padding:20,marginBottom:16};
  const inp = {width:"100%",background:bg3,border:`1px solid ${bdr}`,borderRadius:8,padding:"9px 12px",color:"#e2e8f0",fontFamily:"inherit",fontSize:13,outline:"none",direction:"ltr"};
  const lbl = {fontSize:12,color:"#64748b",marginBottom:5,display:"block"};
  const bar = {width:3,height:14,background:"#3b82f6",borderRadius:2,flexShrink:0};
  const secTitle = {fontSize:12,fontWeight:700,color:"#94a3b8",letterSpacing:"0.08em",marginBottom:14,display:"flex",alignItems:"center",gap:8};
  const btn = v=>({padding:"9px 18px",borderRadius:8,border:v==="primary"?"none":`1px solid ${bdr}`,background:v==="primary"?"#3b82f6":bg3,color:v==="primary"?"#fff":"#94a3b8",fontFamily:"inherit",fontSize:13,fontWeight:600,cursor:"pointer"});
  const mRow = {display:"flex",justifyContent:"space-between",padding:"7px 0",borderBottom:`1px solid ${bdr}`,fontSize:13};
  const th = {background:bg3,padding:"9px 10px",textAlign:"right",fontWeight:600,fontSize:11,color:"#64748b",borderBottom:`1px solid ${bdr}`};
  const td = {padding:"9px 10px",borderBottom:`1px solid ${bg3}`,color:"#e2e8f0",verticalAlign:"top",lineHeight:1.5,fontSize:12};

  return (
    <div style={{fontFamily:"'Vazirmatn','Tahoma',sans-serif",direction:"rtl",background:bg,minHeight:"100vh",color:"#e2e8f0"}}>

      <style>{`@import url('https://fonts.googleapis.com/css2?family=Vazirmatn:wght@400;600;700&display=swap');@keyframes spin{to{transform:rotate(360deg)}}*{box-sizing:border-box}`}</style>

      {/* Header */}
      <div style={{background:bg2,borderBottom:`1px solid ${bdr}`,padding:"14px 24px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <div style={{width:34,height:34,borderRadius:8,background:"linear-gradient(135deg,#3b82f6,#6366f1)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18}}>⚙️</div>
          <div>
            <div style={{fontSize:15,fontWeight:700}}>RFQ Analyzer Pro</div>
            <div style={{fontSize:11,color:"#64748b"}}>سیستم تحلیل هوشمند — Claude AI</div>
          </div>
        </div>
        <div style={{fontSize:11,padding:"3px 12px",borderRadius:20,background:isReady&&apiTested?"rgba(16,185,129,0.15)":"rgba(100,116,139,0.15)",color:isReady&&apiTested?"#34d399":"#94a3b8",display:"flex",alignItems:"center",gap:6}}>
          <span style={{width:7,height:7,borderRadius:"50%",background:isReady&&apiTested?"#34d399":"#64748b",display:"inline-block"}}/>
          {isReady&&apiTested?"آماده تحلیل":"در انتظار تنظیمات"}
        </div>
      </div>

      <div style={{maxWidth:1100,margin:"0 auto",padding:"24px 20px"}}>

        {/* SETUP */}
        <div style={card}>
          <div style={secTitle}><div style={bar}/>تنظیمات — فایل‌ها و کلید API</div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12}}>
            {[{key:"purchase",label:"Purchase 2025",desc:"سوابق خرید",icon:"📊"},{key:"req25",label:"Request 2025",desc:"درخواست‌های ۱۴۰۴",icon:"📋"},{key:"req26",label:"Request 2026",desc:"درخواست‌های ۱۴۰۵",icon:"📋"}].map(f=>(
              <label key={f.key} style={{background:bg3,border:`1.5px ${fileLabels[f.key]?"solid":"dashed"} ${fileLabels[f.key]?"#10b981":bdr}`,borderRadius:10,padding:"16px 12px",textAlign:"center",cursor:"pointer",display:"block"}}>
                <input type="file" accept=".xlsx,.xls" style={{display:"none"}} onChange={e=>loadFile(e,f.key)}/>
                <div style={{fontSize:24,marginBottom:6}}>{f.icon}</div>
                <div style={{fontSize:13,fontWeight:600,marginBottom:2}}>{f.label}</div>
                <div style={{fontSize:11,color:"#64748b",marginBottom:6}}>{f.desc}</div>
                <div style={{fontSize:11,color:fileLabels[f.key]?"#34d399":"#64748b"}}>{fileLabels[f.key]||"کلیک برای انتخاب"}</div>
              </label>
            ))}
          </div>
          <div style={{display:"flex",gap:10,alignItems:"flex-end",marginTop:14}}>
            <div style={{flex:1}}>
              <label style={lbl}>کلید API — Anthropic Claude</label>
              <input style={inp} type="password" placeholder="sk-ant-api03-..." value={apiKey} onChange={e=>setApiKey(e.target.value)}/>
            </div>
            <button style={btn(apiTested?"primary":"secondary")} onClick={testApi}>{apiTested?"✅ متصل":"تست اتصال"}</button>
          </div>
        </div>

        {/* RFQ INPUT */}
        <div style={card}>
          <div style={secTitle}><div style={bar}/>اطلاعات درخواست جدید</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:14}}>
            <div><label style={lbl}>نام / شرکت مشتری</label><input style={{...inp,direction:"rtl"}} placeholder="مثال: شرکت پترو کیمیا" value={customer} onChange={e=>setCustomer(e.target.value)}/></div>
            <div><label style={lbl}>شماره RFQ</label><input style={inp} placeholder="RFQ-2026-0142" value={rfqNum} onChange={e=>setRfqNum(e.target.value)}/></div>
            <div style={{gridColumn:"1/-1"}}>
              <label style={lbl}>Part Number ها (هر خط یک قطعه)</label>
              <textarea style={{...inp,minHeight:90,resize:"vertical",fontFamily:"monospace",fontSize:12}} placeholder={"6ES7314-6EH04-0AB0  qty:2\n6ES7321-1BL00-0AA0  qty:5\n3RT2025-1AP00"} value={partsRaw} onChange={e=>setPartsRaw(e.target.value)}/>
            </div>
            <div style={{gridColumn:"1/-1"}}><label style={lbl}>یادداشت (اختیاری)</label><input style={{...inp,direction:"rtl"}} placeholder="مثال: فوری — پروژه پالایشگاه" value={notes} onChange={e=>setNotes(e.target.value)}/></div>
          </div>
          <button style={{width:"100%",padding:13,background:isReady&&phase!=="running"?"linear-gradient(135deg,#3b82f6,#6366f1)":bg3,color:isReady&&phase!=="running"?"#fff":"#64748b",border:"none",borderRadius:10,fontFamily:"inherit",fontSize:15,fontWeight:700,cursor:isReady&&phase!=="running"?"pointer":"not-allowed",display:"flex",alignItems:"center",justifyContent:"center",gap:10}}
            onClick={startAnalysis} disabled={!isReady||phase==="running"}>
            {phase==="running"?<><span style={{width:18,height:18,border:"2px solid rgba(255,255,255,0.3)",borderTopColor:"#fff",borderRadius:"50%",animation:"spin 0.8s linear infinite",display:"inline-block"}}/> در حال تحلیل...</>:<><span>🔍</span>تحلیل هوشمند RFQ</>}
          </button>
        </div>

        {/* PROGRESS */}
        {phase==="running"&&(
          <div style={card}>
            <div style={secTitle}><div style={bar}/>در حال پردازش...</div>
            <div style={{display:"flex",flexDirection:"column",gap:8}}>
              {steps.map(s=>(
                <div key={s.id} style={{display:"flex",alignItems:"center",gap:12,padding:"10px 14px",background:s.state==="active"?"rgba(59,130,246,0.08)":s.state==="done"?"rgba(16,185,129,0.06)":s.state==="error"?"rgba(239,68,68,0.06)":bg3,border:`1px solid ${s.state==="active"?"#3b82f6":s.state==="done"?"#10b981":s.state==="error"?"#ef4444":bdr}`,borderRadius:8,fontSize:13,transition:"all 0.3s"}}>
                  <span style={{fontSize:17,width:24,textAlign:"center"}}>{s.state==="active"?"⏳":s.state==="done"?"✅":s.state==="error"?"❌":s.icon}</span>
                  <span style={{flex:1}}>{s.text}</span>
                  <span style={{fontSize:10,padding:"2px 8px",borderRadius:20,fontWeight:600,background:s.state==="active"?"rgba(59,130,246,0.2)":s.state==="done"?"rgba(16,185,129,0.2)":"rgba(100,116,139,0.15)",color:s.state==="active"?"#60a5fa":s.state==="done"?"#34d399":"#94a3b8"}}>
                    {s.state==="active"?"در حال پردازش":s.state==="done"?"تکمیل":s.state==="error"?"خطا":"در انتظار"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* RESULTS */}
        {phase==="done"&&result&&(()=>{
          const {ai,purchase,request,parts:pts,customer:cust,rfqNum:rfq}=result;
          const sc=ai.customerScore||50;
          return(<>
            <div style={{...card,display:"flex",gap:20,alignItems:"center"}}>
              <div style={{width:84,height:84,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",fontSize:24,fontWeight:700,flexShrink:0,background:sc>=70?"rgba(16,185,129,0.15)":sc>=40?"rgba(245,158,11,0.15)":"rgba(239,68,68,0.15)",color:sc>=70?"#34d399":sc>=40?"#fbbf24":"#f87171",border:`2px solid ${sc>=70?"#10b981":sc>=40?"#f59e0b":"#ef4444"}`}}>{sc}</div>
              <div style={{flex:1}}>
                <div style={{fontSize:11,color:"#64748b",marginBottom:3}}>مشتری</div>
                <div style={{fontSize:19,fontWeight:700,marginBottom:4}}>{cust||"نامشخص"}</div>
                <div style={{fontSize:13,color:"#94a3b8",marginBottom:8}}>RFQ: {rfq||"—"} | {pts.length} قطعه | ارزش: {ai.dealValue||"—"}</div>
                <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                  <Tag color="blue">{ai.customerLevel||"عادی"}</Tag>
                  <Tag color="yellow">اولویت: {ai.priority||"معمولی"}</Tag>
                  {purchase?.found&&<Tag color="green">{purchase.count} بار خرید</Tag>}
                  {request?.found&&<Tag color="blue">نرخ تبدیل {request.conversionRate}%</Tag>}
                </div>
              </div>
            </div>

            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:14}}>
              <div style={card}>
                <div style={{...secTitle,marginBottom:10}}><div style={bar}/>📊 سابقه خرید</div>
                {purchase?.found?<><div style={mRow}><span style={{color:"#64748b"}}>تعداد خرید</span><span style={{fontWeight:600,color:"#34d399"}}>{purchase.count} بار</span></div><div style={mRow}><span style={{color:"#64748b"}}>جمع مبالغ</span><span style={{fontWeight:600,color:"#60a5fa"}}>{purchase.totalAmount?purchase.totalAmount.toLocaleString():"—"}</span></div></>:<div style={{fontSize:13,color:"#f59e0b"}}>{purchase?.found===false?"مشتری جدید":"فایل بارگذاری نشده"}</div>}
              </div>
              <div style={card}>
                <div style={{...secTitle,marginBottom:10}}><div style={bar}/>📋 سابقه درخواست‌ها</div>
                {request?.found?<><div style={mRow}><span style={{color:"#64748b"}}>کل درخواست‌ها</span><span style={{fontWeight:600}}>{request.totalRequests}</span></div><div style={mRow}><span style={{color:"#64748b"}}>تبدیل به خرید</span><span style={{fontWeight:600,color:"#34d399"}}>{request.converted}</span></div><div style={mRow}><span style={{color:"#64748b"}}>نرخ تبدیل</span><span style={{fontWeight:600,color:request.conversionRate>=50?"#34d399":request.conversionRate>=25?"#fbbf24":"#f87171"}}>{request.conversionRate}%</span></div></>:<div style={{fontSize:13,color:"#f59e0b"}}>{request?.found===false?"سابقه‌ای ندارد":"فایل بارگذاری نشده"}</div>}
              </div>
            </div>

            <div style={{...card,overflowX:"auto"}}>
              <div style={{...secTitle,marginBottom:12}}><div style={bar}/>⚙️ تحلیل قطعات</div>
              <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
                <thead><tr>{["Part Number","سازنده","شرح","کاربرد","وضعیت","جایگزین","قیمت"].map(h=><th key={h} style={th}>{h}</th>)}</tr></thead>
                <tbody>{(ai.parts||[]).map((p,i)=><tr key={i}>
                  <td style={td}><code style={{color:"#60a5fa",fontSize:11}}>{p.partNumber}</code></td>
                  <td style={td}>{p.manufacturer||"—"}</td>
                  <td style={td}>{p.description||"—"}</td>
                  <td style={td}>{p.application||"—"}</td>
                  <td style={td}><SBadge status={p.status}/>{p.eolNote&&<div style={{fontSize:10,color:"#64748b",marginTop:2}}>{p.eolNote}</div>}</td>
                  <td style={{...td,color:"#94a3b8"}}>{p.alternatives||"—"}</td>
                  <td style={td}>{p.marketPrice||"—"}</td>
                </tr>)}</tbody>
              </table>
            </div>

            <div style={{background:bg2,border:`1px solid ${bdr}`,borderRight:"4px solid #3b82f6",borderRadius:14,padding:20,marginBottom:16,fontSize:13,lineHeight:1.8,color:"#94a3b8"}}>
              <div style={{fontSize:14,fontWeight:700,color:"#e2e8f0",marginBottom:10}}>💡 توصیه تیم فروش</div>
              <div style={{marginBottom:6}}>{ai.recommendation}</div>
              <div style={{marginBottom:6,color:"#64748b"}}>{ai.risks}</div>
              <div style={{color:"#60a5fa",fontWeight:600}}>{ai.nextStep}</div>
            </div>

            <div style={{display:"flex",gap:12}}>
              <button style={btn("primary")} onClick={copyReport}>📋 کپی گزارش</button>
              <button style={btn("secondary")} onClick={()=>{setPhase("idle");setResult(null);}}>🔄 تحلیل جدید</button>
            </div>
          </>);
        })()}
      </div>
      <div style={{position:"fixed",bottom:24,left:"50%",transform:"translateX(-50%)",background:bg3,border:`1px solid ${bdr}`,borderRadius:10,padding:"10px 20px",fontSize:13,color:"#e2e8f0",zIndex:9999,opacity:toast?1:0,transition:"opacity 0.3s",pointerEvents:"none",whiteSpace:"nowrap"}}>{toast}</div>
    </div>
  );
}