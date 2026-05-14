"use client";
import { useState, useEffect, useCallback, useRef } from "react";

const REVIEWERS = ["Dhruv", "Vivek", "Evelyn"];
const GREEN    = "#8DC63F";
const GREEN_DK = "#6A9A2A";
const GREEN_BG = "#F2F9E6";
const GREEN_BD = "#C8E294";
const PINK     = "#E8388A";
const PINK_BG  = "#FDEDF4";
const PINK_BD  = "#F5B6D0";
const C = { bg:"#FFFFFF",bgOff:"#F7F7F5",border:"#E8E8E4",borderMd:"#D0D0C8",text:"#111111",textMd:"#555550",textSm:"#888882" };

const DEFAULT_CHECKLIST_TYPES = ["Product Page","Collection Page","Email QA"];
const DEFAULT_TRAFFIC_SOURCES = ["Storefront","Facebook","Google","Email","SMS / Email","YouTube","TikTok","TV","Postcard","Compliant","Reddit","All Sources"];
const DEFAULT_OWNERS          = ["Performance Marketing","Retention"];

const RESOURCES = [
  { label:"Common Errors - QA", url:"https://docs.google.com/document/d/18JKEgWrE2cENbBcWvXd_ocRz9-QRh6MDdq69MrcMgx8/edit?tab=t.0" },
  { label:"Common Errors PDF",  url:"https://drive.google.com/file/d/1EbHCi1BbFckZ4QccNPrdom5pCIO4NXiE/view?usp=sharing" },
  { label:"Cart Debug",         url:"https://www.innosupps.com/pages/cart-debug" },
  { label:"Cart Debug Guide",   url:"https://drive.google.com/file/d/1BOBcpjws1FUmwPnkI6bHtJIpJSsE0sy6/view?usp=sharing" },
];
const PLATFORMS = [
  "MOBILE · iOS · Safari","MOBILE · Android · Chrome","MOBILE · iOS · Chrome",
  "MOBILE · iOS · FB Group","MOBILE · Android · FB Group",
  "DESKTOP · Chrome","DESKTOP · Edge","DESKTOP · Firefox",
];
const CHECKLIST = [
  { id:"design",      label:"Design vs Figma",       color:GREEN,     items:["Layout matches Figma","Sections order matches Figma","Copy matches Figma","Images/assets match Figma","Spacing matches Figma","Bottom Product Options are in 3 - 1 - 6 order for mobile"] },
  { id:"pricing",     label:"Pricing",               color:"#0066CC", items:["All prices match approved pricing sheet or the Figma","Crossout pricing shown correctly"] },
  { id:"buttons",     label:"Buttons & Function",    color:"#7B3FE4", items:["Carousel button works","Reviews at the top drop down to review section","Top ATC button performs intended action","Midpage ATC button performs intended action","OTP/Sub Toggles work","All buttons are clickable and go to correct destination","No broken links"] },
  { id:"cart",        label:"Cart",                  color:"#F0A500", items:["Cart drawer opens for all options","Correct product name shows in cart","Correct price shows in cart","Correct product image shows in cart and page","Subscribe & Save button works on all OTP options and shows correct price in cart","+ and - update correctly for all options in cart"] },
  { id:"promo",       label:"Promo (if applicable)", color:"#E8341C", items:["Promo codes apply correctly in cart","Promo items add on intended items","Promo items are free in page, cart, checkout","Promo item images are correct in page, cart, checkout","Promo removed from cart when main item removed","Promo items don't lead to a standalone page (non-clickable in cart)"] },
  { id:"email_popup", label:"Email Popups",          color:"#00A8A8", items:["Email popup is formatted properly (Desktop)","Email popup is formatted properly (Mobile)"] },
  { id:"checkout",    label:"Checkout",              color:"#0066CC", items:["Cart items match checkout summary","Cart promo items carried through to checkout and are free","Pricing at checkout matches cart","Promo codes still applied in checkout","Order confirmation page shows correct items and pricing"] },
  { id:"upsells",     label:"Upsells",               color:GREEN,     items:["Run 1 (1x) - Decline All Offers to check for 404","Run 2 (1x) - Accept All Upsells Only (Pricing Check)","Run 3 (1x) - Accept All Downsells Only (Pricing Check)","Run 1 (3x) - Decline All Offers to check for 404","Run 2 (3x) - Accept All Upsells Only (Pricing Check)","Run 3 (3x) - Accept All Downsells Only (Pricing Check)","Run 1 (6x or Stack) - Decline All Offers to check for 404","Run 2 (6x or Stack) - Accept All Upsells Only (Pricing Check)","Run 3 (6x or Stack) - Accept All Downsells Only (Pricing Check)","1x Flow Matches Reference","3x Flow Matches Reference","6x Flow Matches Reference","Thank You Page works and shows a Zigpoll"] },
  { id:"conf_email",  label:"Confirmation Email",    color:"#00A8A8", items:["Confirmation email received after checkout","Bundles are breaking down properly","Order items in email match checkout items","Pricing in email matches checkout pricing","Freebies listed correctly in email","Email links and CTAs work correctly"] },
  { id:"tech",        label:"Other Tech Checks",     color:"#555550", items:["Facebook descriptions match backend vs page","Cart debug shows all product options have the _list-name contain the URL slug"] },
];

function initChecks() { const s:any={}; CHECKLIST.forEach(sec=>{s[sec.id]=sec.items.map(()=>({state:"unchecked",note:"",media:[]}));}); return s; }
function initRD(revs:string[]=REVIEWERS) { const r:any={}; revs.forEach(n=>{r[n]={checks:initChecks(),done:false,notes:"",media:[]};}); return r; }
function initPC(revs:string[]=REVIEWERS) { const r:any={}; revs.forEach(n=>{r[n]={};PLATFORMS.forEach(p=>{r[n][p]="unchecked";});}); return r; }
function readFile(f:File):Promise<string> { return new Promise((res,rej)=>{const r=new FileReader();r.onload=e=>res(e.target?.result as string);r.onerror=rej;r.readAsDataURL(f);}); }
function cycleS(s:string){return s==="unchecked"?"checked":s==="checked"?"na":"unchecked";}
const ST:any = {
  unchecked:{bg:"#FFFFFF",bd:"#D0D0C8",color:"#888882",label:""},
  checked:  {bg:GREEN,    bd:GREEN_DK, color:"#FFFFFF",label:"✓"},
  na:       {bg:"#F0F0EC",bd:"#C8C8C0",color:"#888882",label:"N/A"},
  flagged:  {bg:"#E8341C",bd:"#C02010",color:"#FFFFFF",label:"⚑"},
};
function isValidUrl(s:string){if(!s.trim())return true;try{new URL(s.trim());return true;}catch{return false;}}
function todayISO(){const d=new Date();const y=d.getFullYear();const m=String(d.getMonth()+1).padStart(2,"0");const da=String(d.getDate()).padStart(2,"0");return `${y}-${m}-${da}`;}
function fmtDate(iso:string|null|undefined){if(!iso)return"";try{const d=new Date(iso);if(isNaN(d.getTime()))return"";return d.toLocaleDateString();}catch{return"";}}

