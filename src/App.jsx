import { useEffect, useState } from 'react'
import { GUISOS,TIPOS,pesos,folioTexto,hora,id,prepararProducto } from './catalogo'
import './App.css'

const KEY='dona-pera-demo-v4'
const USUARIOS=[{id:'mesero1',nombre:'Mesero 1',rol:'mesero'},{id:'mesero2',nombre:'Mesero 2',rol:'mesero'},{id:'mesero3',nombre:'Mesero 3',rol:'mesero'},{id:'gorditas',nombre:'Cocina · Gorditas',rol:'gorditas'},{id:'sopes',nombre:'Cocina · Sopes',rol:'sopes'},{id:'admin',nombre:'Administrador',rol:'admin'}]
const nuevoServicio=(tipo='mesa',nombre='',responsable='mesero1')=>({id:id(),tipo,nombre,responsable,divisiones:1,borrador:[],comandas:[],pagos:[],entregado:false,cerrado:false,creado:hora()})
const inicial=()=>({version:4,fecha:new Date().toLocaleDateString('es-MX'),jornadas:[],mesasCantidad:12,mesasInactivas:[],servicios:{},siguienteFolio:1,usuarios:USUARIOS,auditoria:[],orden:{gorditas:[],sopes:[]}})
const cargar=()=>{try{const d=JSON.parse(localStorage.getItem(KEY));return d?.version===4?{...inicial(),...d}:inicial()}catch{return inicial()}}
const productos=s=>s.comandas.flatMap(c=>c.items)
const total=s=>productos(s).filter(p=>p.estado!=='cancelado').reduce((n,p)=>n+p.precio*p.cantidad,0)
const abonado=s=>s.pagos.reduce((n,p)=>n+p.monto,0)
const pendiente=s=>Math.max(0,total(s)-abonado(s))
const terminado=s=>s.comandas.length>0&&productos(s).filter(p=>p.estado!=='cancelado').every(p=>['listo','atendido'].includes(p.estado))
const ubicacion=s=>s.tipo==='llevar'?`Para llevar · ${s.nombre}`:`Mesa ${s.numero}`
const estadoItem=p=>({pendiente:'Pendiente',dorado:'Pendiente de dorar',listo:'Listo',atendido:'Atiende mesero',cancelado:'Cancelado'})[p.estado]||p.estado
const iso=()=>new Date().toISOString()
const areasDe=c=>['gorditas','sopes'].filter(a=>c.items.some(p=>p.estado!=='cancelado'&&(a==='gorditas'?['gorditas','huarache'].includes(p.ruta):['sopes','huarache'].includes(p.ruta))))
const pendienteArea=(c,a)=>c.items.some(p=>p.estado!=='cancelado'&&(a==='gorditas'?((p.ruta==='gorditas'||p.ruta==='huarache')&&p.estado==='pendiente'):((p.ruta==='sopes'&&p.estado==='pendiente')||(p.ruta==='huarache'&&p.estado==='dorado'))))
const activoArea=(c,a)=>areasDe(c).includes(a)&&pendienteArea(c,a)
const combinado=p=>[p.nombre,p.detalle].filter(Boolean).join(' ').replace(/\s+Con /g,' con ').replace(/\s+Sin /g,' sin ')
const agrupar=items=>{
 const grupos={}
 for(const p of items){if(p.estado==='cancelado')continue;const division=p.division||1;const clave=`${division}|${p.nombre}|${p.detalle||''}`;if(!grupos[clave])grupos[clave]={...p,cantidad:0,division};grupos[clave].cantidad+=p.cantidad}
 return Object.values(grupos).sort((a,b)=>a.division-b.division)
}
function Bloque({items,precios=false,grande=false,solo=[]}){
 const vistos=agrupar(items.filter(p=>!solo.length||solo.includes(p.id)))
 return <div className={`divisiones ${grande?'lecturaGrande':''}`}>{[...new Set(vistos.map(p=>p.division))].map(div=><div className="division" key={div}><strong className="numeroDivision">{div}.</strong>{vistos.filter(p=>p.division===div).map(p=><div className="renglonComanda" key={`${p.id}-${p.nombre}`}><span>{p.cantidad} × {combinado(p)}</span>{precios&&<small>{pesos(p.cantidad*p.precio)}</small>}</div>)}</div>)}{!vistos.length&&<p className="suave">Sin productos pendientes.</p>}</div>
}
function App(){
 const [db,setDb]=useState(cargar)
 const [usuario,setUsuario]=useState('mesero1')
 const [vista,setVista]=useState('mesero')
 const [servicioId,setServicioId]=useState('')
 const [division,setDivision]=useState(1)
 const [tipo,setTipo]=useState('Gordita')
 const [guiso,setGuiso]=useState('Frijoles')
 const [guiso2,setGuiso2]=useState('')
 const [extras,setExtras]=useState([])
 const [dorado,setDorado]=useState('Normal')
 const [grasa,setGrasa]=useState('Normal')
 const [nota,setNota]=useState('')
 const [sabor,setSabor]=useState('Horchata')
 const [tamanoAgua,setTamanoAgua]=useState('½ litro')
 const [cafe,setCafe]=useState('Sin crema')
 const [menudoTam,setMenudoTam]=useState('Grande')
 const [menudoTipo,setMenudoTipo]=useState('Con carne')
 const [refresco,setRefresco]=useState('Coca')
 const [cantidad,setCantidad]=useState('1')
 const [buscar,setBuscar]=useState('')
 const [monto,setMonto]=useState('')
 const [metodo,setMetodo]=useState('Efectivo')
 const [ordenFolio,setOrdenFolio]=useState('')
 const [ordenPos,setOrdenPos]=useState('3')
 const [confirmarDia,setConfirmarDia]=useState(false)
 const rol=db.usuarios.find(u=>u.id===usuario)?.rol||'mesero'
 const administrador=rol==='admin'
 const esCocina=['gorditas','sopes'].includes(rol)
 const area=esCocina?rol:vista==='gorditas'?'gorditas':'sopes'
 const usuarioNombre=idUsuario=>db.usuarios.find(u=>u.id===idUsuario)?.nombre||idUsuario
 const servicios=Object.values(db.servicios)
 const activos=servicios.filter(s=>!s.cerrado)
 const accesibles=activos.filter(s=>administrador||s.responsable===usuario)
 const actual=db.servicios[servicioId]
 const permiso=actual&&(administrador||actual.responsable===usuario)
 const saldo=actual?pendiente(actual):0
 const registrar=(d,mensaje)=>({...d,auditoria:[...d.auditoria,{id:id(),fecha:hora(),autor:usuario,mensaje}]})
 const actualizar=fn=>setDb(d=>fn(d))
 const editar=(sid,fn,mensaje='')=>actualizar(d=>{const s=d.servicios[sid];if(!s)return d;const next={...d,servicios:{...d.servicios,[sid]:fn(s)}};return mensaje?registrar(next,mensaje):next})
 useEffect(()=>{try{localStorage.setItem(KEY,JSON.stringify(db))}catch{console.warn('Almacenamiento local lleno')}} ,[db])

 // Cada comanda ocupa una posición de su cola de área, nunca una posición por producto.
 const cola=a=>{
  const tareas=servicios.flatMap(s=>s.comandas.filter(c=>activoArea(c,a)).map(c=>({...c,servicioId:s.id,ubicacion:ubicacion(s),responsable:s.responsable})))
  const orden=db.orden[a]||[]
  return tareas.sort((x,y)=>{
   const ix=orden.indexOf(x.id),iy=orden.indexOf(y.id)
   if(ix>=0&&iy>=0)return ix-iy
   if(ix>=0)return -1
   if(iy>=0)return 1
   return Number(y.adicional)-Number(x.adicional)||x.folio-y.folio
  })
 }
 const visiblesArea=a=>cola(a).slice(0,2)
 const visibleEnCocina=c=>[...visiblesArea('gorditas'),...visiblesArea('sopes')].some(x=>x.id===c.id)
 const editable=(s,c)=>!s.cerrado&&(administrador||((s.responsable===usuario||c.creador===usuario)&&!visibleEnCocina(c)&&!c.items.some(p=>['listo','dorado'].includes(p.estado))))
 const pedidos=servicios.flatMap(s=>s.comandas.filter(c=>administrador||c.creador===usuario||s.responsable===usuario).map(c=>({...c,servicio:s,ubicacion:ubicacion(s)}))).sort((a,b)=>b.folio-a.folio)
 const listos=servicios.flatMap(s=>s.comandas.flatMap(c=>c.items.filter(p=>p.estado==='listo').map(p=>({...p,servicioId:s.id,folio:c.folio,ubicacion:ubicacion(s)}))))
 const tiempos=servicios.flatMap(s=>s.comandas.filter(c=>c.completadoEn).map(c=>(new Date(c.completadoEn)-new Date(c.enviadoEn))/60000)).filter(x=>Number.isFinite(x)&&x>=0)
 const promedio=tiempos.length?Math.max(1,Math.round(tiempos.reduce((a,b)=>a+b,0)/tiempos.length)):null
 const complementos=tipo==='Gordita'?['Con queso','Con crema','Con frijoles','Con arroz']:tipo.startsWith('Sope')?['Con verdura','Con todo','Con queso','Con crema','Con cebolla','Con cilantro','Con frijoles','Con arroz']:['Con queso','Sin queso','Con crema','Con frijoles','Con arroz']
 const llevaGuiso=['Gordita','Sope','Sope chico','Huarache','Plato de comida'].includes(tipo)

 function abrirMesa(n){const clave=`mesa-${n}`;const existente=db.servicios[clave];if(existente&&!existente.cerrado&&!administrador&&existente.responsable!==usuario)return;actualizar(d=>{const s=d.servicios[clave];if(s&&!s.cerrado)return d;return {...d,servicios:{...d.servicios,[clave]:{...nuevoServicio('mesa','',usuario),id:clave,numero:n}}}});setServicioId(clave);setDivision(1);setVista('mesero')}
 function nuevoParaLlevar(){const nombre=window.prompt('Nombre del cliente para llevar:');if(!nombre?.trim())return;const s=nuevoServicio('llevar',nombre.trim(),usuario);actualizar(d=>({...d,servicios:{...d.servicios,[s.id]:s}}));setServicioId(s.id);setDivision(1);setVista('mesero')}
 function agregarDivision(){if(!permiso)return;const n=actual.divisiones+1;editar(servicioId,s=>({...s,divisiones:n}));setDivision(n)}
 function agregar(){if(!permiso||actual.cerrado)return;const n=Number(cantidad);if(!Number.isInteger(n)||n<1||n> (tipo==='Gordita'?15:999)){window.alert('Revisa la cantidad.');return}const p=prepararProducto({tipo,guiso,guiso2,extras,dorado,grasa,nota,sabor,tamanoAgua,cafe,menudoTam,menudoTipo,refresco});editar(servicioId,s=>({...s,borrador:[...s.borrador,{...p,id:id(),division,cantidad:n}]}));setNota('');setCantidad('1')}
 function cantidadBorrador(pid,delta){editar(servicioId,s=>({...s,borrador:s.borrador.map(p=>p.id===pid?{...p,cantidad:p.cantidad+delta}:p).filter(p=>p.cantidad>0)}))}
 function borrarBorrador(pid){editar(servicioId,s=>({...s,borrador:s.borrador.filter(p=>p.id!==pid)}))}
 function enviar(){if(!permiso||!actual.borrador.length||actual.cerrado)return;actualizar(d=>{
  const s=d.servicios[servicioId],folio=d.siguienteFolio,adicional=s.comandas.length>0,fecha=hora()
  const items=s.borrador.map(p=>({...p,estado:p.ruta==='mesero'?'atendido':'pendiente',prioritario:adicional}))
  const c={id:id(),folio,fecha,enviadoEn:iso(),creador:usuario,adicional,items}
  const orden={...d.orden}
  for(const area of ['gorditas','sopes']){
   if(!activoArea(c,area))continue
   const existentes=Object.values(d.servicios).flatMap(sv=>sv.comandas.filter(x=>activoArea(x,area)))
   const prev=(orden[area]||[]).filter(cid=>existentes.some(x=>x.id===cid))
   for(const antigua of existentes.sort((x,y)=>x.folio-y.folio))if(!prev.includes(antigua.id))prev.push(antigua.id)
   if(adicional)prev.splice(Math.min(2,prev.length),0,c.id)
   else prev.push(c.id)
   orden[area]=prev
  }
  return registrar({...d,orden,siguienteFolio:folio+1,servicios:{...d.servicios,[servicioId]:{...s,borrador:[],comandas:[...s.comandas,c]}}},`${folioTexto(folio)} enviada · ${ubicacion(s)}`)
 })}

 function actualizarComanda(sid,cid,transformar,desc){editar(sid,s=>({...s,comandas:s.comandas.map(c=>{if(c.id!==cid)return c;const items=transformar(c.items);const completos=items.filter(p=>p.estado!=='cancelado').every(p=>['listo','atendido'].includes(p.estado));return {...c,items,completadoEn:completos?(c.completadoEn||iso()):null}})}),desc)}
 function eliminarProducto(s,c,p){if(!editable(s,c)||p.estado==='cancelado'||!administrador&&p.estado!=='pendiente')return;actualizarComanda(s.id,c.id,items=>items.map(x=>x.id===p.id?{...x,estado:'cancelado'}:x),`Eliminó ${p.nombre} · ${folioTexto(c.folio)}`)}
 function terminarArea(c,a){const s=db.servicios[c.servicioId];if(!s)return;actualizarComanda(s.id,c.id,items=>items.map(p=>{
  if(p.estado==='cancelado')return p
  if(a==='gorditas'&&p.estado==='pendiente'&&p.ruta==='huarache')return {...p,estado:'dorado'}
  if(a==='gorditas'&&p.estado==='pendiente'&&p.ruta==='gorditas')return {...p,estado:'listo'}
  if(a==='sopes'&&((p.ruta==='sopes'&&p.estado==='pendiente')||(p.ruta==='huarache'&&p.estado==='dorado')))return {...p,estado:'listo'}
  return p
 }),`${folioTexto(c.folio)} · trabajo terminado en ${a}`)}
 function revertir(p){const s=db.servicios[p.servicioId];const c=s?.comandas.find(c=>c.folio===p.folio);if(!c)return;actualizarComanda(s.id,c.id,items=>items.map(x=>x.id===p.id?{...x,estado:x.ruta==='huarache'?'dorado':x.ruta==='mesero'?'atendido':'pendiente'}:x),`Administrador revirtió listo · ${folioTexto(c.folio)}`)}
 function pagar(){if(!administrador||!actual||actual.cerrado||!actual.comandas.length)return;const n=Number(monto);if(!Number.isFinite(n)||n<=0||n>saldo+.001){window.alert(`Importe válido hasta ${pesos(saldo)}`);return}editar(servicioId,s=>({...s,pagos:[...s.pagos,{id:id(),monto:n,metodo,fecha:hora(),autor:usuario}]}),`Pago de ${pesos(n)} · ${metodo}`);setMonto('')}
 function cerrarCuenta(){if(!administrador||!actual||actual.cerrado)return;if(saldo>.001||!terminado(actual)||(actual.tipo==='llevar'&&!actual.entregado)){window.alert('Debe estar pagada, preparada y entregada si es para llevar.');return}editar(servicioId,s=>({...s,cerrado:true}),`Cuenta cerrada · ${ubicacion(actual)}`)}
 function cerrarJornada(){if(!administrador)return;if(activos.some(s=>s.comandas.length||s.borrador.length)){window.alert('Hay cuentas o pedidos abiertos. Resuélvelos antes de cerrar.');return}if(!confirmarDia){setConfirmarDia(true);return}const clave=window.prompt('Clave DEMO de cambio de jornada (escribe CERRAR):');if(clave!=='CERRAR')return;actualizar(d=>registrar({...d,fecha:new Date().toLocaleDateString('es-MX'),jornadas:[...d.jornadas,{fecha:d.fecha,cierre:hora(),ventas:servicios.filter(s=>s.cerrado).reduce((n,s)=>n+abonado(s),0)}]},`Jornada ${db.fecha} cerrada`));setConfirmarDia(false)}
 function moverEnCola(){if(!administrador)return;const colaActual=cola(ordenArea);const index=colaActual.findIndex(c=>c.id===ordenFolio);const dest=Number(ordenPos)-1;if(index<2||dest<2||dest>=colaActual.length||!Number.isInteger(dest))return;const nueva=[...colaActual.map(c=>c.id)];const [movida]=nueva.splice(index,1);nueva.splice(dest,0,movida);actualizar(d=>registrar({...d,orden:{...d.orden,[ordenArea]:nueva}},`Reordenó ${ordenArea}: ${folioTexto(colaActual[index].folio)} a posición ${dest+1}`))}
 const [ordenArea,setOrdenArea]=useState('gorditas')
 useEffect(()=>{if(!['gorditas','sopes'].includes(vista))return;const f=e=>{if(e.key!=='F9'||['INPUT','SELECT','TEXTAREA'].includes(document.activeElement?.tagName))return;const c=visiblesArea(vista)[0];if(c){e.preventDefault();terminarArea(c,vista)}};window.addEventListener('keydown',f);return()=>window.removeEventListener('keydown',f)})
 const tipoCantidad=['Tortilla','Vaso de plástico','Gorda sin comida'].includes(tipo)
 const cocinaRender=(a)=>{const lista=visiblesArea(a);return <section className="tarjeta cocina"><div className="tituloFila"><div><h2>{a==='gorditas'?'Gorditas · elaboración de huaraches':'Sopes · dorado de huaraches'}</h2><p className="suave">Dos comandas como máximo. Una nueva aparece cuando se completa una de ellas.</p></div><span className="contador">{cola(a).length} pendientes</span></div><div className="rejilla-pedidos soloDos">{lista.map(c=>{const s=db.servicios[c.servicioId],ids=c.items.filter(p=>a==='gorditas'?p.estado==='pendiente'&&['gorditas','huarache'].includes(p.ruta):(p.ruta==='sopes'&&p.estado==='pendiente')||(p.ruta==='huarache'&&p.estado==='dorado')).map(p=>p.id);return <article className="ticket comandaCocina" key={c.id}><strong>{folioTexto(c.folio)} · {ubicacion(s)}</strong>{c.adicional&&<span className="etiquetaPrioridad">Adicional prioritario</span>}<Bloque grande items={c.items} solo={ids}/><button className="principal ancho" onClick={()=>terminarArea(c,a)}>✓ Pedido completo</button></article>})}</div>{!lista.length&&<p className="vacio">Sin comandas pendientes.</p>}<p className="suave">Tecla F9: confirma la primera comanda visible (simula pedal o botón USB).</p></section>}
 const estadoComanda=c=>{
  const s=c.servicio
  if(s.cerrado)return 'cerrada'
  const vigentes=c.items.filter(p=>p.estado!=='cancelado')
  if(!vigentes.length)return 'cancelada'
  if(vigentes.every(p=>['listo','atendido'].includes(p.estado)))return 'lista'
  if(visibleEnCocina(c)||vigentes.some(p=>['dorado','listo'].includes(p.estado)))return 'proceso'
  return 'espera'
 }
 const seguimientoGrupos=administrador?db.usuarios.filter(u=>['mesero','admin'].includes(u.rol)):[db.usuarios.find(u=>u.id===usuario)]
 return <div className="aplicacion"><header className="cabecera"><div><div className="marca">🌮 DOÑA PERA <span>· Prototipo v4</span></div><h1>Comandas y administración</h1><p>Pedidos, producción, empaquetado y cobros</p></div><div className="cabeceraDerecha"><span>Jornada: {db.fecha}</span><small>Demo local · sin sincronización ni seguridad real</small></div></header><main className="contenedor">
 <div className="franja"><label>Simular sesión <select value={usuario} onChange={e=>{const u=db.usuarios.find(x=>x.id===e.target.value);setUsuario(e.target.value);setServicioId('');setVista(u?.rol==='gorditas'||u?.rol==='sopes'?u.rol:'mesero')}}>{db.usuarios.map(u=><option key={u.id} value={u.id}>{u.nombre} · {u.rol}</option>)}</select></label><span className="ayuda">Las cuentas son demostrativas, sin contraseñas reales.</span></div>
 {!esCocina&&<nav className="pestanas">{[['mesero','Tomar pedidos'],['mis','Mis pedidos'],['gorditas','Cocina · Gorditas'],['sopes','Cocina · Sopes'],['seguimiento','Seguimiento'],['llevar','Para llevar'],['admin','Administración']].filter(([v])=>administrador||!['admin','llevar'].includes(v)).map(([v,t])=><button key={v} className={vista===v?'seleccionado':''} onClick={()=>setVista(v)}>{t}</button>)}</nav>}
 {vista==='mesero'&&!esCocina&&<div className="columnas"><section className="tarjeta"><div className="tituloFila"><h2>Mis mesas</h2>{administrador&&<div className="botonesJuntos"><button onClick={()=>actualizar(d=>({...d,mesasCantidad:d.mesasCantidad+1}))}>+ Mesa</button><button onClick={()=>{const n=Array.from({length:db.mesasCantidad},(_,i)=>db.mesasCantidad-i).find(n=>!db.mesasInactivas.includes(n)&&(!db.servicios[`mesa-${n}`]||db.servicios[`mesa-${n}`].cerrado));if(n)actualizar(d=>({...d,mesasInactivas:[...d.mesasInactivas,n]}))}}>- Mesa</button></div>}</div><div className="rejilla-mesas">{Array.from({length:db.mesasCantidad},(_,i)=>i+1).filter(n=>!db.mesasInactivas.includes(n)).map(n=>{const s=db.servicios[`mesa-${n}`],ocupada=s&&!s.cerrado,bloqueo=ocupada&&!administrador&&s.responsable!==usuario;return <button key={n} className={`boton-mesa ${servicioId===`mesa-${n}`?'activo':''}`} disabled={bloqueo} onClick={()=>abrirMesa(n)}>Mesa {n}<small>{bloqueo?'Otro mesero':ocupada?'En servicio':'Libre'}</small></button>})}</div>{administrador&&db.mesasInactivas.length>0&&<div className="chips"><span>Reactivar:</span>{db.mesasInactivas.map(n=><button key={n} onClick={()=>actualizar(d=>({...d,mesasInactivas:d.mesasInactivas.filter(x=>x!==n)}))}>Mesa {n}</button>)}</div>}<button className="principal ancho" onClick={nuevoParaLlevar}>+ Pedido para llevar</button><h3>Mis pedidos para llevar</h3>{accesibles.filter(s=>s.tipo==='llevar').map(s=><button key={s.id} className="listaSeleccion" onClick={()=>{setServicioId(s.id);setDivision(1)}}>{s.nombre} · {s.comandas.map(c=>folioTexto(c.folio)).join(', ')||'Sin enviar'}</button>)}{actual&&permiso&&<><h3>Divisiones</h3><div className="chips">{Array.from({length:actual.divisiones},(_,i)=>i+1).map(n=><button className={division===n?'activo':''} onClick={()=>setDivision(n)} key={n}>{n}.</button>)}<button onClick={agregarDivision}>+ Número</button></div></>}</section>
 <section className="tarjeta"><h2>Menú</h2>{actual&&permiso&&!actual.cerrado?<><p className="suave">{ubicacion(actual)} · {division}.</p><div className="chips tipos">{TIPOS.map(t=><button className={tipo===t?'activo':''} onClick={()=>{setTipo(t);setExtras([]);setGuiso2('');setCantidad('1');setDorado('Normal');setGrasa('Normal')}} key={t}>{t}</button>)}</div>{llevaGuiso&&<><label>Guiso</label><select value={guiso} onChange={e=>setGuiso(e.target.value)}>{GUISOS.map(g=><option key={g}>{g}</option>)}</select>{['Huarache','Plato de comida'].includes(tipo)&&<><label>Segundo guiso (opcional)</label><select value={guiso2} onChange={e=>setGuiso2(e.target.value)}><option value="">Solo uno</option>{GUISOS.filter(g=>g!==guiso).map(g=><option key={g}>{g}</option>)}</select></>}<label>Complementos (sin costo)</label><div className="checks">{complementos.map(x=><label key={x}><input type="checkbox" checked={extras.includes(x)} onChange={()=>setExtras(a=>a.includes(x)?a.filter(y=>y!==x):[...a,x])}/>{x}</label>)}</div>{(tipo==='Gordita')&&<><label>Cantidad de gorditas iguales (1–15)</label><select value={cantidad} onChange={e=>setCantidad(e.target.value)}>{Array.from({length:15},(_,i)=><option key={i+1}>{i+1}</option>)}</select></>}{(tipo.startsWith('Sope')||tipo==='Huarache')&&<><label>Dorado</label><select value={dorado} onChange={e=>setDorado(e.target.value)}>{['Normal','Bien dorado','No muy dorado'].map(x=><option key={x}>{x}</option>)}</select><label>Grasa</label><select value={grasa} onChange={e=>setGrasa(e.target.value)}><option>Normal</option><option>Sin grasa</option></select></>}</>}{tipoCantidad&&<><label>Cantidad</label><input type="number" min="1" step="1" value={cantidad} onChange={e=>setCantidad(e.target.value)}/></>}{tipo==='Agua'&&<><label>Sabor</label><select value={sabor} onChange={e=>setSabor(e.target.value)}>{['Horchata','Jamaica','Limón'].map(x=><option key={x}>{x}</option>)}</select><label>Tamaño</label><select value={tamanoAgua} onChange={e=>setTamanoAgua(e.target.value)}><option>½ litro</option><option>1 litro</option></select></>}{tipo==='Café'&&<><label>Tipo de café</label><select value={cafe} onChange={e=>setCafe(e.target.value)}><option>Sin crema</option><option>Con crema</option></select></>}{tipo==='Refresco'&&<><label>Refresco</label><select value={refresco} onChange={e=>setRefresco(e.target.value)}>{['Coca','Manzanita','Fresca','Fanta'].map(x=><option key={x}>{x}</option>)}</select></>}{tipo==='Menudo'&&<><label>Presentación</label><select value={menudoTam} onChange={e=>setMenudoTam(e.target.value)}>{['Grande','Chico','Mini','Vaso con carne','Vaso sin carne'].map(x=><option key={x}>{x}</option>)}</select>{!menudoTam.startsWith('Vaso')&&<><label>Opción</label><select value={menudoTipo} onChange={e=>setMenudoTipo(e.target.value)}>{['Con carne','Con carne y pata','Solo pata'].map(x=><option key={x}>{x}</option>)}</select></>}</>}<label>Observaciones opcionales</label><input value={nota} onChange={e=>setNota(e.target.value)} placeholder="Ej. Sin cebolla"/><div className="fila-final"><strong>{pesos(prepararProducto({tipo,guiso,guiso2,extras,dorado,grasa,nota,sabor,tamanoAgua,cafe,menudoTam,menudoTipo,refresco}).precio*Number(cantidad||1))}</strong><button className="principal" onClick={agregar}>+ Agregar al pedido</button></div></>:<p className="vacio">Selecciona una mesa disponible o crea un pedido para llevar.</p>}</section>
 <section className="tarjeta"><h2>{actual&&permiso?`Cuenta · ${ubicacion(actual)}`:'Comanda'}</h2>{actual&&permiso?<><h3>Por enviar</h3><Bloque items={actual.borrador} precios/>{actual.borrador.map(p=><div key={p.id} className="miniAccion"><span>{combinado(p)}</span><span><button onClick={()=>cantidadBorrador(p.id,-1)}>−</button> {p.cantidad} <button onClick={()=>cantidadBorrador(p.id,1)}>+</button> <button className="peligro" onClick={()=>borrarBorrador(p.id)}>Borrar</button></span></div>)}<button className="principal ancho" disabled={!actual.borrador.length} onClick={enviar}>Enviar comanda</button><h3>Comandas enviadas</h3>{actual.comandas.map(c=><article key={c.id} className="comanda"><strong>{folioTexto(c.folio)}</strong> <small>· {usuarioNombre(c.creador)}</small><Bloque items={c.items} precios/>{!administrador&&visibleEnCocina(c)&&<p className="suave">En cocina · solo administrador puede modificar</p>}</article>)}<div className="total"><strong>Total</strong><strong>{pesos(total(actual))}</strong></div><div className="total"><span>Abonado</span><b>{pesos(abonado(actual))}</b></div><div className="total"><span>Saldo</span><b>{pesos(saldo)}</b></div></>:<p className="vacio">Selecciona un pedido para continuar.</p>}</section></div>}
 {['gorditas','sopes'].includes(vista)&&cocinaRender(area)}
 {vista==='mis'&&!esCocina&&<section className="tarjeta"><h2>{administrador?'Todas las comandas':'Mis pedidos'}</h2><div className="rejilla-pedidos">{pedidos.map(c=><article key={c.id} className="ticket"><strong>{folioTexto(c.folio)} · {c.ubicacion}</strong><p>Responsable: {usuarioNombre(c.servicio.responsable)}</p><Bloque items={c.items}/></article>)}</div></section>}
 {vista==='seguimiento'&&!esCocina&&<section className="tarjeta"><div className="tituloFila"><h2>Seguimiento de pedidos</h2><span className="contador">Promedio real: {promedio?`${promedio} min`:'Recopilando datos'}</span></div><label>Buscar mesa, folio, cliente o responsable</label><input value={buscar} onChange={e=>setBuscar(e.target.value)} placeholder="Ej. Mesa 2, 000004, Daniela"/>{seguimientoGrupos.filter(Boolean).map(u=>{const lista=pedidos.filter(c=>c.servicio.responsable===u.id&&`${folioTexto(c.folio)} ${c.ubicacion} ${u.nombre}`.toLowerCase().includes(buscar.toLowerCase()));return lista.length>0&&<div key={u.id} className="grupoSeguimiento"><h3>{u.nombre}</h3><div className="rejilla-pedidos">{lista.map(c=>{const st=estadoComanda(c);const cola=servicios.flatMap(s=>s.comandas).filter(x=>x.folio<c.folio&&x.items.some(p=>['pendiente','dorado'].includes(p.estado))).length;return <article className={`ticket estado-${st}`} key={c.id}><strong>{folioTexto(c.folio)} · {c.ubicacion}</strong><p>— Responsable: {u.nombre} · {st.toUpperCase()}</p><p>{c.items.filter(p=>p.estado!=='cancelado').length} productos · {cola} comandas anteriores pendientes (aprox.)</p><p className="suave">Espera: {promedio?`aproximadamente ${Math.max(1,Math.round(promedio*(cola+1)*.75))}–${Math.round(promedio*(cola+1)*1.25)+2} min`:'Aún sin datos suficientes'}</p><details><summary>Ver productos</summary>{c.items.map(p=><div className="linea" key={p.id}><span>{p.cantidad} × {combinado(p)} · {estadoItem(p)}</span>{editable(c.servicio,c)&&p.estado!=='cancelado'&&(administrador||p.estado==='pendiente')&&<button className="peligro" onClick={()=>eliminarProducto(c.servicio,c,p)}>Eliminar</button>}</div>)}</details>{!c.servicio.cerrado&&(administrador||c.servicio.responsable===usuario)&&<button className="ligero" onClick={()=>{setServicioId(c.servicio.id);setDivision(1);setVista('mesero')}}>+ Agregar productos en Tomar pedidos</button>}</article>})}</div></div>})}</section>}
 {vista==='llevar'&&administrador&&<section className="tarjeta"><h2>Pedidos para llevar · empaquetado</h2><p className="suave">Una verificación por pedido completo. Sin sugerencias de empaque.</p>{activos.filter(s=>s.tipo==='llevar').map(s=><article key={s.id} className="comanda"><h3>{s.nombre} · {s.comandas.map(c=>folioTexto(c.folio)).join(', ')||'Sin enviar'}</h3><span className="contador">{terminado(s)?'Producción lista':'En preparación'}</span><Bloque items={productos(s)}/><button className="principal" disabled={!terminado(s)||s.entregado} onClick={()=>editar(s.id,x=>({...x,entregado:true}),`Pedido para llevar entregado a ${s.nombre}`)}>{s.entregado?'Entregado':'✓ Pedido completo · entregar'}</button><p>Saldo: {pesos(pendiente(s))}</p></article>)}</section>}
 {vista==='admin'&&administrador&&<section className="tarjeta"><h2>Administración</h2><div className="indicadores"><div><small>Comandas</small><strong>{servicios.reduce((n,s)=>n+s.comandas.length,0)}</strong></div><div><small>Cuentas abiertas</small><strong>{activos.filter(s=>s.comandas.length).length}</strong></div><div><small>Pagos registrados</small><strong>{pesos(servicios.reduce((n,s)=>n+abonado(s),0))}</strong></div></div><h3>Cuentas y cobros</h3><div className="listaCuentas">{activos.filter(s=>s.comandas.length).map(s=><button key={s.id} className={servicioId===s.id?'activo':''} onClick={()=>setServicioId(s.id)}>{ubicacion(s)} · Saldo {pesos(pendiente(s))}</button>)}</div>{actual&&!actual.cerrado&&<div className="adminCuenta"><h3>{ubicacion(actual)}</h3><label>Reasignar mesero</label><select value={actual.responsable} onChange={e=>editar(servicioId,s=>({...s,responsable:e.target.value}),`Reasignación a ${usuarioNombre(e.target.value)}`)}>{db.usuarios.filter(u=>u.rol==='mesero'||u.rol==='admin').map(u=><option key={u.id} value={u.id}>{u.nombre}</option>)}</select><div className="indicadores"><div><small>Total</small><strong>{pesos(total(actual))}</strong></div><div><small>Abonado</small><strong>{pesos(abonado(actual))}</strong></div><div><small>Saldo</small><strong>{pesos(saldo)}</strong></div></div><label>Pago parcial o completo</label><div className="fila-final"><input type="number" value={monto} onChange={e=>setMonto(e.target.value)} min="0.01" step="0.01" placeholder="Importe $"/><select value={metodo} onChange={e=>setMetodo(e.target.value)}><option>Efectivo</option><option>Tarjeta</option><option>Transferencia</option></select><button className="principal" disabled={!saldo} onClick={pagar}>Registrar pago</button></div><button onClick={()=>setMonto(saldo.toFixed(2))}>Colocar saldo completo</button><div className="fila-final"><button className="principal" disabled={saldo>.001||!terminado(actual)||(actual.tipo==='llevar'&&!actual.entregado)} onClick={cerrarCuenta}>Cerrar cuenta</button>{actual.tipo==='llevar'&&<button onClick={()=>setVista('llevar')}>Ir a empaquetado</button>}</div><h3>Historial de pagos</h3>{actual.pagos.map(p=><p key={p.id}>{pesos(p.monto)} · {p.metodo} · {p.fecha}</p>)}</div>}<div className="separador"/><h3>Reorganizar comandas pendientes</h3><p className="suave">Las dos comandas visibles no se desplazan.</p><label>Área de cocina</label><select value={ordenArea} onChange={e=>{setOrdenArea(e.target.value);setOrdenFolio('')}}><option value="gorditas">Gorditas</option><option value="sopes">Sopes</option></select><label>Comanda en espera</label><select value={ordenFolio} onChange={e=>setOrdenFolio(e.target.value)}><option value="">Seleccionar</option>{cola(ordenArea).slice(2).map(c=><option key={c.id} value={c.id}>{folioTexto(c.folio)}</option>)}</select><label>Posición en cola</label><input type="number" min="3" max={Math.max(3,cola(ordenArea).length)} value={ordenPos} onChange={e=>setOrdenPos(e.target.value)}/><button onClick={moverEnCola}>Mover comanda</button><div className="separador"/><h3>Corregir productos listos</h3>{listos.map(p=><div className="linea" key={p.id}><span>{folioTexto(p.folio)} · {p.ubicacion} · {combinado(p)}</span><button className="peligro" onClick={()=>revertir(p)}>Revertir listo</button></div>)}<div className="separador"/><h3>Jornada {db.fecha}</h3><p className="suave">No puede cerrarse mientras haya cuentas pendientes. Protección de contraseña real pendiente del backend.</p><button className="peligro" onClick={cerrarJornada}>{confirmarDia?'Confirmar cambio de jornada':'Cerrar jornada'}</button><div className="separador"/><h3>Movimientos recientes</h3>{db.auditoria.slice(-20).reverse().map(a=><div className="historial" key={a.id}>{a.mensaje}<small>{a.fecha} · {usuarioNombre(a.autor)}</small></div>)}</section>}
 <footer className="pie">DEMO local: datos solo en este navegador. Usuarios sin contraseña y permisos de interfaz no seguros. No utilizar para ventas reales hasta implementar servidor, autenticación y sincronización.</footer></main></div>
}
export default App
