import{t as D,z as F,r as p,j as u,g as I,d as P}from"./index-B6T-XhSG.js";function z(e){const t=D(e);if(t.length>31)throw new Error("bytes32 string must be less than 32 bytes");return F(t,32)}let T={data:""},O=e=>{if(typeof window=="object"){let t=(e?e.querySelector("#_goober"):window._goober)||Object.assign(document.createElement("style"),{innerHTML:" ",id:"_goober"});return t.nonce=window.__nonce__,t.parentNode||(e||document.head).appendChild(t),t.firstChild}return e||T},B=/(?:([\u0080-\uFFFF\w-%@]+) *:? *([^{;]+?);|([^;}{]*?) *{)|(}\s*)/g,M=/\/\*[^]*?\*\/|  +/g,S=/\n+/g,x=(e,t)=>{let a="",s="",i="";for(let r in e){let o=e[r];r[0]=="@"?r[1]=="i"?a=r+" "+o+";":s+=r[1]=="f"?x(o,r):r+"{"+x(o,r[1]=="k"?"":t)+"}":typeof o=="object"?s+=x(o,t?t.replace(/([^,])+/g,n=>r.replace(/([^,]*:\S+\([^)]*\))|([^,])+/g,c=>/&/.test(c)?c.replace(/&/g,n):n?n+" "+c:c)):r):o!=null&&(r=/^--/.test(r)?r:r.replace(/[A-Z]/g,"-$&").toLowerCase(),i+=x.p?x.p(r,o):r+":"+o+";")}return a+(t&&i?t+"{"+i+"}":i)+s},f={},R=e=>{if(typeof e=="object"){let t="";for(let a in e)t+=a+R(e[a]);return t}return e},K=(e,t,a,s,i)=>{let r=R(e),o=f[r]||(f[r]=(c=>{let d=0,l=11;for(;d<c.length;)l=101*l+c.charCodeAt(d++)>>>0;return"go"+l})(r));if(!f[o]){let c=r!==e?e:(d=>{let l,y,h=[{}];for(;l=B.exec(d.replace(M,""));)l[4]?h.shift():l[3]?(y=l[3].replace(S," ").trim(),h.unshift(h[0][y]=h[0][y]||{})):h[0][l[1]]=l[2].replace(S," ").trim();return h[0]})(e);f[o]=x(i?{["@keyframes "+o]:c}:c,a?"":"."+o)}let n=a&&f.g?f.g:null;return a&&(f.g=f[o]),((c,d,l,y)=>{y?d.data=d.data.replace(y,c):d.data.indexOf(c)===-1&&(d.data=l?c+d.data:d.data+c)})(f[o],t,s,n),o},L=(e,t,a)=>e.reduce((s,i,r)=>{let o=t[r];if(o&&o.call){let n=o(a),c=n&&n.props&&n.props.className||/^go/.test(n)&&n;o=c?"."+c:n&&typeof n=="object"?n.props?"":x(n,""):n===!1?"":n}return s+i+(o??"")},"");function j(e){let t=this||{},a=e.call?e(t.p):e;return K(a.unshift?a.raw?L(a,[].slice.call(arguments,1),t.p):a.reduce((s,i)=>Object.assign(s,i&&i.call?i(t.p):i),{}):a,O(t.target),t.g,t.o,t.k)}let _,E,N;j.bind({g:1});let g=j.bind({k:1});function H(e,t,a,s){x.p=t,_=e,E=a,N=s}function b(e,t){let a=this||{};return function(){let s=arguments;function i(r,o){let n=Object.assign({},r),c=n.className||i.className;a.p=Object.assign({theme:E&&E()},n),a.o=/ *go\d+/.test(c),n.className=j.apply(a,s)+(c?" "+c:"");let d=e;return e[0]&&(d=n.as||e,delete n.as),N&&d[0]&&N(n),_(d,n)}return i}}var U=e=>typeof e=="function",A=(e,t)=>U(e)?e(t):e,W=(()=>{let e=0;return()=>(++e).toString()})(),q=(()=>{let e;return()=>{if(e===void 0&&typeof window<"u"){let t=matchMedia("(prefers-reduced-motion: reduce)");e=!t||t.matches}return e}})(),J=20,w=new Map,Q=1e3,G=e=>{if(w.has(e))return;let t=setTimeout(()=>{w.delete(e),k({type:4,toastId:e})},Q);w.set(e,t)},V=e=>{let t=w.get(e);t&&clearTimeout(t)},C=(e,t)=>{switch(t.type){case 0:return{...e,toasts:[t.toast,...e.toasts].slice(0,J)};case 1:return t.toast.id&&V(t.toast.id),{...e,toasts:e.toasts.map(r=>r.id===t.toast.id?{...r,...t.toast}:r)};case 2:let{toast:a}=t;return e.toasts.find(r=>r.id===a.id)?C(e,{type:1,toast:a}):C(e,{type:0,toast:a});case 3:let{toastId:s}=t;return s?G(s):e.toasts.forEach(r=>{G(r.id)}),{...e,toasts:e.toasts.map(r=>r.id===s||s===void 0?{...r,visible:!1}:r)};case 4:return t.toastId===void 0?{...e,toasts:[]}:{...e,toasts:e.toasts.filter(r=>r.id!==t.toastId)};case 5:return{...e,pausedAt:t.time};case 6:let i=t.time-(e.pausedAt||0);return{...e,pausedAt:void 0,toasts:e.toasts.map(r=>({...r,pauseDuration:r.pauseDuration+i}))}}},X=[],$={toasts:[],pausedAt:void 0},k=e=>{$=C($,e),X.forEach(t=>{t($)})},Z=(e,t="blank",a)=>({createdAt:Date.now(),visible:!0,type:t,ariaProps:{role:"status","aria-live":"polite"},message:e,pauseDuration:0,...a,id:(a==null?void 0:a.id)||W()}),v=e=>(t,a)=>{let s=Z(t,e,a);return k({type:2,toast:s}),s.id},m=(e,t)=>v("blank")(e,t);m.error=v("error");m.success=v("success");m.loading=v("loading");m.custom=v("custom");m.dismiss=e=>{k({type:3,toastId:e})};m.remove=e=>k({type:4,toastId:e});m.promise=(e,t,a)=>{let s=m.loading(t.loading,{...a,...a==null?void 0:a.loading});return e.then(i=>(m.success(A(t.success,i),{id:s,...a,...a==null?void 0:a.success}),i)).catch(i=>{m.error(A(t.error,i),{id:s,...a,...a==null?void 0:a.error})}),e};var Y=g`
from {
  transform: scale(0) rotate(45deg);
	opacity: 0;
}
to {
 transform: scale(1) rotate(45deg);
  opacity: 1;
}`,ee=g`
from {
  transform: scale(0);
  opacity: 0;
}
to {
  transform: scale(1);
  opacity: 1;
}`,te=g`
from {
  transform: scale(0) rotate(90deg);
	opacity: 0;
}
to {
  transform: scale(1) rotate(90deg);
	opacity: 1;
}`,ae=b("div")`
  width: 20px;
  opacity: 0;
  height: 20px;
  border-radius: 10px;
  background: ${e=>e.primary||"#ff4b4b"};
  position: relative;
  transform: rotate(45deg);

  animation: ${Y} 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)
    forwards;
  animation-delay: 100ms;

  &:after,
  &:before {
    content: '';
    animation: ${ee} 0.15s ease-out forwards;
    animation-delay: 150ms;
    position: absolute;
    border-radius: 3px;
    opacity: 0;
    background: ${e=>e.secondary||"#fff"};
    bottom: 9px;
    left: 4px;
    height: 2px;
    width: 12px;
  }

  &:before {
    animation: ${te} 0.15s ease-out forwards;
    animation-delay: 180ms;
    transform: rotate(90deg);
  }
`,re=g`
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
`,se=b("div")`
  width: 12px;
  height: 12px;
  box-sizing: border-box;
  border: 2px solid;
  border-radius: 100%;
  border-color: ${e=>e.secondary||"#e0e0e0"};
  border-right-color: ${e=>e.primary||"#616161"};
  animation: ${re} 1s linear infinite;
`,oe=g`
from {
  transform: scale(0) rotate(45deg);
	opacity: 0;
}
to {
  transform: scale(1) rotate(45deg);
	opacity: 1;
}`,ie=g`
0% {
	height: 0;
	width: 0;
	opacity: 0;
}
40% {
  height: 0;
	width: 6px;
	opacity: 1;
}
100% {
  opacity: 1;
  height: 10px;
}`,ne=b("div")`
  width: 20px;
  opacity: 0;
  height: 20px;
  border-radius: 10px;
  background: ${e=>e.primary||"#61d345"};
  position: relative;
  transform: rotate(45deg);

  animation: ${oe} 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)
    forwards;
  animation-delay: 100ms;
  &:after {
    content: '';
    box-sizing: border-box;
    animation: ${ie} 0.2s ease-out forwards;
    opacity: 0;
    animation-delay: 200ms;
    position: absolute;
    border-right: 2px solid;
    border-bottom: 2px solid;
    border-color: ${e=>e.secondary||"#fff"};
    bottom: 6px;
    left: 6px;
    height: 10px;
    width: 6px;
  }
`,ce=b("div")`
  position: absolute;
`,le=b("div")`
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  min-width: 20px;
  min-height: 20px;
`,de=g`
from {
  transform: scale(0.6);
  opacity: 0.4;
}
to {
  transform: scale(1);
  opacity: 1;
}`,pe=b("div")`
  position: relative;
  transform: scale(0.6);
  opacity: 0.4;
  min-width: 20px;
  animation: ${de} 0.3s 0.12s cubic-bezier(0.175, 0.885, 0.32, 1.275)
    forwards;
`,ue=({toast:e})=>{let{icon:t,type:a,iconTheme:s}=e;return t!==void 0?typeof t=="string"?p.createElement(pe,null,t):t:a==="blank"?null:p.createElement(le,null,p.createElement(se,{...s}),a!=="loading"&&p.createElement(ce,null,a==="error"?p.createElement(ae,{...s}):p.createElement(ne,{...s})))},me=e=>`
0% {transform: translate3d(0,${e*-200}%,0) scale(.6); opacity:.5;}
100% {transform: translate3d(0,0,0) scale(1); opacity:1;}
`,fe=e=>`
0% {transform: translate3d(0,0,-1px) scale(1); opacity:1;}
100% {transform: translate3d(0,${e*-150}%,-1px) scale(.6); opacity:0;}
`,ge="0%{opacity:0;} 100%{opacity:1;}",ye="0%{opacity:1;} 100%{opacity:0;}",xe=b("div")`
  display: flex;
  align-items: center;
  background: #fff;
  color: #363636;
  line-height: 1.3;
  will-change: transform;
  box-shadow: 0 3px 10px rgba(0, 0, 0, 0.1), 0 3px 3px rgba(0, 0, 0, 0.05);
  max-width: 350px;
  pointer-events: auto;
  padding: 8px 10px;
  border-radius: 8px;
`,be=b("div")`
  display: flex;
  justify-content: center;
  margin: 4px 10px;
  color: inherit;
  flex: 1 1 auto;
  white-space: pre-line;
`,he=(e,t)=>{let a=e.includes("top")?1:-1,[s,i]=q()?[ge,ye]:[me(a),fe(a)];return{animation:t?`${g(s)} 0.35s cubic-bezier(.21,1.02,.73,1) forwards`:`${g(i)} 0.4s forwards cubic-bezier(.06,.71,.55,1)`}};p.memo(({toast:e,position:t,style:a,children:s})=>{let i=e.height?he(e.position||t||"top-center",e.visible):{opacity:0},r=p.createElement(ue,{toast:e}),o=p.createElement(be,{...e.ariaProps},A(e.message,e));return p.createElement(xe,{className:e.className,style:{...i,...a,...e.style}},typeof s=="function"?s({icon:r,message:o}):p.createElement(p.Fragment,null,r,o))});H(p.createElement);j`
  z-index: 9999;
  > * {
    pointer-events: auto;
  }
`;const we=()=>{const[e,t]=p.useState(""),[a,s]=p.useState(""),[i,r]=p.useState(""),[o,n]=p.useState(!1),c=async()=>{if(!e||!a||!i){m.error("Please fill all fields.");return}try{n(!0),await(await(await I()).grantAccess(z(e),a,P(i))).wait(),m.success("Access granted successfully!"),t(""),s(""),r("")}catch(l){console.error("Grant error:",l),m.error("Failed to grant access.")}finally{n(!1)}},d=async()=>{if(!e||!a){m.error("Please provide Resource ID and Grantee Address.");return}try{n(!0),await(await(await I()).revokeAccess(z(e),a)).wait(),m.success("Access revoked successfully!"),t(""),s("")}catch(l){console.error("Revoke error:",l),m.error("Failed to revoke access.")}finally{n(!1)}};return u.jsxs("div",{className:"p-6 bg-white shadow-md rounded-lg max-w-2xl mx-auto mt-6 border border-gray-200",children:[u.jsx("h2",{className:"text-xl font-semibold text-gray-800 mb-4",children:"Access Control Panel"}),u.jsx("p",{className:"text-sm text-gray-500 mb-6",children:"Grant or revoke blockchain-based access to patient records securely."}),u.jsxs("div",{className:"space-y-4",children:[u.jsxs("div",{children:[u.jsx("label",{className:"block text-gray-700 font-medium mb-1",children:"Resource ID"}),u.jsx("input",{type:"text",value:e,onChange:l=>t(l.target.value),placeholder:"Enter resource ID",className:"w-full border px-3 py-2 rounded focus:ring focus:ring-indigo-200"})]}),u.jsxs("div",{children:[u.jsx("label",{className:"block text-gray-700 font-medium mb-1",children:"Grantee Address"}),u.jsx("input",{type:"text",value:a,onChange:l=>s(l.target.value),placeholder:"0x...",className:"w-full border px-3 py-2 rounded focus:ring focus:ring-indigo-200"})]}),u.jsxs("div",{children:[u.jsx("label",{className:"block text-gray-700 font-medium mb-1",children:"Encrypted Key (Hex)"}),u.jsx("input",{type:"text",value:i,onChange:l=>r(l.target.value),placeholder:"0x...",className:"w-full border px-3 py-2 rounded focus:ring focus:ring-indigo-200"})]}),u.jsxs("div",{className:"flex gap-4 mt-6",children:[u.jsx("button",{onClick:c,disabled:o,className:"flex-1 bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg transition disabled:opacity-50",children:o?"Granting...":"Grant Access"}),u.jsx("button",{onClick:d,disabled:o,className:"flex-1 bg-red-600 hover:bg-red-700 text-white py-2 rounded-lg transition disabled:opacity-50",children:o?"Revoking...":"Revoke Access"})]})]})]})};export{we as default};