// ── Dropdown picker with "+ Add" support ────────────────────────────────────
function DropdownPicker({label,value,options,onChange,onAddOption,accent,placeholder}:{label:string,value:string,options:string[],onChange:(v:string)=>void,onAddOption:(v:string)=>void,accent:string,placeholder?:string}) {
  const [open,setOpen]=useState(false);
  const [adding,setAdding]=useState(false);
  const [newOpt,setNewOpt]=useState("");
  const wrap=useRef<HTMLDivElement>(null);
  useEffect(()=>{const h=(e:MouseEvent)=>{if(wrap.current&&!wrap.current.contains(e.target as Node)){setOpen(false);setAdding(false);}};document.addEventListener("mousedown",h);return()=>document.removeEventListener("mousedown",h);},[]);
  function add(){const v=newOpt.trim();if(!v)return;onAddOption(v);onChange(v);setNewOpt("");setAdding(false);setOpen(false);}
  return(
    <div ref={wrap} style={{position:"relative"}}>
      <label style={{fontSize:11,fontWeight:700,letterSpacing:"0.08em",textTransform:"uppercase",color:C.textSm,display:"block",marginBottom:5}}>{label}</label>
      <button type="button" onClick={()=>setOpen(o=>!o)}
        style={{width:"100%",background:C.bgOff,border:`1px solid ${C.border}`,borderRadius:8,padding:"9px 12px",fontSize:13,color:value?C.text:C.textSm,outline:"none",fontFamily:"inherit",cursor:"pointer",textAlign:"left",display:"flex",alignItems:"center",gap:6,justifyContent:"space-between"}}>
        <span style={{flex:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{value||placeholder||"Select..."}</span>
        <span style={{fontSize:10,color:C.textSm}}>{open?"▴":"▾"}</span>
      </button>
      {open&&(
        <div style={{position:"absolute",top:"calc(100% + 4px)",left:0,right:0,background:"#3a3a36",color:"#fff",borderRadius:8,padding:"4px",boxShadow:"0 8px 24px rgba(0,0,0,.25)",zIndex:50,maxHeight:260,overflowY:"auto"}}>
          {options.map(opt=>{const sel=opt===value;return(
            <button key={opt} type="button" onClick={()=>{onChange(opt);setOpen(false);}}
              style={{width:"100%",background:sel?accent:"transparent",border:"none",color:"#fff",fontSize:13,fontWeight:sel?600:400,padding:"7px 10px",borderRadius:6,cursor:"pointer",fontFamily:"inherit",textAlign:"left",display:"flex",alignItems:"center",gap:6}}
              onMouseEnter={e=>{if(!sel)(e.currentTarget as HTMLElement).style.background="rgba(255,255,255,.08)";}}
              onMouseLeave={e=>{if(!sel)(e.currentTarget as HTMLElement).style.background="transparent";}}>
              <span style={{width:12,fontSize:10}}>{sel?"✓":""}</span>{opt}
            </button>
          );})}
          {adding?(
            <div style={{display:"flex",gap:4,padding:"5px 6px"}}>
              <input autoFocus value={newOpt} onChange={e=>setNewOpt(e.target.value)} onKeyDown={e=>{if(e.key==="Enter")add();if(e.key==="Escape"){setAdding(false);setNewOpt("");}}} placeholder="New option" style={{flex:1,minWidth:0,background:"#2b2b27",border:"1px solid #555550",borderRadius:5,padding:"4px 7px",fontSize:12,color:"#fff",outline:"none",fontFamily:"inherit"}}/>
              <button onClick={add} style={{fontSize:11,fontWeight:600,padding:"4px 9px",borderRadius:5,border:"none",background:accent,color:"#fff",cursor:"pointer",fontFamily:"inherit"}}>Add</button>
            </div>
          ):(
            <button type="button" onClick={()=>setAdding(true)} style={{width:"100%",background:"transparent",border:"none",color:accent,fontSize:12,fontWeight:600,padding:"7px 10px",borderRadius:6,cursor:"pointer",fontFamily:"inherit",textAlign:"left"}}>+ Add</button>
          )}
        </div>
      )}
    </div>
  );
}

// ── Media Uploader ──────────────────────────────────────────────────────────
function MediaUploader({media,onChange,compact,onOpen}:{media:any[],onChange:(m:any[])=>void,compact?:boolean,onOpen?:(m:any)=>void}) {
  const ref=useRef<HTMLInputElement>(null);
  async function handle(files:FileList|null) {
    if(!files)return;
    const next:any[]=[];
    for(const f of Array.from(files)){
      if(!f.type.startsWith("image/"))continue;
      const dataUrl=await readFile(f);
      next.push({id:Date.now()+Math.random(),name:f.name,dataUrl,type:"image"});
    }
    onChange([...media,...next]);
  }
  const rm=(id:number)=>onChange(media.filter((m:any)=>m.id!==id));
  const rmSm:any={position:"absolute",top:-4,right:-4,width:15,height:15,borderRadius:"50%",background:"#E8341C",border:"none",color:"#fff",fontSize:9,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"};
  const rmLg:any={position:"absolute",top:-5,right:-5,width:18,height:18,borderRadius:"50%",background:"#E8341C",border:"none",color:"#fff",fontSize:10,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"};
  if(compact)return(
    <div style={{marginTop:6}}>
      {media.length>0&&<div style={{display:"flex",gap:4,flexWrap:"wrap",marginBottom:5}}>
        {media.map((m:any)=>(
          <div key={m.id} style={{position:"relative"}}>
            <img src={m.dataUrl} alt={m.name} onClick={()=>onOpen&&onOpen(m)} style={{width:42,height:42,objectFit:"cover",borderRadius:6,border:`1px solid ${C.border}`,display:"block",cursor:"pointer"}}/>
            <button onClick={()=>rm(m.id)} style={rmSm}>×</button>
          </div>
        ))}
      </div>}
      <div onDrop={e=>{e.preventDefault();(e.currentTarget as HTMLElement).style.borderColor=C.border;(e.currentTarget as HTMLElement).style.background=C.bgOff;handle(e.dataTransfer.files);}}
        onDragOver={e=>{e.preventDefault();(e.currentTarget as HTMLElement).style.borderColor=GREEN;(e.currentTarget as HTMLElement).style.background=GREEN_BG;}}
        onDragLeave={e=>{(e.currentTarget as HTMLElement).style.borderColor=C.border;(e.currentTarget as HTMLElement).style.background=C.bgOff;}}
        onClick={()=>ref.current?.click()}
        style={{border:`1.5px dashed ${C.border}`,borderRadius:8,padding:"7px 10px",cursor:"pointer",textAlign:"center",transition:"all .15s",background:C.bgOff,fontSize:11,color:C.textMd,fontWeight:500}}>
        📎 Drop screenshot or click to add
      </div>
      <input ref={ref} type="file" accept="image/*" multiple style={{display:"none"}} onChange={e=>handle(e.target.files)}/>
    </div>
  );
  return(
    <div style={{marginTop:8}}>
      <div style={{fontSize:11,fontWeight:600,color:C.textSm,letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:7}}>Screenshots</div>
      <div onDrop={e=>{e.preventDefault();(e.currentTarget as HTMLElement).style.borderColor=C.border;handle(e.dataTransfer.files);}}
        onDragOver={e=>{e.preventDefault();(e.currentTarget as HTMLElement).style.borderColor=GREEN;}}
        onDragLeave={e=>{(e.currentTarget as HTMLElement).style.borderColor=C.border;}}
        onClick={()=>ref.current?.click()}
        style={{border:`1.5px dashed ${C.border}`,borderRadius:10,padding:"14px",cursor:"pointer",textAlign:"center",transition:"border-color .2s",background:C.bgOff}}>
        <div style={{fontSize:18,marginBottom:4}}>📎</div>
        <div style={{fontSize:12,color:C.textMd,fontWeight:500}}>Drop screenshots here or click to upload</div>
        <div style={{fontSize:11,color:C.textSm,marginTop:2}}>PNG, JPG, GIF supported</div>
      </div>
      <input ref={ref} type="file" accept="image/*" multiple style={{display:"none"}} onChange={e=>handle(e.target.files)}/>
      {media.length>0&&<div style={{display:"flex",gap:8,flexWrap:"wrap",marginTop:8}}>
        {media.map((m:any)=>(
          <div key={m.id} style={{position:"relative"}}>
            <img src={m.dataUrl} alt={m.name} onClick={()=>onOpen&&onOpen(m)} style={{width:78,height:78,objectFit:"cover",borderRadius:8,border:`1px solid ${C.border}`,display:"block",cursor:"pointer"}}/>
            <button onClick={e=>{e.stopPropagation();rm(m.id);}} style={rmLg}>×</button>
          </div>
        ))}
      </div>}
    </div>
  );
}

function Lightbox({item,onClose}:{item:any,onClose:()=>void}) {
  useEffect(()=>{const h=(e:KeyboardEvent)=>{if(e.key==="Escape")onClose();};window.addEventListener("keydown",h);return()=>window.removeEventListener("keydown",h);},[onClose]);
  return(
    <div onClick={onClose} style={{position:"fixed",inset:0,background:"rgba(0,0,0,.82)",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center",padding:24}}>
      <div onClick={e=>e.stopPropagation()} style={{maxWidth:"90vw",maxHeight:"88vh",position:"relative"}}>
        <img src={item.dataUrl} alt={item.name} style={{maxWidth:"100%",maxHeight:"82vh",borderRadius:12,display:"block",boxShadow:"0 20px 60px rgba(0,0,0,.5)"}}/>
        <div style={{fontSize:12,color:"rgba(255,255,255,.5)",marginTop:8,textAlign:"center"}}>{item.name} · Esc to close</div>
        <button onClick={onClose} style={{position:"absolute",top:-12,right:-12,width:28,height:28,borderRadius:"50%",background:"#fff",border:"none",color:C.text,fontSize:14,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:800,boxShadow:"0 2px 8px rgba(0,0,0,.2)"}}>×</button>
      </div>
    </div>
  );
}

function MediaThumbs({media,onOpen}:{media:any[],onOpen:(m:any)=>void}) {
  if(!media||media.length===0)return null;
  return(
    <div style={{display:"flex",gap:5,flexWrap:"wrap",marginTop:5}}>
      {media.filter((m:any)=>m.dataUrl).map((m:any)=>(
        <img key={m.id} src={m.dataUrl} alt={m.name} onClick={()=>onOpen(m)} style={{width:48,height:48,objectFit:"cover",borderRadius:6,border:`1px solid ${C.border}`,cursor:"pointer"}}/>
      ))}
    </div>
  );
}

// Section-level drag & drop zone with inline thumbs and remove buttons
function SectionDropZone({media,onChange,onOpen}:{media:any[],onChange:(m:any[])=>void,onOpen:(m:any)=>void}) {
  const ref=useRef<HTMLInputElement>(null);
  async function handle(files:FileList|null) {
    if(!files)return;
    const next:any[]=[];
    for(const f of Array.from(files)){
      if(!f.type.startsWith("image/"))continue;
      const dataUrl=await readFile(f);
      next.push({id:Date.now()+Math.random(),name:f.name,dataUrl,type:"image"});
    }
    onChange([...(media||[]),...next]);
  }
  const rm=(id:number)=>onChange((media||[]).filter((m:any)=>m.id!==id));
  const rmSm:any={position:"absolute",top:-5,right:-5,width:17,height:17,borderRadius:"50%",background:"#E8341C",border:"none",color:"#fff",fontSize:10,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700};
  return(
    <div>
      <div onDrop={e=>{e.preventDefault();(e.currentTarget as HTMLElement).style.borderColor=C.border;(e.currentTarget as HTMLElement).style.background=C.bg;handle(e.dataTransfer.files);}}
        onDragOver={e=>{e.preventDefault();(e.currentTarget as HTMLElement).style.borderColor=GREEN;(e.currentTarget as HTMLElement).style.background=GREEN_BG;}}
        onDragLeave={e=>{(e.currentTarget as HTMLElement).style.borderColor=C.border;(e.currentTarget as HTMLElement).style.background=C.bg;}}
        onClick={()=>ref.current?.click()}
        style={{border:`1.5px dashed ${C.border}`,borderRadius:8,padding:"10px",cursor:"pointer",textAlign:"center",transition:"all .15s",background:C.bg}}>
        <div style={{fontSize:12,color:C.textMd,fontWeight:500}}>📎 Drop screenshots here or click to upload</div>
        <div style={{fontSize:10,color:C.textSm,marginTop:2}}>PNG, JPG, GIF</div>
      </div>
      <input ref={ref} type="file" accept="image/*" multiple style={{display:"none"}} onChange={e=>handle(e.target.files)}/>
      {(media||[]).length>0&&<div style={{display:"flex",gap:6,flexWrap:"wrap",marginTop:7}}>
        {media.map((m:any)=>(
          <div key={m.id} style={{position:"relative"}}>
            <img src={m.dataUrl} alt={m.name} onClick={()=>onOpen(m)} style={{width:60,height:60,objectFit:"cover",borderRadius:6,border:`1px solid ${C.border}`,display:"block",cursor:"pointer"}}/>
            <button onClick={e=>{e.stopPropagation();rm(m.id);}} style={rmSm}>×</button>
          </div>
        ))}
      </div>}
    </div>
  );
}

function LinkPill({href,label}:{href:string|null,label:string}) {
  const col = label==="Live page"?{bg:"#EBF4FF",text:"#0066CC",bd:"#C0DAFF"}:label==="Figma"?{bg:"#F0EEFF",text:"#6B3FE4",bd:"#C8B8FF"}:{bg:GREEN_BG,text:GREEN_DK,bd:GREEN_BD};
  if(!href)return null;
  return <a href={href} target="_blank" rel="noreferrer" style={{fontSize:12,fontWeight:500,color:col.text,background:col.bg,border:`1px solid ${col.bd}`,padding:"4px 12px",borderRadius:20,display:"inline-flex",alignItems:"center",gap:4,textDecoration:"none"}}>↗ {label}</a>;
}

const DEFAULT_DESIGNERS = ["Julina","Maulik","Manish"];
const DEFAULT_DEVQA     = ["Dhruv","Vivek","Kezia","Evelyn"];

type OptionPools = {
  designers:string[]; devQA:string[]; checklistTypes:string[]; trafficSources:string[]; owners:string[];
};
function defaultPools():OptionPools {
  return {
    designers:[...DEFAULT_DESIGNERS],
    devQA:[...DEFAULT_DEVQA],
    checklistTypes:[...DEFAULT_CHECKLIST_TYPES],
    trafficSources:[...DEFAULT_TRAFFIC_SOURCES],
    owners:[...DEFAULT_OWNERS],
  };
}

function NewQAModal({onStart,onClose,pools,setPools,initial,mode}:{onStart:(item:any)=>void,onClose:()=>void,pools:OptionPools,setPools:(updater:(p:OptionPools)=>OptionPools)=>void,initial?:any,mode?:"create"|"edit"}) {
  const isEdit = mode==="edit";
  const [title,setTitle]=useState(initial?.name||"");
  const [liveUrl,setLiveUrl]=useState(initial?.url||"");
  const [figmaUrl,setFigmaUrl]=useState(initial?.figma||"");
  const [revUrl,setRevUrl]=useState(initial?.revision||"");
  const [checklistType,setChecklistType]=useState(initial?.checklistType||"");
  const [trafficSource,setTrafficSource]=useState(initial?.trafficSource||"");
  const [owner,setOwner]=useState(initial?.owner||"");
  const [dateAdded,setDateAdded]=useState(initial?.dateAdded||todayISO());
  const [designers,setDesigners]=useState<string[]>(initial?.designers||[]);
  const [reviewers,setReviewers]=useState<string[]>(initial?.reviewers||[]);
  const [addingDes,setAddingDes]=useState(false);
  const [addingDev,setAddingDev]=useState(false);
  const [newDes,setNewDes]=useState("");
  const [newDev,setNewDev]=useState("");
  const [errors,setErrors]=useState<any>({});
  const designerOptions=pools.designers;
  const devQAOptions=pools.devQA;
  function toggleDes(name:string){setDesigners(p=>p.includes(name)?p.filter(n=>n!==name):[...p,name]);}
  function toggleR(name:string){setReviewers(p=>p.includes(name)?p.filter(n=>n!==name):[...p,name]);setErrors((p:any)=>({...p,reviewers:undefined}));}
  function addDes(){const n=newDes.trim();if(!n)return;if(!designerOptions.includes(n))setPools(p=>({...p,designers:[...p.designers,n]}));setDesigners(p=>p.includes(n)?p:[...p,n]);setNewDes("");setAddingDes(false);}
  function addDev(){const n=newDev.trim();if(!n)return;if(!devQAOptions.includes(n))setPools(p=>({...p,devQA:[...p.devQA,n]}));setReviewers(p=>p.includes(n)?p:[...p,n]);setNewDev("");setAddingDev(false);}
  function validate(){const e:any={};if(!title.trim())e.title="Required";if(liveUrl&&!isValidUrl(liveUrl))e.liveUrl="Invalid URL";if(figmaUrl&&!isValidUrl(figmaUrl))e.figmaUrl="Invalid URL";if(revUrl&&!isValidUrl(revUrl))e.revUrl="Invalid URL";if(reviewers.length===0)e.reviewers="Select at least one Dev QA reviewer";return e;}
  function go(){const e=validate();if(Object.keys(e).length){setErrors(e);return;}const ordDes=designerOptions.filter(n=>designers.includes(n));const ordRev=devQAOptions.filter(n=>reviewers.includes(n));const now=new Date().toISOString();const base=isEdit?{...initial}:{id:Date.now().toString(),createdAt:now};onStart({...base,name:title.trim(),url:liveUrl.trim()||null,figma:figmaUrl.trim()||null,revision:revUrl.trim()||null,designers:ordDes,reviewers:ordRev,checklistType:checklistType||null,trafficSource:trafficSource||null,owner:owner||null,dateAdded:dateAdded||todayISO(),lastEditedAt:now});}
  const inp=(err:any):any=>({width:"100%",background:C.bgOff,border:`1px solid ${err?"#E8341C":C.border}`,borderRadius:8,padding:"9px 12px",fontSize:13,color:C.text,outline:"none",transition:"border-color .15s",fontFamily:"inherit"});
  const cbRow=(name:string,on:boolean,toggle:()=>void,accent:string)=>(
    <label key={name} style={{display:"flex",alignItems:"center",gap:8,padding:"5px 4px",cursor:"pointer",fontSize:13,color:C.text}}>
      <span onClick={toggle} style={{width:17,height:17,borderRadius:4,border:`1.5px solid ${on?accent:C.borderMd}`,background:on?accent:C.bg,color:"#fff",fontSize:11,fontWeight:800,display:"inline-flex",alignItems:"center",justifyContent:"center",flexShrink:0,transition:"all .12s"}}>{on?"✓":""}</span>
      <span onClick={toggle} style={{flex:1}}>{name}</span>
    </label>
  );
  const groupBox:any={flex:1,minWidth:0,border:`1px solid ${C.border}`,borderRadius:10,padding:"11px 13px",background:C.bgOff};
  const groupTitle=(emoji:string,label:string,col:string)=>(
    <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:7,fontSize:11,fontWeight:700,letterSpacing:"0.08em",textTransform:"uppercase",color:col}}>
      <span>{emoji}</span>{label}
    </div>
  );
  return(
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.5)",zIndex:200,display:"flex",alignItems:"center",justifyContent:"center",padding:24}} onClick={onClose}>
      <div onClick={e=>e.stopPropagation()} style={{background:C.bg,borderRadius:16,padding:"28px",width:"100%",maxWidth:560,maxHeight:"92vh",overflowY:"auto",boxShadow:"0 24px 60px rgba(0,0,0,.18)"}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:22}}>
          <div><div style={{fontSize:17,fontWeight:800}}>{isEdit?"Edit QA Task":"New QA Task"}</div><div style={{fontSize:12,color:C.textSm,marginTop:2}}>{isEdit?"Update task details — changes save instantly":"Fill in the details to start a QA session"}</div></div>
          <button onClick={onClose} style={{background:C.bgOff,border:`1px solid ${C.border}`,color:C.textMd,width:30,height:30,borderRadius:"50%",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontSize:15,fontWeight:700}}>×</button>
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:14}}>
          {[["Page name *",title,setTitle,"e.g. NWM - FB - Alpha Lion",errors.title,"title"],["Live page URL",liveUrl,setLiveUrl,"https://www.innosupps.com/products/...",errors.liveUrl,"liveUrl"],["Figma URL",figmaUrl,setFigmaUrl,"https://www.figma.com/design/...",errors.figmaUrl,"figmaUrl"],["Final revision URL",revUrl,setRevUrl,"https://...",errors.revUrl,"revUrl"]].map(([label,val,setter,ph,err,key])=>(
            <div key={key as string}>
              <label style={{fontSize:12,fontWeight:600,display:"block",marginBottom:5}}>{label as string}</label>
              <input value={val as string} onChange={e=>{(setter as any)(e.target.value);setErrors((p:any)=>({...p,[key as string]:undefined}));}} placeholder={ph as string} style={inp(err)}
                onFocus={e=>(e.target as HTMLInputElement).style.borderColor=GREEN} onBlur={e=>(e.target as HTMLInputElement).style.borderColor=err?"#E8341C":C.border}/>
              {err&&<div style={{fontSize:11,color:"#E8341C",marginTop:3}}>{err as string}</div>}
            </div>
          ))}
          {/* Metadata: Checklist Type, Traffic Source, Owner, Date Added */}
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit, minmax(200px, 1fr))",gap:10}}>
            <DropdownPicker label="Checklist Type" value={checklistType} options={pools.checklistTypes}
              onChange={setChecklistType} onAddOption={v=>setPools(p=>({...p,checklistTypes:[...p.checklistTypes,v]}))}
              accent={PINK} placeholder="Select..."/>
            <DropdownPicker label="Traffic Source" value={trafficSource} options={pools.trafficSources}
              onChange={setTrafficSource} onAddOption={v=>setPools(p=>({...p,trafficSources:[...p.trafficSources,v]}))}
              accent={PINK} placeholder="Select..."/>
            <DropdownPicker label="Owner" value={owner} options={pools.owners}
              onChange={setOwner} onAddOption={v=>setPools(p=>({...p,owners:[...p.owners,v]}))}
              accent={PINK} placeholder="Select owner..."/>
            <div>
              <label style={{fontSize:11,fontWeight:700,letterSpacing:"0.08em",textTransform:"uppercase",color:C.textSm,display:"block",marginBottom:5}}>Date Added</label>
              <input type="date" value={dateAdded} onChange={e=>setDateAdded(e.target.value)}
                style={{width:"100%",background:C.bgOff,border:`1px solid ${C.border}`,borderRadius:8,padding:"8px 12px",fontSize:13,color:C.text,outline:"none",fontFamily:"inherit"}}/>
            </div>
          </div>
          <div>
            <div style={{fontSize:11,fontWeight:700,letterSpacing:"0.08em",textTransform:"uppercase",color:C.textSm,marginBottom:8}}>Assign Team Members</div>
            <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
              <div style={groupBox}>
                {groupTitle("🎨","Designer","#7B3FE4")}
                <div style={{display:"flex",flexDirection:"column"}}>
                  {designerOptions.map(name=>cbRow(name,designers.includes(name),()=>toggleDes(name),"#7B3FE4"))}
                </div>
                {addingDes?(
                  <div style={{display:"flex",gap:5,marginTop:6}}>
                    <input autoFocus value={newDes} onChange={e=>setNewDes(e.target.value)} onKeyDown={e=>{if(e.key==="Enter")addDes();if(e.key==="Escape"){setAddingDes(false);setNewDes("");}}} placeholder="Name" style={{flex:1,minWidth:0,background:C.bg,border:`1px solid ${C.border}`,borderRadius:6,padding:"5px 8px",fontSize:12,outline:"none",fontFamily:"inherit"}}/>
                    <button onClick={addDes} style={{fontSize:11,fontWeight:600,padding:"4px 9px",borderRadius:6,border:"none",background:"#7B3FE4",color:"#fff",cursor:"pointer",fontFamily:"inherit"}}>Add</button>
                  </div>
                ):(
                  <button type="button" onClick={()=>setAddingDes(true)} style={{marginTop:4,background:"none",border:"none",color:"#7B3FE4",fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:"inherit",padding:"4px 0",textAlign:"left"}}>+ Add person</button>
                )}
              </div>
              <div style={groupBox}>
                {groupTitle("💻","Dev QA","#111111")}
                <div style={{display:"flex",flexDirection:"column"}}>
                  {devQAOptions.map(name=>cbRow(name,reviewers.includes(name),()=>toggleR(name),GREEN_DK))}
                </div>
                {addingDev?(
                  <div style={{display:"flex",gap:5,marginTop:6}}>
                    <input autoFocus value={newDev} onChange={e=>setNewDev(e.target.value)} onKeyDown={e=>{if(e.key==="Enter")addDev();if(e.key==="Escape"){setAddingDev(false);setNewDev("");}}} placeholder="Name" style={{flex:1,minWidth:0,background:C.bg,border:`1px solid ${C.border}`,borderRadius:6,padding:"5px 8px",fontSize:12,outline:"none",fontFamily:"inherit"}}/>
                    <button onClick={addDev} style={{fontSize:11,fontWeight:600,padding:"4px 9px",borderRadius:6,border:"none",background:GREEN_DK,color:"#fff",cursor:"pointer",fontFamily:"inherit"}}>Add</button>
                  </div>
                ):(
                  <button type="button" onClick={()=>setAddingDev(true)} style={{marginTop:4,background:"none",border:"none",color:GREEN_DK,fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:"inherit",padding:"4px 0",textAlign:"left"}}>+ Add person</button>
                )}
              </div>
            </div>
            {errors.reviewers&&<div style={{fontSize:11,color:"#E8341C",marginTop:6}}>{errors.reviewers}</div>}
            <div style={{fontSize:11,color:C.textSm,marginTop:6}}>Dev QA members get checklist tabs. Designers are listed on the task for sign-off.</div>
          </div>
        </div>
        <div style={{display:"flex",gap:10,marginTop:22,justifyContent:"flex-end"}}>
          <button onClick={onClose} style={{background:"none",border:`1px solid ${C.border}`,color:C.textMd,padding:"9px 18px",borderRadius:20,cursor:"pointer",fontSize:13,fontWeight:500,fontFamily:"inherit"}}>Cancel</button>
          <button onClick={go} style={{background:"#111",color:"#fff",border:"none",padding:"9px 22px",borderRadius:20,cursor:"pointer",fontSize:13,fontWeight:700,fontFamily:"inherit"}}
            onMouseEnter={e=>(e.currentTarget as HTMLElement).style.background=GREEN} onMouseLeave={e=>(e.currentTarget as HTMLElement).style.background="#111"}>
            {isEdit?"Save changes":"Start QA →"}
          </button>
        </div>
      </div>
    </div>
  );
}

function BugTracker({bugs,onUpdate,onOpen}:{bugs:any[],onUpdate:(id:any,action:string,val?:string)=>void,onOpen:(m:any)=>void}) {
  if(bugs.length===0)return(
    <div style={{padding:"28px 20px",textAlign:"center"}}>
      <div style={{width:44,height:44,borderRadius:"50%",background:C.bgOff,border:`1px solid ${C.border}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,margin:"0 auto 10px"}}>⚑</div>
      <div style={{fontSize:14,fontWeight:600,marginBottom:5}}>No bugs logged yet</div>
      <div style={{fontSize:12,color:C.textMd}}>Go to Checklist and click <strong style={{color:"#E8341C"}}>Flag</strong> on any issue.</div>
    </div>
  );
  const open=bugs.filter(b=>b.status==="open"||b.status==="sent").length;
  const fixed=bugs.filter(b=>b.status==="fixed").length;
  return(
    <div>
      <div style={{display:"flex",gap:8,marginBottom:14}}>
        <span style={{fontSize:12,fontWeight:600,color:"#E8341C",background:"#FEF0ED",border:"1px solid #F5C4BA",padding:"3px 10px",borderRadius:20}}>{open} open</span>
        <span style={{fontSize:12,fontWeight:600,color:GREEN_DK,background:GREEN_BG,border:`1px solid ${GREEN_BD}`,padding:"3px 10px",borderRadius:20}}>{fixed} fixed</span>
      </div>
      {bugs.map(bug=>(
        <div key={bug.id} style={{background:bug.status==="fixed"?GREEN_BG:"#FEF8F7",border:`1px solid ${bug.status==="fixed"?GREEN_BD:"#F5C4BA"}`,borderRadius:10,padding:"11px 13px",marginBottom:7}}>
          <div style={{display:"flex",alignItems:"flex-start",gap:10}}>
            <div style={{flex:1}}>
              <div style={{display:"flex",gap:6,marginBottom:5,flexWrap:"wrap",alignItems:"center"}}>
                <span style={{fontSize:11,fontWeight:600,color:"#0066CC",background:"#EBF4FF",border:"1px solid #C0DAFF",padding:"1px 8px",borderRadius:20}}>{bug.reviewer}</span>
                <span style={{fontSize:11,color:C.textMd,background:C.bgOff,border:`1px solid ${C.border}`,padding:"1px 8px",borderRadius:20}}>{bug.section}</span>
                <span style={{fontSize:11,fontWeight:600,color:bug.status==="fixed"?GREEN_DK:"#E8341C"}}>{bug.status==="fixed"?"✓ Fixed":bug.status==="sent"?"↗ Sent":"● Open"}</span>
              </div>
              <div style={{fontSize:13,fontWeight:500,color:bug.status==="fixed"?C.textMd:C.text,textDecoration:bug.status==="fixed"?"line-through":"none",marginBottom:bug.note?3:0,lineHeight:1.4}}>{bug.item}</div>
              {bug.note&&<div style={{fontSize:12,color:C.textMd,fontStyle:"italic",marginBottom:3}}>{bug.note}</div>}
              <MediaThumbs media={bug.media} onOpen={onOpen}/>
              {bug.fixNote&&<div style={{marginTop:5,fontSize:12,color:GREEN_DK,background:GREEN_BG,border:`1px solid ${GREEN_BD}`,borderRadius:6,padding:"3px 9px",fontWeight:500}}>Fix: {bug.fixNote}</div>}
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:4,flexShrink:0}}>
              {bug.status==="open"&&<button onClick={()=>onUpdate(bug.id,"send")} style={{fontSize:11,fontWeight:500,padding:"4px 10px",borderRadius:20,border:"1px solid #C0DAFF",background:"#EBF4FF",color:"#0066CC",cursor:"pointer",fontFamily:"inherit",whiteSpace:"nowrap"}}>→ Send to dev</button>}
              {(bug.status==="open"||bug.status==="sent")&&<button onClick={()=>onUpdate(bug.id,"fix")} style={{fontSize:11,fontWeight:500,padding:"4px 10px",borderRadius:20,border:`1px solid ${GREEN_BD}`,background:GREEN_BG,color:GREEN_DK,cursor:"pointer",fontFamily:"inherit",whiteSpace:"nowrap"}}>✓ Mark fixed</button>}
              {bug.status==="fixed"&&<button onClick={()=>onUpdate(bug.id,"reopen")} style={{fontSize:11,fontWeight:500,padding:"4px 10px",borderRadius:20,border:`1px solid ${C.border}`,background:C.bgOff,color:C.textMd,cursor:"pointer",fontFamily:"inherit",whiteSpace:"nowrap"}}>↩ Reopen</button>}
            </div>
          </div>
          {bug.status!=="fixed"&&<div style={{marginTop:7}}><input value={bug.pendingFixNote||""} onChange={e=>onUpdate(bug.id,"note",e.target.value)} placeholder="Add fix note..." style={{width:"100%",background:C.bg,border:`1px solid ${C.border}`,borderRadius:8,padding:"6px 10px",fontSize:12,color:C.text,fontFamily:"inherit",outline:"none"}}/></div>}
        </div>
      ))}
    </div>
  );
}

// ── Main App ────────────────────────────────────────────────────────────────
export default function QAApp() {
  const [view,setView]=useState("home");
  const [qaTab,setQaTab]=useState("checklist");
  const [showModal,setShowModal]=useState(false);
  const [showEditModal,setShowEditModal]=useState(false);
  const [queue,setQueue]=useState<any[]>([]);
  const [active,setActive]=useState<any>(null);
  const [activeR,setActiveR]=useState(REVIEWERS[0]);
  const [rd,setRD]=useState<any>(initRD());
  const [pc,setPC]=useState<any>(initPC());
  const [secData,setSecData]=useState<any>({}); // {[reviewer]:{[secId]:{note,media}}}
  const [openSecs,setOpenSecs]=useState<any>(()=>Object.fromEntries(CHECKLIST.map(s=>[s.id,true])));
  const [bugs,setBugs]=useState<any[]>([]);
  const [submitting,setSub]=useState(false);
  const [log,setLog]=useState<any[]>([]);
  const [logLoad,setLogLoad]=useState(false);
  const [toast,setToast]=useState<any>(null);
  const [lightbox,setLightbox]=useState<any>(null);
  const [gNotes,setGNotes]=useState("");
  const [gMedia,setGMedia]=useState<any[]>([]);
  const [sessions,setSessions]=useState<any>({});
  const [pools,setPoolsRaw]=useState<OptionPools>(defaultPools());
  const setPools=useCallback((updater:(p:OptionPools)=>OptionPools)=>{setPoolsRaw(prev=>{const next=updater(prev);try{localStorage.setItem("qa_pools",JSON.stringify(next));}catch{}return next;});},[]);
  const [logSearch,setLogSearch]=useState("");
  const [logOwnerFilter,setLogOwnerFilter]=useState<string>("all"); // "all" | owner name | "unassigned"
  const autoSaveTimer=useRef<any>(null);

  // Reviewers selected for the active task (falls back to all 3 for older sessions)
  const activeReviewers:string[] = (active?.reviewers && Array.isArray(active.reviewers) && active.reviewers.length>0) ? active.reviewers : REVIEWERS;

  function initSecData(revs:string[]=REVIEWERS){const r:any={};revs.forEach(n=>{r[n]={};CHECKLIST.forEach(sec=>{r[n][sec.id]={note:"",media:[]};});});return r;}

  const showToast=(msg:string,ok=true)=>{setToast({msg,ok});setTimeout(()=>setToast(null),3400);};

  // ── Load initial data ──
  useEffect(()=>{
    fetch("/api/queue").then(r=>r.json()).then(setQueue).catch(()=>{});
    fetch("/api/sessions").then(r=>r.json()).then(setSessions).catch(()=>{});
    try{const stored=localStorage.getItem("qa_pools");if(stored){const parsed=JSON.parse(stored);setPoolsRaw({...defaultPools(),...parsed});}}catch{}
  },[]);

  const loadLog=useCallback(async()=>{
    setLogLoad(true);
    try{const r=await fetch("/api/log");setLog(await r.json());}
    catch{setLog([]);}
    setLogLoad(false);
  },[]);

  useEffect(()=>{if(view==="log")loadLog();},[view]);

  // ── Auto-save sessions to server ──
  useEffect(()=>{
    if(view==="qa"&&active){
      if(autoSaveTimer.current)clearTimeout(autoSaveTimer.current);
      autoSaveTimer.current=setTimeout(()=>{
        const snapshot={active,rd,pc,secData,bugs,gNotes,gMedia,savedAt:Date.now()};
        setSessions((prev:any)=>({...prev,[active.id]:snapshot}));
        fetch("/api/sessions",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({itemId:active.id,snapshot})}).catch(()=>{});
      },800);
    }
  },[rd,pc,secData,bugs,gNotes,gMedia]);

  async function openQA(item:any,resume=false){
    const saved=sessions[item.id];
    const revs:string[] = (item.reviewers && Array.isArray(item.reviewers) && item.reviewers.length>0) ? item.reviewers : REVIEWERS;
    if(resume&&saved){
      const savedRevs:string[] = (saved.active?.reviewers && Array.isArray(saved.active.reviewers) && saved.active.reviewers.length>0) ? saved.active.reviewers : REVIEWERS;
      // Merge saved state with any reviewer that's missing (e.g. team list changed)
      const baseRD=initRD(savedRevs);const baseRD2={...baseRD,...(saved.rd||{})};
      const basePC=initPC(savedRevs);const basePC2={...basePC,...(saved.pc||{})};
      const baseSD=initSecData(savedRevs);const baseSD2={...baseSD,...(saved.secData||{})};
      setActive(saved.active);setRD(baseRD2);setPC(basePC2);setSecData(baseSD2);
      setBugs(saved.bugs||[]);setGNotes(saved.gNotes||"");setGMedia(saved.gMedia||[]);
      setActiveR(savedRevs[0]);
    } else {
      setActive(item);setRD(initRD(revs));setPC(initPC(revs));setSecData(initSecData(revs));
      setBugs([]);setGNotes("");setGMedia([]);
      setActiveR(revs[0]);
    }
    setQaTab("checklist");setView("qa");
  }

  async function handleStart(item:any){
    await fetch("/api/queue",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(item)});
    setQueue(prev=>[...prev.filter((q:any)=>q.id!==item.id),item]);
    setShowModal(false);
    openQA(item);
  }

  async function handleEditSave(updated:any){
    // Persist to queue (PUT upserts)
    fetch("/api/queue",{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify(updated)}).catch(()=>{});
    setQueue(prev=>prev.map((q:any)=>q.id===updated.id?{...q,...updated}:q));
    // Update active task if it's the one being edited (so QA view picks up changes immediately)
    if(active&&active.id===updated.id){
      setActive(updated);
      // If reviewer list changed, ensure rd/pc/secData have entries for the new set
      const newRevs:string[] = (updated.reviewers&&Array.isArray(updated.reviewers)&&updated.reviewers.length>0) ? updated.reviewers : REVIEWERS;
      setRD((p:any)=>{const base=initRD(newRevs);return{...base,...p};});
      setPC((p:any)=>{const base=initPC(newRevs);return{...base,...p};});
      setSecData((p:any)=>{const base=initSecData(newRevs);return{...base,...p};});
      if(!newRevs.includes(activeR))setActiveR(newRevs[0]);
    }
    setShowEditModal(false);
    showToast("Task updated ✓",true);
  }

  async function removeFromQueue(id:string){
    await fetch("/api/queue",{method:"DELETE",headers:{"Content-Type":"application/json"},body:JSON.stringify({id})});
    setQueue(prev=>prev.filter((q:any)=>q.id!==id));
  }

  async function clearSession(itemId:string){
    setSessions((prev:any)=>{const n={...prev};delete n[itemId];return n;});
    await fetch("/api/sessions",{method:"DELETE",headers:{"Content-Type":"application/json"},body:JSON.stringify({itemId})}).catch(()=>{});
  }

  const gc=(r:string)=>rd[r].checks;

  function cycleCheck(r:string,sid:string,i:number){setRD((p:any)=>{const n=JSON.parse(JSON.stringify(p));n[r].checks[sid][i].state=cycleS(n[r].checks[sid][i].state);return n;});}
  function toggleFlag(r:string,sid:string,i:number){
    setRD((p:any)=>{
      const n=JSON.parse(JSON.stringify(p));const c=n[r].checks[sid][i];const was=c.state==="flagged";
      c.state=was?"unchecked":"flagged";
      const sec=CHECKLIST.find(s=>s.id===sid)!;
      if(!was){setBugs(prev=>{if(prev.find((b:any)=>b.reviewer===r&&b.section===sec.label&&b.item===sec.items[i]))return prev;return[...prev,{id:Date.now()+Math.random(),reviewer:r,section:sec.label,item:sec.items[i],note:c.note,media:c.media,status:"open",pendingFixNote:"",fixNote:""}];});}
      else{setBugs(prev=>prev.filter((b:any)=>!(b.reviewer===r&&b.section===sec.label&&b.item===sec.items[i])));}
      return n;
    });
  }
  function setINote(r:string,sid:string,i:number,v:string){setRD((p:any)=>{const n=JSON.parse(JSON.stringify(p));n[r].checks[sid][i].note=v;const sec=CHECKLIST.find(s=>s.id===sid)!;setBugs(prev=>prev.map((b:any)=>b.reviewer===r&&b.section===sec.label&&b.item===sec.items[i]?{...b,note:v}:b));return n;});}
  function setIMedia(r:string,sid:string,i:number,m:any[]){setRD((p:any)=>{const n=JSON.parse(JSON.stringify(p));n[r].checks[sid][i].media=m;const sec=CHECKLIST.find(s=>s.id===sid)!;setBugs(prev=>prev.map((b:any)=>b.reviewer===r&&b.section===sec.label&&b.item===sec.items[i]?{...b,media:m}:b));return n;});}
  function setRNotes(r:string,v:string){setRD((p:any)=>{const n=JSON.parse(JSON.stringify(p));n[r].notes=v;return n;});}
  function setRMedia(r:string,m:any[]){setRD((p:any)=>{const n=JSON.parse(JSON.stringify(p));n[r].media=m;return n;});}
  function setSecNote(r:string,sid:string,v:string){setSecData((p:any)=>{const n=JSON.parse(JSON.stringify(p));if(!n[r])n[r]={};if(!n[r][sid])n[r][sid]={note:"",media:[]};n[r][sid].note=v;return n;});}
  function setSecMedia(r:string,sid:string,m:any[]){setSecData((p:any)=>{const n=JSON.parse(JSON.stringify(p));if(!n[r])n[r]={};if(!n[r][sid])n[r][sid]={note:"",media:[]};n[r][sid].media=m;return n;});}
  function getSec(r:string,sid:string){return secData?.[r]?.[sid]||{note:"",media:[]};}
  function toggleDone(r:string){setRD((p:any)=>{const n=JSON.parse(JSON.stringify(p));n[r].done=!n[r].done;return n;});}
  function cyclePlat(r:string,pl:string){setPC((p:any)=>{const n=JSON.parse(JSON.stringify(p));const c=n[r][pl];n[r][pl]=c==="unchecked"?"checked":c==="checked"?"na":"unchecked";return n;});}

  function rProg(r:string){const flat=Object.values(gc(r)).flat() as any[];const act=flat.filter((c:any)=>c.state!=="na");const done=act.filter((c:any)=>c.state==="checked"||c.state==="flagged");return{done:done.length,total:act.length,pct:act.length?Math.round(done.length/act.length*100):0};}
  function rFlags(r:string){const f:any[]=[];CHECKLIST.forEach(sec=>sec.items.forEach((item,i)=>{if(gc(r)[sec.id][i].state==="flagged")f.push({section:sec.label,item,note:gc(r)[sec.id][i].note,media:gc(r)[sec.id][i].media});}));return f;}
  function updBug(id:any,action:string,val?:string){setBugs(prev=>prev.map((b:any)=>{if(b.id!==id)return b;if(action==="send")return{...b,status:"sent"};if(action==="fix")return{...b,status:"fixed",fixNote:b.pendingFixNote||""};if(action==="reopen")return{...b,status:"open",fixNote:""};if(action==="note")return{...b,pendingFixNote:val};return b;}));}

  const canSubmit=activeReviewers.every(r=>rd[r]?.done);
  const actProg=rProg(activeReviewers.includes(activeR)?activeR:activeReviewers[0]);
  const openBugs=bugs.filter(b=>b.status==="open"||b.status==="sent").length;
  const sessionCount=Object.keys(sessions).length;

  function stripMedia(arr:any[]){if(!arr)return[];return arr.map(m=>({id:m.id,name:m.name,type:m.type,dataUrl:m.dataUrl}));}

  async function submit(){
    if(!canSubmit)return;
    setSub(true);
    const sums=activeReviewers.map(r=>({reviewer:r,flags:rFlags(r).map(f=>({...f,media:stripMedia(f.media)})),platforms:pc[r],done:rd[r].done,notes:rd[r].notes,media:stripMedia(rd[r].media),sectionNotes:(()=>{const out:any={};CHECKLIST.forEach(sec=>{const sd=getSec(r,sec.id);out[sec.id]={note:sd.note||"",media:stripMedia(sd.media||[])};});return out;})(),checks:(()=>{const out:any={};CHECKLIST.forEach(sec=>{out[sec.id]=gc(r)[sec.id].map((c:any)=>({state:c.state,note:c.note,media:stripMedia(c.media)}));});return out;})()}));
    const entry={id:Date.now().toString(),itemId:active.id,itemName:active.name,url:active.url,figma:active.figma,revision:active.revision,reviewers:activeReviewers,designers:active.designers||[],checklistType:active.checklistType||null,trafficSource:active.trafficSource||null,owner:active.owner||null,dateAdded:active.dateAdded||null,lastEditedAt:active.lastEditedAt||null,reviewerSummaries:sums,bugs:bugs.map(b=>({...b,media:stripMedia(b.media)})),globalNotes:gNotes,globalMedia:stripMedia(gMedia),completedAt:new Date().toISOString(),passed:bugs.length===0||bugs.every(b=>b.status==="fixed")};
    try{
      await fetch("/api/log",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(entry)});
      await removeFromQueue(active.id);
      await clearSession(active.id);
      showToast("QA submitted and saved ✓",true);
      setTimeout(()=>setView("log"),1400);
    }catch(e){
      console.error(e);
      showToast("Save error — check connection",false);
    }
    setSub(false);
  }

  const nb=(active:boolean):any=>({background:"none",border:"none",cursor:"pointer",fontFamily:"inherit",color:active?C.text:C.textMd,fontSize:13,fontWeight:active?700:500,paddingBottom:"14px",borderBottom:active?`2px solid ${GREEN}`:"2px solid transparent",marginBottom:-1,transition:"all .2s"});
  const tb=(active:boolean,col=GREEN):any=>({background:"none",border:"none",cursor:"pointer",fontFamily:"inherit",color:active?col:C.textMd,fontSize:13,fontWeight:active?700:500,padding:"8px 16px",borderBottom:active?`2px solid ${col}`:"2px solid transparent",marginBottom:-1,display:"flex",alignItems:"center",gap:6,transition:"all .2s"});
  const rtb=(active:boolean):any=>({background:active?GREEN_BG:"none",border:"none",borderBottom:active?`2px solid ${GREEN}`:"2px solid transparent",cursor:"pointer",fontFamily:"inherit",fontSize:13,color:active?GREEN_DK:C.textMd,fontWeight:active?700:500,padding:"8px 14px",marginBottom:-1,borderRadius:"6px 6px 0 0",display:"flex",alignItems:"center",gap:6,transition:"all .15s"});

  return(
    <div style={{fontFamily:"'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif",background:C.bgOff,minHeight:"100vh",color:C.text}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        *{box-sizing:border-box;margin:0;padding:0;font-family:'Inter',-apple-system,sans-serif}
        ::-webkit-scrollbar{width:4px}::-webkit-scrollbar-track{background:#f0f0ec}::-webkit-scrollbar-thumb{background:#ccc;border-radius:2px}
        a{color:inherit;text-decoration:none}
        @keyframes fadeUp{from{opacity:0;transform:translateY(5px)}to{opacity:1;transform:none}}
        @keyframes si{from{opacity:0;transform:translateX(-4px)}to{opacity:1;transform:none}}
        @keyframes pulseA{0%,100%{opacity:.5;transform:scale(1)}50%{opacity:1;transform:scale(1.3)}}
        .fade{animation:fadeUp .22s ease both}.si{animation:si .16s ease both}
        .thumb{transition:opacity .15s;border-radius:6px}.thumb:hover{opacity:.72}
        details>summary{list-style:none}details>summary::-webkit-details-marker{display:none}
        input::placeholder,textarea::placeholder{color:#aaa}
        .card{background:#fff;border:1px solid #E8E8E4;border-radius:12px;box-shadow:0 1px 4px rgba(0,0,0,.05)}
        .hov:hover{box-shadow:0 4px 16px rgba(0,0,0,.08)!important;border-color:#D0D0C8!important}
        .green-hover:hover{background:${GREEN}!important}
      `}</style>

      {/* NAV */}
      <div style={{background:C.bg,borderBottom:`1px solid ${C.border}`,padding:"0 24px",display:"flex",alignItems:"center",gap:20,position:"sticky",top:0,zIndex:50,boxShadow:"0 1px 0 rgba(0,0,0,.05)"}}>
        <div style={{display:"flex",alignItems:"center",gap:9,marginRight:16,padding:"13px 0"}}>
          <div style={{width:30,height:30,borderRadius:8,background:"#111",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
            <span style={{fontSize:12,fontWeight:800,color:GREEN,letterSpacing:"-0.5px"}}>IS</span>
          </div>
          <div style={{fontSize:13,fontWeight:700,lineHeight:1.15}}>QA Platform</div>
        </div>
        <button style={nb(view==="home")} onClick={()=>setView("home")}>Queue</button>
        {sessionCount>0&&view!=="qa"&&(
          <button style={{...nb(false),color:"#F0A500",borderBottom:"2px solid #F0A500",marginBottom:-1,display:"flex",alignItems:"center",gap:6}}
            onClick={()=>{const first=Object.values(sessions)[0] as any;openQA(first.active,true);}}>
            <span style={{width:7,height:7,borderRadius:"50%",background:"#F0A500",animation:"pulseA 1.4s ease infinite",display:"inline-block"}}/>
            QA In Progress
            {sessionCount>1&&<span style={{fontSize:10,fontWeight:700,color:"#fff",background:"#F0A500",padding:"1px 6px",borderRadius:20}}>{sessionCount}</span>}
          </button>
        )}
        {view==="qa"&&<button style={{...nb(false),color:"#F0A500",borderBottom:"2px solid #F0A500",marginBottom:-1}}>QA In Progress</button>}
        <button style={nb(view==="log")} onClick={()=>setView("log")}>Completed Log</button>
        <div style={{flex:1}}/>
        {view==="qa"&&(
          <div style={{display:"flex",alignItems:"center",gap:12}}>
            {openBugs>0&&<span style={{fontSize:11,fontWeight:600,color:"#E8341C",background:"#FEF0ED",border:"1px solid #F5C4BA",padding:"3px 10px",borderRadius:20}}>{openBugs} bug{openBugs>1?"s":""}</span>}
            <div style={{display:"flex",alignItems:"center",gap:7}}>
              <div style={{width:100,height:5,background:C.bgOff,borderRadius:3,overflow:"hidden",border:`1px solid ${C.border}`}}>
                <div style={{width:actProg.pct+"%",height:"100%",background:actProg.pct===100?GREEN:"#111",borderRadius:3,transition:"width .3s,background .3s"}}/>
              </div>
              <span style={{fontSize:12,fontWeight:700,color:actProg.pct===100?GREEN_DK:C.text,minWidth:30}}>{actProg.pct}%</span>
            </div>
            <button onClick={()=>setView("home")} style={{background:C.bgOff,border:`1px solid ${C.border}`,color:C.textMd,width:28,height:28,borderRadius:"50%",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,fontWeight:700}}>×</button>
          </div>
        )}
      </div>

      {/* HOME */}
      {view==="home"&&(
        <div className="fade" style={{maxWidth:760,margin:"0 auto",padding:"32px 24px"}}>
          <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:24,gap:16,flexWrap:"wrap"}}>
            <div>
              <h1 style={{fontSize:24,fontWeight:800,marginBottom:5}}>QA Queue</h1>
              <div style={{fontSize:13,color:C.textMd}}>{queue.length} item{queue.length!==1?"s":""} in queue</div>
            </div>
            <button onClick={()=>setShowModal(true)} style={{background:"#111",color:"#fff",border:"none",cursor:"pointer",fontFamily:"inherit",fontSize:13,fontWeight:700,padding:"10px 20px",borderRadius:20,display:"flex",alignItems:"center",gap:7,transition:"background .2s",flexShrink:0}}
              onMouseEnter={e=>(e.currentTarget as HTMLElement).style.background=GREEN} onMouseLeave={e=>(e.currentTarget as HTMLElement).style.background="#111"}>
              <span style={{fontSize:16,lineHeight:1}}>+</span> New QA Task
            </button>
          </div>
          {queue.length===0?(
            <div className="card" style={{padding:"40px 24px",textAlign:"center"}}>
              <div style={{width:52,height:52,borderRadius:"50%",background:C.bgOff,border:`1px solid ${C.border}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,margin:"0 auto 14px"}}>📋</div>
              <div style={{fontSize:15,fontWeight:700,marginBottom:6}}>No QA tasks yet</div>
              <div style={{fontSize:13,color:C.textMd,marginBottom:18}}>Click "+ New QA Task" to add a page to the queue</div>
              <button onClick={()=>setShowModal(true)} style={{background:"#111",color:"#fff",border:"none",cursor:"pointer",fontFamily:"inherit",fontSize:13,fontWeight:600,padding:"9px 20px",borderRadius:20,display:"inline-flex",alignItems:"center",gap:6,transition:"background .2s"}}
                onMouseEnter={e=>(e.currentTarget as HTMLElement).style.background=GREEN} onMouseLeave={e=>(e.currentTarget as HTMLElement).style.background="#111"}>
                <span style={{fontSize:15}}>+</span> New QA Task
              </button>
            </div>
          ):queue.map((item:any,i:number)=>{
            const itemRevs:string[] = (item.reviewers && Array.isArray(item.reviewers) && item.reviewers.length>0) ? item.reviewers : REVIEWERS;
            const itemDes:string[] = (item.designers && Array.isArray(item.designers)) ? item.designers : [];
            return(
            <div key={item.id} className="fade card hov" style={{animationDelay:i*0.06+"s",padding:"15px 17px",marginBottom:8,transition:"box-shadow .2s,border-color .2s"}}>
              <div style={{display:"flex",alignItems:"flex-start",gap:14}}>
                <div style={{flex:1}}>
                  <div style={{fontSize:15,fontWeight:700,marginBottom:8}}>{item.name}</div>
                  <div style={{display:"flex",gap:7,flexWrap:"wrap",marginBottom:7}}>
                    <LinkPill href={item.url} label="Live page"/><LinkPill href={item.figma} label="Figma"/><LinkPill href={item.revision} label="Final revision"/>
                  </div>
                  {(item.checklistType||item.trafficSource||item.owner)&&(
                    <div style={{display:"flex",gap:5,flexWrap:"wrap",marginBottom:7}}>
                      {item.checklistType&&<span style={{fontSize:11,fontWeight:600,color:PINK,background:PINK_BG,border:`1px solid ${PINK_BD}`,padding:"2px 9px",borderRadius:20}}>📋 {item.checklistType}</span>}
                      {item.trafficSource&&<span style={{fontSize:11,fontWeight:600,color:PINK,background:PINK_BG,border:`1px solid ${PINK_BD}`,padding:"2px 9px",borderRadius:20}}>🚦 {item.trafficSource}</span>}
                      {item.owner&&<span style={{fontSize:11,fontWeight:600,color:PINK,background:PINK_BG,border:`1px solid ${PINK_BD}`,padding:"2px 9px",borderRadius:20}}>👤 {item.owner}</span>}
                    </div>
                  )}
                  <div style={{display:"flex",gap:5,flexWrap:"wrap",alignItems:"center",marginBottom:itemDes.length>0?5:0}}>
                    <span style={{fontSize:10,fontWeight:700,color:C.textSm,letterSpacing:"0.06em",textTransform:"uppercase"}}>Dev QA:</span>
                    {itemRevs.map(r=><span key={r} style={{fontSize:11,fontWeight:600,color:GREEN_DK,background:GREEN_BG,border:`1px solid ${GREEN_BD}`,padding:"2px 9px",borderRadius:20}}>{r}</span>)}
                  </div>
                  {itemDes.length>0&&(
                    <div style={{display:"flex",gap:5,flexWrap:"wrap",alignItems:"center"}}>
                      <span style={{fontSize:10,fontWeight:700,color:C.textSm,letterSpacing:"0.06em",textTransform:"uppercase"}}>Designer:</span>
                      {itemDes.map(d=><span key={d} style={{fontSize:11,fontWeight:600,color:"#7B3FE4",background:"#F0EEFF",border:"1px solid #C8B8FF",padding:"2px 9px",borderRadius:20}}>{d}</span>)}
                    </div>
                  )}
                  {item.dateAdded&&(
                    <div style={{fontSize:10,color:C.textSm,marginTop:6}}>Added {fmtDate(item.dateAdded)}{item.lastEditedAt&&item.lastEditedAt!==item.createdAt?` · Edited ${fmtDate(item.lastEditedAt)}`:""}</div>
                  )}
                </div>
                <div style={{display:"flex",gap:7,flexShrink:0}}>
                  {sessions[item.id]?(
                    <button onClick={()=>openQA(item,true)} style={{background:"#F0A500",color:"#fff",border:"none",cursor:"pointer",fontFamily:"inherit",fontSize:13,fontWeight:600,padding:"8px 16px",borderRadius:20,transition:"background .2s"}}
                      onMouseEnter={e=>(e.currentTarget as HTMLElement).style.background="#C88000"} onMouseLeave={e=>(e.currentTarget as HTMLElement).style.background="#F0A500"}>
                      ↩ Resume QA
                    </button>
                  ):(
                    <button onClick={()=>openQA(item)} style={{background:"#111",color:"#fff",border:"none",cursor:"pointer",fontFamily:"inherit",fontSize:13,fontWeight:600,padding:"8px 16px",borderRadius:20,transition:"background .2s"}}
                      onMouseEnter={e=>(e.currentTarget as HTMLElement).style.background=GREEN_DK} onMouseLeave={e=>(e.currentTarget as HTMLElement).style.background="#111"}>
                      Start QA →
                    </button>
                  )}
                  <button onClick={()=>removeFromQueue(item.id)} style={{background:C.bgOff,border:`1px solid ${C.border}`,color:C.textSm,width:34,height:34,borderRadius:"50%",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,fontWeight:600,transition:"all .15s",flexShrink:0}}
                    onMouseEnter={e=>{const el=e.currentTarget as HTMLElement;el.style.background="#FEF0ED";el.style.borderColor="#F5C4BA";el.style.color="#E8341C";}} onMouseLeave={e=>{const el=e.currentTarget as HTMLElement;el.style.background=C.bgOff;el.style.borderColor=C.border;el.style.color=C.textSm;}}>×</button>
                </div>
              </div>
            </div>
          );})}
        </div>
      )}

      {/* CHECKLIST */}
      {view==="qa"&&active&&(
        <div className="fade" style={{maxWidth:920,margin:"0 auto",padding:"22px 24px 100px"}}>
          <div className="card" style={{padding:"16px 18px",marginBottom:12}}>
            <div style={{display:"flex",alignItems:"flex-start",gap:10,marginBottom:8}}>
              <h2 style={{fontSize:18,fontWeight:800,flex:1,lineHeight:1.3}}>{active.name}</h2>
              <button onClick={()=>setShowEditModal(true)}
                style={{background:C.bgOff,border:`1px solid ${C.border}`,color:C.textMd,fontSize:12,fontWeight:600,padding:"6px 13px",borderRadius:20,cursor:"pointer",fontFamily:"inherit",display:"inline-flex",alignItems:"center",gap:5,flexShrink:0,transition:"all .15s"}}
                onMouseEnter={e=>{const el=e.currentTarget as HTMLElement;el.style.background=GREEN_BG;el.style.color=GREEN_DK;el.style.borderColor=GREEN_BD;}}
                onMouseLeave={e=>{const el=e.currentTarget as HTMLElement;el.style.background=C.bgOff;el.style.color=C.textMd;el.style.borderColor=C.border;}}>
                ✎ Edit
              </button>
            </div>
            <div style={{display:"flex",gap:7,flexWrap:"wrap",marginBottom:10}}>
              <LinkPill href={active.url} label="Live page"/><LinkPill href={active.figma} label="Figma"/><LinkPill href={active.revision} label="Final revision"/>
            </div>
            {(active.checklistType||active.trafficSource||active.owner)&&(
              <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:10}}>
                {active.checklistType&&<span style={{fontSize:11,fontWeight:600,color:PINK,background:PINK_BG,border:`1px solid ${PINK_BD}`,padding:"3px 10px",borderRadius:20}}>📋 {active.checklistType}</span>}
                {active.trafficSource&&<span style={{fontSize:11,fontWeight:600,color:PINK,background:PINK_BG,border:`1px solid ${PINK_BD}`,padding:"3px 10px",borderRadius:20}}>🚦 {active.trafficSource}</span>}
                {active.owner&&<span style={{fontSize:11,fontWeight:600,color:PINK,background:PINK_BG,border:`1px solid ${PINK_BD}`,padding:"3px 10px",borderRadius:20}}>👤 {active.owner}</span>}
              </div>
            )}
            <div style={{display:"flex",gap:5,flexWrap:"wrap",alignItems:"center",marginBottom:active?.designers?.length>0?6:12}}>
              <span style={{fontSize:10,fontWeight:700,color:C.textSm,letterSpacing:"0.06em",textTransform:"uppercase"}}>Dev QA:</span>
              {activeReviewers.map(r=><span key={r} style={{fontSize:11,fontWeight:600,color:GREEN_DK,background:GREEN_BG,border:`1px solid ${GREEN_BD}`,padding:"2px 9px",borderRadius:20}}>{r}</span>)}
            </div>
            {active?.designers?.length>0&&(
              <div style={{display:"flex",gap:5,flexWrap:"wrap",alignItems:"center",marginBottom:12}}>
                <span style={{fontSize:10,fontWeight:700,color:C.textSm,letterSpacing:"0.06em",textTransform:"uppercase"}}>Designer:</span>
                {active.designers.map((d:string)=><span key={d} style={{fontSize:11,fontWeight:600,color:"#7B3FE4",background:"#F0EEFF",border:"1px solid #C8B8FF",padding:"2px 9px",borderRadius:20}}>{d}</span>)}
              </div>
            )}
            {(active.dateAdded||active.lastEditedAt)&&(
              <div style={{display:"flex",gap:14,flexWrap:"wrap",fontSize:11,color:C.textSm,marginBottom:10}}>
                {active.dateAdded&&<span><strong style={{fontWeight:700,letterSpacing:"0.06em",textTransform:"uppercase",fontSize:10,marginRight:5}}>Date Added</strong>{fmtDate(active.dateAdded)}</span>}
                {active.lastEditedAt&&<span><strong style={{fontWeight:700,letterSpacing:"0.06em",textTransform:"uppercase",fontSize:10,marginRight:5}}>Last Edited</strong>{new Date(active.lastEditedAt).toLocaleString()}</span>}
              </div>
            )}
            <div style={{paddingTop:10,borderTop:`1px solid ${C.border}`}}>
              <div style={{fontSize:10,fontWeight:700,color:C.textSm,letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:7}}>Resources</div>
              <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                {RESOURCES.map(r=>(
                  <a key={r.label} href={r.url} target="_blank" rel="noreferrer" style={{fontSize:11,fontWeight:500,color:C.textMd,background:C.bgOff,border:`1px solid ${C.border}`,padding:"3px 10px",borderRadius:20,textDecoration:"none",transition:"all .15s"}}
                    onMouseEnter={e=>{const el=e.currentTarget as HTMLElement;el.style.background=GREEN_BG;el.style.color=GREEN_DK;el.style.borderColor=GREEN_BD;}} onMouseLeave={e=>{const el=e.currentTarget as HTMLElement;el.style.background=C.bgOff;el.style.color=C.textMd;el.style.borderColor=C.border;}}>
                    ↗ {r.label}
                  </a>
                ))}
              </div>
            </div>
          </div>

          <div style={{background:C.bg,borderRadius:"10px 10px 0 0",border:`1px solid ${C.border}`,borderBottom:"none",display:"flex",padding:"0 4px"}}>
            <button style={tb(qaTab==="checklist")} onClick={()=>setQaTab("checklist")}>Checklist</button>
            <button style={tb(qaTab==="bugs","#E8341C")} onClick={()=>setQaTab("bugs")}>
              Bugs
              <span style={{fontSize:11,fontWeight:700,minWidth:20,textAlign:"center",padding:"1px 7px",borderRadius:20,background:openBugs>0?"#E8341C":bugs.length>0?GREEN:C.bgOff,color:openBugs>0?"#fff":bugs.length>0?"#fff":C.textSm}}>{bugs.length}</span>
            </button>
          </div>

          <div style={{background:C.bg,border:`1px solid ${C.border}`,borderTop:"none",borderRadius:"0 0 12px 12px",padding:"14px 16px",boxShadow:"0 2px 8px rgba(0,0,0,.04)"}}>
            {qaTab==="checklist"&&(
              <div>
                <div style={{display:"flex",gap:10,marginBottom:12,flexWrap:"wrap",alignItems:"center",padding:"9px 12px",background:C.bgOff,borderRadius:8,border:`1px solid ${C.border}`}}>
                  <span style={{fontSize:11,fontWeight:600,color:C.textSm}}>Click to cycle →</span>
                  {[["","Unchecked"],["✓","Done"],["N/A","Skip"],["⚑","Flag"]].map(([l,lbl])=>{
                    const s=l==="⚑"?"flagged":l==="✓"?"checked":l==="N/A"?"na":"unchecked";const sty=ST[s];
                    return(<span key={lbl} style={{display:"flex",alignItems:"center",gap:5,fontSize:12,color:C.textMd,fontWeight:500}}>
                      <span style={{width:34,height:20,borderRadius:4,background:sty.bg,border:`1.5px solid ${sty.bd}`,display:"inline-flex",alignItems:"center",justifyContent:"center",fontSize:9,color:sty.color,fontWeight:700}}>{l}</span>{lbl}
                    </span>);
                  })}
                </div>

                <div style={{display:"flex",borderBottom:`1px solid ${C.border}`,marginBottom:12}}>
                  {activeReviewers.map(r=>{const p=rProg(r),d=rd[r]?.done;return(
                    <button key={r} style={rtb(activeR===r)} onClick={()=>setActiveR(r)}>
                      {r}
                      {d&&<span style={{fontSize:10,fontWeight:700,color:"#fff",background:GREEN,padding:"1px 7px",borderRadius:20}}>Done</span>}
                      {!d&&p.pct>0&&<span style={{fontSize:10,fontWeight:600,color:GREEN_DK,background:GREEN_BG,padding:"1px 7px",borderRadius:20}}>{p.pct}%</span>}
                    </button>
                  );})}
                </div>

                <div style={{marginBottom:7,border:`1px solid ${C.border}`,borderRadius:10,overflow:"hidden"}}>
                  <div style={{background:C.bgOff,padding:"9px 13px",borderBottom:`1px solid ${C.border}`,display:"flex",alignItems:"center"}}>
                    <span style={{fontSize:13,fontWeight:700,flex:1}}>BrowserStack Testing</span>
                    <a href="https://www.browserstack.com" target="_blank" rel="noreferrer" style={{fontSize:11,fontWeight:600,color:"#0066CC",background:"#EBF4FF",border:"1px solid #C0DAFF",padding:"3px 10px",borderRadius:20}}>↗ Open</a>
                  </div>
                  <div style={{padding:"4px 13px 8px"}}>
                    {PLATFORMS.map(pl=>{const s=pc[activeR][pl],sty=ST[s]||ST.unchecked;return(
                      <div key={pl} style={{display:"flex",alignItems:"center",gap:10,padding:"5px 0",borderBottom:`1px solid ${C.border}`}}>
                        <button onClick={()=>cyclePlat(activeR,pl)} style={{width:42,height:20,borderRadius:5,border:`1.5px solid ${sty.bd}`,background:sty.bg,color:sty.color,cursor:"pointer",fontFamily:"inherit",fontSize:9,fontWeight:700,flexShrink:0,transition:"all .12s"}}>{sty.label}</button>
                        <span style={{fontSize:12,fontWeight:500,color:s==="na"||s==="checked"?C.textSm:C.text,textDecoration:s==="na"||s==="checked"?"line-through":"none",opacity:s==="na"?.5:1}}>{pl}</span>
                      </div>
                    );})}
                  </div>
                </div>

                {CHECKLIST.map(sec=>{
                  const sc=gc(activeR)[sec.id];const act=sc.filter((c:any)=>c.state!=="na");const done=act.filter((c:any)=>c.state==="checked"||c.state==="flagged");
                  const flagged=sc.filter((c:any)=>c.state==="flagged");const pct=act.length?Math.round(done.length/act.length*100):0;const open=openSecs[sec.id];
                  return(
                    <div key={sec.id} style={{marginBottom:5,border:`1px solid ${C.border}`,borderRadius:10,overflow:"hidden"}}>
                      <button style={{width:"100%",background:C.bgOff,border:"none",cursor:"pointer",display:"flex",alignItems:"center",gap:10,padding:"10px 13px",textAlign:"left",fontFamily:"inherit",transition:"background .15s"}}
                        onClick={()=>setOpenSecs((p:any)=>({...p,[sec.id]:!p[sec.id]}))}
                        onMouseEnter={e=>(e.currentTarget as HTMLElement).style.background="#EEEEEA"} onMouseLeave={e=>(e.currentTarget as HTMLElement).style.background=C.bgOff}>
                        <div style={{width:4,height:22,borderRadius:2,background:sec.color,flexShrink:0}}/>
                        <span style={{fontSize:13,fontWeight:700,flex:1}}>{sec.label}</span>
                        {flagged.length>0&&<span style={{fontSize:11,fontWeight:600,color:"#E8341C",background:"#FEF0ED",border:"1px solid #F5C4BA",padding:"1px 8px",borderRadius:20}}>{flagged.length} flagged</span>}
                        <div style={{display:"flex",alignItems:"center",gap:6}}>
                          <div style={{width:36,height:4,background:C.border,borderRadius:2,overflow:"hidden"}}><div style={{width:pct+"%",height:"100%",background:pct===100?GREEN:"#111",borderRadius:2}}/></div>
                          <span style={{fontSize:11,fontWeight:600,color:done.length===act.length&&act.length>0?GREEN_DK:C.textMd,minWidth:24}}>{done.length}/{act.length}</span>
                        </div>
                        <span style={{fontSize:12,color:C.textSm}}>{open?"▾":"▸"}</span>
                      </button>
                      {open&&<div style={{borderTop:`1px solid ${C.border}`}}>
                        {sec.items.map((item:string,i:number)=>{
                          const c=sc[i],sty=ST[c.state]||ST.unchecked;
                          return(<div key={i} className="si" style={{animationDelay:i*0.018+"s"}}>
                            <div style={{display:"flex",alignItems:"center",gap:10,padding:"8px 13px",borderBottom:(c.state==="flagged"||c.note)?"none":`1px solid ${C.border}`,background:c.state==="flagged"?"#FEF8F7":C.bg,transition:"background .15s"}}>
                              <button onClick={()=>cycleCheck(activeR,sec.id,i)} style={{width:40,height:20,borderRadius:5,border:`1.5px solid ${sty.bd}`,background:sty.bg,color:sty.color,cursor:"pointer",fontFamily:"inherit",fontSize:9,fontWeight:700,flexShrink:0,transition:"all .12s"}}>{sty.label}</button>
                              <span style={{flex:1,fontSize:13,fontWeight:500,color:c.state==="checked"||c.state==="na"?C.textSm:C.text,textDecoration:c.state==="checked"||c.state==="na"?"line-through":"none",opacity:c.state==="na"?.5:1,lineHeight:1.4}}>{item}</span>
                              <button onClick={()=>toggleFlag(activeR,sec.id,i)} style={{fontSize:11,fontWeight:600,padding:"3px 10px",borderRadius:20,border:`1px solid ${c.state==="flagged"?"#E8341C":C.border}`,background:c.state==="flagged"?"#E8341C":"none",color:c.state==="flagged"?"#fff":C.textMd,cursor:"pointer",fontFamily:"inherit",transition:"all .15s",flexShrink:0}}>
                                {c.state==="flagged"?"⚑ Flagged":"Flag"}
                              </button>
                            </div>
                            {(c.state==="flagged"||c.note)&&<div style={{padding:"8px 13px 10px 61px",background:"#FEF8F7",borderBottom:`1px solid ${C.border}`}}>
                              <input value={c.note} onChange={e=>setINote(activeR,sec.id,i,e.target.value)} placeholder="Describe the issue..." style={{width:"100%",background:C.bg,border:"1px solid #F5C4BA",borderRadius:8,padding:"6px 10px",fontSize:12,color:C.text,fontFamily:"inherit",outline:"none",marginBottom:4}}/>
                              <MediaUploader compact media={c.media} onChange={m=>setIMedia(activeR,sec.id,i,m)} onOpen={setLightbox}/>
                              <MediaThumbs media={c.media} onOpen={setLightbox}/>
                            </div>}
                          </div>);
                        })}
                        {/* Section-level comment + drag-drop screenshots */}
                        <div style={{padding:"10px 13px",background:C.bgOff}}>
                          <div style={{fontSize:10,fontWeight:700,color:C.textSm,letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:6}}>Section comment — {sec.label}</div>
                          <textarea value={getSec(activeR,sec.id).note} onChange={e=>setSecNote(activeR,sec.id,e.target.value)} placeholder={`Notes about ${sec.label} for ${activeR}...`} rows={2} style={{width:"100%",background:C.bg,border:`1px solid ${C.border}`,borderRadius:8,padding:"7px 10px",fontSize:12,color:C.text,resize:"vertical",fontFamily:"inherit",outline:"none",marginBottom:7}}/>
                          <SectionDropZone media={getSec(activeR,sec.id).media} onChange={m=>setSecMedia(activeR,sec.id,m)} onOpen={setLightbox}/>
                        </div>
                      </div>}
                    </div>
                  );
                })}

                <div style={{marginTop:8,border:`1px solid ${C.border}`,borderRadius:10,padding:"12px 13px"}}>
                  <div style={{fontSize:11,fontWeight:700,color:C.textSm,letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:7}}>{activeR} — Notes & Screenshots</div>
                  <textarea value={rd[activeR].notes} onChange={e=>setRNotes(activeR,e.target.value)} placeholder={`Notes for ${activeR}...`} rows={2} style={{width:"100%",background:C.bgOff,border:`1px solid ${C.border}`,borderRadius:8,padding:"7px 10px",fontSize:13,color:C.text,resize:"vertical",fontFamily:"inherit",outline:"none",marginBottom:7}}/>
                  <MediaUploader media={rd[activeR].media} onChange={m=>setRMedia(activeR,m)} onOpen={setLightbox}/>
                </div>

                <div style={{marginTop:7,border:`1px solid ${C.border}`,borderRadius:10,padding:"11px 13px",display:"flex",alignItems:"center",gap:12}}>
                  <div style={{flex:1}}>
                    <div style={{fontSize:13,fontWeight:600}}>Mark your QA pass as complete</div>
                    <div style={{fontSize:11,color:C.textSm,marginTop:2}}>All three reviewers must mark done before final submit unlocks</div>
                  </div>
                  <button onClick={()=>toggleDone(activeR)} style={{background:rd[activeR].done?GREEN:C.bg,color:rd[activeR].done?"#fff":C.text,border:`1.5px solid ${rd[activeR].done?GREEN:C.borderMd}`,cursor:"pointer",fontFamily:"inherit",fontSize:13,fontWeight:700,padding:"8px 18px",borderRadius:20,transition:"all .2s",flexShrink:0}}>
                    {rd[activeR].done?"✓ Done — undo":"Mark my QA done"}
                  </button>
                </div>
              </div>
            )}
            {qaTab==="bugs"&&(
              <div>
                <div style={{fontSize:12,color:C.textMd,marginBottom:12,padding:"9px 12px",background:C.bgOff,borderRadius:8,border:`1px solid ${C.border}`}}>Flagged items appear here automatically. Send to devs, mark fixed. All bugs saved permanently.</div>
                <BugTracker bugs={bugs} onUpdate={updBug} onOpen={setLightbox}/>
              </div>
            )}
          </div>

          <div className="card" style={{marginTop:10,padding:"13px 15px"}}>
            <div style={{fontSize:11,fontWeight:700,color:C.textSm,letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:7}}>Overall Notes & Screenshots</div>
            <textarea value={gNotes} onChange={e=>setGNotes(e.target.value)} placeholder="Any overall observations..." rows={2} style={{width:"100%",background:C.bgOff,border:`1px solid ${C.border}`,borderRadius:8,padding:"7px 10px",fontSize:13,color:C.text,resize:"vertical",fontFamily:"inherit",outline:"none",marginBottom:7}}/>
            <MediaUploader media={gMedia} onChange={setGMedia} onOpen={setLightbox}/>
          </div>

          <div className="card" style={{marginTop:8,padding:"13px 15px"}}>
            <div style={{display:"flex",gap:7,flexWrap:"wrap",alignItems:"center",marginBottom:12}}>
              {activeReviewers.map(r=><span key={r} style={{fontSize:12,fontWeight:600,color:rd[r]?.done?GREEN_DK:C.textMd,background:rd[r]?.done?GREEN_BG:C.bgOff,border:`1px solid ${rd[r]?.done?GREEN_BD:C.border}`,padding:"4px 12px",borderRadius:20}}>{rd[r]?.done?"✓ ":""}{r}{rd[r]?.done?" done":" pending"}</span>)}
              {openBugs>0&&<span style={{fontSize:12,fontWeight:600,color:"#E8341C",background:"#FEF0ED",border:"1px solid #F5C4BA",padding:"4px 12px",borderRadius:20}}>{openBugs} bug{openBugs>1?"s":""} open</span>}
            </div>
            <div style={{display:"flex",alignItems:"center",gap:12}}>
              <button onClick={submit} disabled={!canSubmit||submitting} style={{background:canSubmit?"#111":C.bgOff,color:canSubmit?"#fff":C.textSm,border:"none",cursor:canSubmit?"pointer":"not-allowed",fontFamily:"inherit",fontSize:14,fontWeight:700,padding:"11px 28px",borderRadius:20,transition:"background .2s"}}
                onMouseEnter={e=>canSubmit&&((e.currentTarget as HTMLElement).style.background=GREEN)} onMouseLeave={e=>canSubmit&&((e.currentTarget as HTMLElement).style.background="#111")}>
                {submitting?"Saving...":canSubmit?"Submit Final QA ✓":"Waiting for all reviewers"}
              </button>
              {canSubmit&&<span style={{fontSize:12,fontWeight:600,color:GREEN_DK}}>Ready to submit!</span>}
            </div>
          </div>
        </div>
      )}

      {/* LOG */}
      {view==="log"&&(()=>{
        // Build dynamic owner tab list: union of pool owners and owners actually seen in the log
        const seenOwners = Array.from(new Set(log.map((e:any)=>e.owner).filter(Boolean))) as string[];
        const allOwners = Array.from(new Set([...pools.owners,...seenOwners]));
        const hasUnassigned = log.some((e:any)=>!e.owner);
        const q = logSearch.trim().toLowerCase();
        const filtered = log.filter((e:any)=>{
          // owner filter
          if(logOwnerFilter==="unassigned"){if(e.owner)return false;}
          else if(logOwnerFilter!=="all"){if(e.owner!==logOwnerFilter)return false;}
          if(!q)return true;
          const hay=[e.itemName,e.url,e.figma,e.revision,e.owner,e.trafficSource,e.checklistType,...(e.reviewers||[]),...(e.designers||[])].filter(Boolean).join(" ").toLowerCase();
          return hay.includes(q);
        });
        const countFor=(o:string)=> o==="all"?log.length : o==="unassigned"?log.filter((e:any)=>!e.owner).length : log.filter((e:any)=>e.owner===o).length;
        return(
        <div className="fade" style={{maxWidth:840,margin:"0 auto",padding:"32px 24px"}}>
          <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",gap:16,flexWrap:"wrap",marginBottom:18}}>
            <div>
              <h1 style={{fontSize:24,fontWeight:800,marginBottom:5}}>Completed Log</h1>
              <div style={{fontSize:13,color:C.textMd}}>All completed QA sessions — permanent record</div>
            </div>
          </div>
          {/* Owner tabs */}
          <div style={{display:"flex",gap:4,flexWrap:"wrap",marginBottom:12,padding:"4px",background:C.bg,border:`1px solid ${C.border}`,borderRadius:10}}>
            {[{key:"all",label:"All"},...allOwners.map(o=>({key:o,label:o})),...(hasUnassigned?[{key:"unassigned",label:"Unassigned"}]:[])].map(t=>{
              const sel=logOwnerFilter===t.key;const cnt=countFor(t.key);
              return(
                <button key={t.key} onClick={()=>setLogOwnerFilter(t.key)}
                  style={{background:sel?"#111":"transparent",color:sel?"#fff":C.textMd,border:"none",cursor:"pointer",fontFamily:"inherit",fontSize:12,fontWeight:sel?700:500,padding:"7px 13px",borderRadius:8,display:"inline-flex",alignItems:"center",gap:6,transition:"all .15s"}}
                  onMouseEnter={e=>{if(!sel)(e.currentTarget as HTMLElement).style.background=C.bgOff;}}
                  onMouseLeave={e=>{if(!sel)(e.currentTarget as HTMLElement).style.background="transparent";}}>
                  {t.label}
                  <span style={{fontSize:10,fontWeight:700,padding:"1px 7px",borderRadius:20,background:sel?"rgba(255,255,255,.22)":C.bgOff,color:sel?"#fff":C.textSm}}>{cnt}</span>
                </button>
              );
            })}
          </div>
          {/* Search */}
          <div style={{position:"relative",marginBottom:18}}>
            <input value={logSearch} onChange={e=>setLogSearch(e.target.value)} placeholder="Search by page name, URL, owner, traffic source, reviewer..."
              style={{width:"100%",background:C.bg,border:`1px solid ${C.border}`,borderRadius:10,padding:"10px 36px 10px 36px",fontSize:13,color:C.text,outline:"none",fontFamily:"inherit"}}
              onFocus={e=>(e.target as HTMLInputElement).style.borderColor=GREEN} onBlur={e=>(e.target as HTMLInputElement).style.borderColor=C.border}/>
            <span style={{position:"absolute",left:12,top:"50%",transform:"translateY(-50%)",fontSize:13,color:C.textSm}}>🔍</span>
            {logSearch&&<button onClick={()=>setLogSearch("")} style={{position:"absolute",right:8,top:"50%",transform:"translateY(-50%)",background:C.bgOff,border:`1px solid ${C.border}`,color:C.textSm,width:22,height:22,borderRadius:"50%",cursor:"pointer",fontSize:11,fontWeight:700,fontFamily:"inherit",display:"flex",alignItems:"center",justifyContent:"center"}}>×</button>}
          </div>
          {logLoad?<div style={{color:C.textMd,fontSize:13}}>Loading...</div>
          :log.length===0?<div className="card" style={{padding:"32px",textAlign:"center"}}><div style={{fontSize:13,color:C.textMd}}>No completed QA sessions yet.</div></div>
          :filtered.length===0?<div className="card" style={{padding:"32px",textAlign:"center"}}><div style={{fontSize:13,color:C.textMd}}>No matches{logOwnerFilter!=="all"?` in ${logOwnerFilter==="unassigned"?"Unassigned":logOwnerFilter}`:""}{q?` for "${q}"`:""}.</div></div>
          :filtered.map((entry:any)=>{
            const total=(entry.bugs||[]).length,fixed=(entry.bugs||[]).filter((b:any)=>b.status==="fixed").length;
            return(
              <details key={entry.id} id={entry.id} className="card" style={{marginBottom:7,overflow:"hidden"}}>
                <summary style={{display:"flex",alignItems:"center",gap:10,padding:"13px 16px",cursor:"pointer",transition:"background .15s"}}
                  onMouseEnter={e=>(e.currentTarget as HTMLElement).style.background=C.bgOff} onMouseLeave={e=>(e.currentTarget as HTMLElement).style.background=C.bg}>
                  <div style={{width:10,height:10,borderRadius:"50%",background:entry.passed?GREEN:"#E8341C",border:`2px solid ${entry.passed?GREEN_DK:"#C02010"}`,flexShrink:0}}/>
                  <span style={{flex:1,fontSize:14,fontWeight:700}}>{entry.itemName}</span>
                  {entry.owner&&<span style={{fontSize:10,fontWeight:600,color:PINK,background:PINK_BG,border:`1px solid ${PINK_BD}`,padding:"2px 8px",borderRadius:20}}>{entry.owner}</span>}
                  <span style={{fontSize:12,color:C.textSm,marginRight:6}}>{new Date(entry.completedAt).toLocaleDateString()}</span>
                  {total>0&&<span style={{fontSize:11,fontWeight:600,color:fixed===total?GREEN_DK:"#E8341C",background:fixed===total?GREEN_BG:"#FEF0ED",border:`1px solid ${fixed===total?GREEN_BD:"#F5C4BA"}`,padding:"2px 9px",borderRadius:20}}>{fixed}/{total} fixed</span>}
                  {entry.passed&&<span style={{fontSize:11,fontWeight:600,color:GREEN_DK,background:GREEN_BG,border:`1px solid ${GREEN_BD}`,padding:"2px 9px",borderRadius:20}}>✓ Passed</span>}
                </summary>
                <div style={{borderTop:`1px solid ${C.border}`,padding:"13px 16px"}}>
                  <div style={{display:"flex",gap:7,marginBottom:10,flexWrap:"wrap"}}>
                    <LinkPill href={entry.url} label="Live page"/><LinkPill href={entry.figma} label="Figma"/><LinkPill href={entry.revision} label="Final revision"/>
                    <span style={{fontSize:12,color:C.textSm,alignSelf:"center"}}>{new Date(entry.completedAt).toLocaleString()}</span>
                  </div>
                  {(entry.checklistType||entry.trafficSource||entry.owner)&&(
                    <div style={{display:"flex",gap:5,flexWrap:"wrap",marginBottom:8}}>
                      {entry.checklistType&&<span style={{fontSize:11,fontWeight:600,color:PINK,background:PINK_BG,border:`1px solid ${PINK_BD}`,padding:"2px 9px",borderRadius:20}}>📋 {entry.checklistType}</span>}
                      {entry.trafficSource&&<span style={{fontSize:11,fontWeight:600,color:PINK,background:PINK_BG,border:`1px solid ${PINK_BD}`,padding:"2px 9px",borderRadius:20}}>🚦 {entry.trafficSource}</span>}
                      {entry.owner&&<span style={{fontSize:11,fontWeight:600,color:PINK,background:PINK_BG,border:`1px solid ${PINK_BD}`,padding:"2px 9px",borderRadius:20}}>👤 {entry.owner}</span>}
                    </div>
                  )}
                  {(entry.dateAdded||entry.lastEditedAt)&&(
                    <div style={{display:"flex",gap:14,flexWrap:"wrap",fontSize:11,color:C.textSm,marginBottom:10}}>
                      {entry.dateAdded&&<span><strong style={{fontWeight:700,letterSpacing:"0.06em",textTransform:"uppercase",fontSize:10,marginRight:5}}>Date Added</strong>{fmtDate(entry.dateAdded)}</span>}
                      {entry.lastEditedAt&&<span><strong style={{fontWeight:700,letterSpacing:"0.06em",textTransform:"uppercase",fontSize:10,marginRight:5}}>Last Edited</strong>{new Date(entry.lastEditedAt).toLocaleString()}</span>}
                    </div>
                  )}
                  {((entry.reviewers&&entry.reviewers.length>0)||(entry.designers&&entry.designers.length>0))&&(
                    <div style={{display:"flex",flexDirection:"column",gap:4,marginBottom:14}}>
                      {entry.reviewers&&entry.reviewers.length>0&&(
                        <div style={{display:"flex",gap:5,flexWrap:"wrap",alignItems:"center"}}>
                          <span style={{fontSize:10,fontWeight:700,color:C.textSm,letterSpacing:"0.06em",textTransform:"uppercase"}}>Dev QA:</span>
                          {entry.reviewers.map((r:string)=><span key={r} style={{fontSize:11,fontWeight:600,color:GREEN_DK,background:GREEN_BG,border:`1px solid ${GREEN_BD}`,padding:"2px 9px",borderRadius:20}}>{r}</span>)}
                        </div>
                      )}
                      {entry.designers&&entry.designers.length>0&&(
                        <div style={{display:"flex",gap:5,flexWrap:"wrap",alignItems:"center"}}>
                          <span style={{fontSize:10,fontWeight:700,color:C.textSm,letterSpacing:"0.06em",textTransform:"uppercase"}}>Designer:</span>
                          {entry.designers.map((d:string)=><span key={d} style={{fontSize:11,fontWeight:600,color:"#7B3FE4",background:"#F0EEFF",border:"1px solid #C8B8FF",padding:"2px 9px",borderRadius:20}}>{d}</span>)}
                        </div>
                      )}
                    </div>
                  )}
                  {/* Full checklist per reviewer */}
                  {(entry.reviewerSummaries||[]).map((rs:any)=>{
                    if(!rs.checks)return null;
                    return(
                      <div key={rs.reviewer} style={{marginBottom:12,border:`1px solid ${C.border}`,borderRadius:10,overflow:"hidden"}}>
                        <div style={{background:C.bgOff,padding:"8px 13px",borderBottom:`1px solid ${C.border}`,display:"flex",alignItems:"center",gap:8}}>
                          <span style={{fontSize:12,fontWeight:700,color:GREEN_DK}}>{rs.reviewer}</span>
                          {rs.done&&<span style={{fontSize:10,fontWeight:700,color:"#fff",background:GREEN,padding:"1px 7px",borderRadius:20}}>Done</span>}
                        </div>
                        {CHECKLIST.map(sec=>{
                          const sc=rs.checks[sec.id];if(!sc)return null;
                          const act=sc.filter((c:any)=>c.state!=="na");const done=act.filter((c:any)=>c.state==="checked"||c.state==="flagged");
                          const sn=rs.sectionNotes?.[sec.id];
                          return(
                            <div key={sec.id} style={{borderBottom:`1px solid ${C.border}`,padding:"7px 13px"}}>
                              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:5}}>
                                <div style={{width:3,height:16,borderRadius:2,background:sec.color,flexShrink:0}}/>
                                <span style={{fontSize:12,fontWeight:600,flex:1}}>{sec.label}</span>
                                <span style={{fontSize:11,color:C.textSm}}>{done.length}/{act.length}</span>
                              </div>
                              <div style={{display:"flex",flexDirection:"column",gap:2}}>
                                {sc.map((c:any,i:number)=>(
                                  <div key={i} style={{display:"flex",alignItems:"flex-start",gap:8,fontSize:12}}>
                                    <span style={{flexShrink:0,width:32,fontSize:10,fontWeight:700,color:c.state==="checked"?GREEN_DK:c.state==="flagged"?"#E8341C":C.textSm,background:c.state==="checked"?GREEN_BG:c.state==="flagged"?"#FEF0ED":"transparent",padding:"1px 4px",borderRadius:3,textAlign:"center"}}>
                                      {c.state==="checked"?"✓":c.state==="flagged"?"⚑":c.state==="na"?"N/A":"—"}
                                    </span>
                                    <span style={{flex:1,color:c.state==="checked"||c.state==="na"?C.textSm:C.text,textDecoration:c.state==="checked"||c.state==="na"?"line-through":"none",opacity:c.state==="na"?.5:1,lineHeight:1.4}}>{sec.items[i]}</span>
                                  </div>
                                ))}
                              </div>
                              {(sn&&(sn.note||(sn.media&&sn.media.length>0)))&&(
                                <div style={{marginTop:6,padding:"6px 9px",background:C.bgOff,border:`1px solid ${C.border}`,borderRadius:6}}>
                                  <div style={{fontSize:10,fontWeight:700,color:C.textSm,letterSpacing:"0.06em",textTransform:"uppercase",marginBottom:3}}>Section comment</div>
                                  {sn.note&&<div style={{fontSize:12,color:C.textMd,fontStyle:"italic"}}>{sn.note}</div>}
                                  <MediaThumbs media={sn.media} onOpen={setLightbox}/>
                                </div>
                              )}
                            </div>
                          );
                        })}
                        {rs.platforms&&<div style={{padding:"7px 13px"}}>
                          <div style={{fontSize:10,fontWeight:700,color:C.textSm,letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:5}}>BrowserStack</div>
                          <div style={{display:"flex",flexWrap:"wrap",gap:4}}>
                            {PLATFORMS.map(pl=>{const s=rs.platforms[pl];if(!s||s==="unchecked")return null;return<span key={pl} style={{fontSize:10,fontWeight:600,color:s==="checked"?GREEN_DK:C.textSm,background:s==="checked"?GREEN_BG:C.bgOff,border:`1px solid ${s==="checked"?GREEN_BD:C.border}`,padding:"2px 7px",borderRadius:20}}>{s==="checked"?"✓":"N/A"} {pl}</span>;})}
                          </div>
                        </div>}
                      </div>
                    );
                  })}
                  {/* Bugs */}
                  {(entry.bugs||[]).length>0&&(
                    <div style={{marginBottom:12}}>
                      <div style={{fontSize:11,fontWeight:700,color:"#E8341C",letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:8}}>Bugs</div>
                      {entry.bugs.map((b:any,bi:number)=>(
                        <div key={bi} style={{marginBottom:5,padding:"8px 12px",background:b.status==="fixed"?GREEN_BG:"#FEF8F7",border:`1px solid ${b.status==="fixed"?GREEN_BD:"#F5C4BA"}`,borderRadius:8}}>
                          <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:4}}>
                            <span style={{fontSize:11,fontWeight:600,color:"#0066CC",background:"#EBF4FF",padding:"1px 7px",borderRadius:20}}>{b.reviewer}</span>
                            <span style={{fontSize:11,color:C.textMd,background:C.bgOff,padding:"1px 7px",borderRadius:20}}>{b.section}</span>
                            <span style={{fontSize:11,fontWeight:600,color:b.status==="fixed"?GREEN_DK:"#E8341C"}}>{b.status==="fixed"?"✓ Fixed":"● Open"}</span>
                          </div>
                          <div style={{fontSize:13,fontWeight:500,color:b.status==="fixed"?C.textMd:C.text,textDecoration:b.status==="fixed"?"line-through":"none"}}>{b.item}</div>
                          {b.note&&<div style={{fontSize:12,color:C.textMd,fontStyle:"italic",marginTop:2}}>{b.note}</div>}
                          {b.fixNote&&<div style={{fontSize:12,color:GREEN_DK,fontWeight:500,marginTop:3}}>Fix: {b.fixNote}</div>}
                          <MediaThumbs media={b.media} onOpen={setLightbox}/>
                        </div>
                      ))}
                    </div>
                  )}
                  {/* Reviewer notes */}
                  {(entry.reviewerSummaries||[]).some((r:any)=>r.notes||(r.media&&r.media.length>0))&&(
                    <div style={{marginBottom:10}}>
                      <div style={{fontSize:11,fontWeight:700,color:C.textSm,letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:7}}>Reviewer Notes</div>
                      {(entry.reviewerSummaries||[]).filter((r:any)=>r.notes||(r.media&&r.media.length>0)).map((rs:any)=>(
                        <div key={rs.reviewer} style={{marginBottom:7,padding:"8px 12px",background:C.bgOff,borderRadius:8,border:`1px solid ${C.border}`}}>
                          <div style={{fontSize:11,fontWeight:700,color:GREEN_DK,marginBottom:4}}>{rs.reviewer}</div>
                          {rs.notes&&<div style={{fontSize:12,color:C.textMd,fontStyle:"italic"}}>{rs.notes}</div>}
                          <MediaThumbs media={rs.media} onOpen={setLightbox}/>
                        </div>
                      ))}
                    </div>
                  )}
                  {(entry.globalNotes||(entry.globalMedia&&entry.globalMedia.length>0))&&(
                    <div style={{background:C.bgOff,borderRadius:8,padding:"10px 12px",border:`1px solid ${C.border}`}}>
                      <div style={{fontSize:11,fontWeight:700,color:C.textSm,letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:6}}>Overall Notes</div>
                      {entry.globalNotes&&<div style={{fontSize:12,color:C.textMd,fontStyle:"italic",marginBottom:5}}>{entry.globalNotes}</div>}
                      <MediaThumbs media={entry.globalMedia} onOpen={setLightbox}/>
                    </div>
                  )}
                </div>
              </details>
            );
          })}
        </div>
        );
      })()}

      {showModal&&<NewQAModal mode="create" pools={pools} setPools={setPools} onStart={handleStart} onClose={()=>setShowModal(false)}/>}
      {showEditModal&&active&&<NewQAModal mode="edit" initial={active} pools={pools} setPools={setPools} onStart={handleEditSave} onClose={()=>setShowEditModal(false)}/>}
      {lightbox&&<Lightbox item={lightbox} onClose={()=>setLightbox(null)}/>}
      {toast&&<div style={{position:"fixed",bottom:24,left:"50%",transform:"translateX(-50%)",background:toast.ok?"#111":"#E8341C",color:"#fff",padding:"11px 22px",borderRadius:20,fontSize:13,fontWeight:600,zIndex:999,whiteSpace:"nowrap",boxShadow:"0 4px 20px rgba(0,0,0,.25)",animation:"fadeUp .2s ease"}}>{toast.msg}</div>}
    </div>
  );
}
