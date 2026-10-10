import { useEffect, useState } from 'react'
import { GUISOS,pesos,folioTexto,hora,id,prepararProducto } from './catalogo'
import './App.css'

const KEY='dona-pera-demo-v4'
const USUARIOS=[{id:'mesero1',nombre:'Mesero 1',rol:'mesero'},{id:'mesero2',nombre:'Mesero 2',rol:'mesero'},{id:'mesero3',nombre:'Mesero 3',rol:'mesero'},{id:'gorditas',nombre:'Cocina · Gorditas',rol:'gorditas'},{id:'sopes',nombre:'Cocina · Sopes',rol:'sopes'},{id:'admin',nombre:'Administrador',rol:'admin'}]
const nuevoServicio=(tipo='mesa',nombre='',responsable='mesero1')=>({id:id(),tipo,nombre,responsable,divisiones:1,borrador:[],comandas:[],pagos:[],entregado:false,cerrado:false,creado:hora()})
const inicial=()=>({version:4,fecha:new Date().toLocaleDateString('es-MX'),jornadas:[],mesasCantidad:12,mesasInactivas:[],servicios:{},siguienteFolio:1,usuarios:USUARIOS,auditoria:[],orden:{gorditas:[],sopes:[],bebidas:[]}})
const cargar=()=>{try{const d=JSON.parse(localStorage.getItem(KEY));return d?.version===4?{...inicial(),...d}:inicial()}catch{return inicial()}}
const productos=s=>s.comandas.flatMap(c=>c.items)
const total=s=>productos(s).filter(p=>p.estado!=='cancelado').reduce((n,p)=>n+p.precio*p.cantidad,0)
const abonado=s=>s.pagos.reduce((n,p)=>n+p.monto,0)
const pendiente=s=>Math.max(0,total(s)-abonado(s))
const terminado=s=>s.comandas.length>0&&productos(s).filter(p=>p.estado!=='cancelado').every(p=>['listo','atendido'].includes(p.estado))
const ubicacion=s=>s.tipo==='llevar'?`Para llevar · ${s.nombre}`:`Mesa ${s.numero}`
const estadoItem=p=>({pendiente:'Pendiente',dorado:'Pendiente de dorar',listo:'Listo',atendido:'Atiende mesero',cancelado:'Cancelado'})[p.estado]||p.estado
const iso=()=>new Date().toISOString()
const areasDe=c=>['gorditas','sopes','bebidas'].filter(a=>c.items.some(p=>p.estado!=='cancelado'&&(a==='gorditas'?['gorditas','huarache'].includes(p.ruta):a==='sopes'?['sopes','huarache'].includes(p.ruta):p.ruta==='bebidas')))
const pendienteArea=(c,a)=>c.items.some(p=>p.estado!=='cancelado'&&(a==='gorditas'?((p.ruta==='gorditas'||p.ruta==='huarache')&&p.estado==='pendiente'):a==='sopes'?((p.ruta==='sopes'&&p.estado==='pendiente')||(p.ruta==='huarache'&&p.estado==='dorado')):(p.ruta==='bebidas'&&p.estado==='pendiente')))
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
 const [categoria,setCategoria]=useState('Gorditas')
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
 const [buscarMov,setBuscarMov]=useState('')
 const [buscarListos,setBuscarListos]=useState('')
 const [editando,setEditando]=useState(null)
 const [seleccionDiv,setSeleccionDiv]=useState([])
 const [monto,setMonto]=useState('')
 const [metodo,setMetodo]=useState('Efectivo')
 const [ordenFolio,setOrdenFolio]=useState('')
 const [ordenPos,setOrdenPos]=useState('3')
 const [confirmarDia,setConfirmarDia]=useState(false)
 const rol=db.usuarios.find(u=>u.id===usuario)?.rol||'mesero'
 const administrador=rol==='admin'
 const esCocina=['gorditas','sopes'].includes(rol)
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
  const tareas=servicios.filter(s=>a!=='bebidas'||administrador||s.responsable===usuario).flatMap(s=>s.comandas.filter(c=>activoArea(c,a)).map(c=>({...c,servicioId:s.id,ubicacion:ubicacion(s),responsable:s.responsable})))
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
 const visibleEnCocina=c=>[...visiblesArea('gorditas'),...visiblesArea('sopes'),...cola('bebidas').slice(0,2)].some(x=>x.id===c.id)
 const editable=(s,c)=>!s.cerrado&&(administrador||s.responsable===usuario||c.creador===usuario)&&!visibleEnCocina(c)&&!c.items.some(p=>['listo','dorado'].includes(p.estado))
 const pedidos=servicios.flatMap(s=>s.comandas.filter(c=>administrador||c.creador===usuario||s.responsable===usuario).map(c=>({...c,servicio:s,ubicacion:ubicacion(s)}))).sort((a,b)=>b.folio-a.folio)
 const cerradas=servicios.filter(s=>s.cerrado)
 const tiempos=servicios.flatMap(s=>s.comandas.filter(c=>c.completadoEn).map(c=>(new Date(c.completadoEn)-new Date(c.enviadoEn))/60000)).filter(x=>Number.isFinite(x)&&x>=0)
 const promedio=tiempos.length?Math.max(1,Math.round(tiempos.reduce((a,b)=>a+b,0)/tiempos.length)):null
 const complementos=tipo==='Gordita'?['Con queso','Con crema','Con frijoles','Con arroz']:tipo.startsWith('Sope')?['Con verdura','Con todo','Con queso','Con crema','Con cebolla','Con cilantro','Con frijoles','Con arroz']:['Con queso','Sin queso','Con crema','Con frijoles','Con arroz']
 const llevaGuiso=['Gordita','Sope','Sope chico','Huarache','Plato de comida'].includes(tipo)

 function abrirMesa(n){
  setEditando(null)
  const existente=servicios.find(x=>x.tipo==='mesa'&&x.numero===n&&!x.cerrado)
  if(existente&&!administrador&&existente.responsable!==usuario)return
  if(existente){setServicioId(existente.id)}else{
   const clave=db.servicios[`mesa-${n}`]?id():`mesa-${n}`
   const nuevo={...nuevoServicio('mesa','',usuario),id:clave,numero:n}
   actualizar(d=>({...d,servicios:{...d.servicios,[clave]:nuevo}}))
   setServicioId(clave)
  }
  setDivision(1);setVista('mesero')
 }
 function nuevoParaLlevar(){setEditando(null);const nombre=window.prompt('Nombre del cliente para llevar:');if(!nombre?.trim())return;const s=nuevoServicio('llevar',nombre.trim(),usuario);actualizar(d=>({...d,servicios:{...d.servicios,[s.id]:s}}));setServicioId(s.id);setDivision(1);setVista('mesero')}
 function agregarDivision(){if(!permiso)return;const n=actual.divisiones+1;editar(servicioId,s=>({...s,divisiones:n}));setDivision(n)}
 function agregar(){if(!permiso||actual.cerrado)return;const n=Number(cantidad);if(!Number.isInteger(n)||n<1||n> (tipo==='Gordita'?15:999)){window.alert('Revisa la cantidad.');return}const p=prepararProducto({tipo,guiso,guiso2,extras,dorado,grasa,nota,sabor,tamanoAgua,cafe,menudoTam,menudoTipo,refresco});if(editando){setEditando(e=>({...e,items:[...e.items,{...p,id:id(),division,cantidad:n,estado:p.ruta==='mesero'?'atendido':'pendiente'}]}))}else editar(servicioId,s=>({...s,borrador:[...s.borrador,{...p,id:id(),division,cantidad:n}]}));setNota('');setCantidad('1')}
 function cantidadBorrador(pid,delta){editar(servicioId,s=>({...s,borrador:s.borrador.map(p=>p.id===pid?{...p,cantidad:p.cantidad+delta}:p).filter(p=>p.cantidad>0)}))}
 function borrarBorrador(pid){editar(servicioId,s=>({...s,borrador:s.borrador.filter(p=>p.id!==pid)}))}
 function enviar(){if(!permiso||!actual.borrador.length||actual.cerrado)return;actualizar(d=>{
  const s=d.servicios[servicioId],folio=d.siguienteFolio,adicional=s.comandas.length>0,fecha=hora()
  const items=s.borrador.map(p=>({...p,estado:p.ruta==='mesero'?'atendido':'pendiente',prioritario:adicional}))
  const c={id:id(),folio,fecha,enviadoEn:iso(),creador:usuario,adicional,items}
  const orden={...d.orden}
  for(const area of ['gorditas','sopes','bebidas']){
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
 function iniciarEdicion(c){
  if(!editable(c.servicio,c)){window.alert('No se puede modificar: la comanda ya entró a cocina, está preparada o la cuenta se cerró.');return}
  if(c.servicio.pagos.length){window.alert('Esta cuenta ya tiene pagos registrados. Para evitar descuadrar cobros, no se puede modificar esta comanda desde aquí.');return}
  setServicioId(c.servicio.id);setDivision(1);setEditando({sid:c.servicio.id,cid:c.id,folio:c.folio,items:c.items.map(p=>({...p}))});setVista('mesero')
 }
 function quitarEnEdicion(pid){setEditando(e=>({...e,items:e.items.filter(p=>p.id!==pid)}))}
 function cambiarEnEdicion(pid,delta){setEditando(e=>({...e,items:e.items.map(p=>p.id===pid?{...p,cantidad:p.cantidad+delta}:p).filter(p=>p.cantidad>0)}))}
 function guardarEdicion(){
  if(!editando)return
  const sv=db.servicios[editando.sid], c=sv?.comandas.find(x=>x.id===editando.cid)
  if(!sv||!c||!editable(sv,c)||sv.pagos.length){window.alert('La comanda cambió de estado o ya recibió pagos. No se guardaron cambios.');setEditando(null);return}
  if(!editando.items.length){window.alert('El pedido debe conservar al menos un producto.');return}
  const prevAreas=areasDe(c), nueva={...c,items:editando.items}, nuevasAreas=areasDe(nueva)
  actualizar(d=>{
   const old=d.servicios[editando.sid];const orden={...d.orden}
   for(const a of nuevasAreas){if(!prevAreas.includes(a)&&!(orden[a]||[]).includes(c.id))orden[a]=[...(orden[a]||[]),c.id]}
   return registrar({...d,orden,servicios:{...d.servicios,[editando.sid]:{...old,comandas:old.comandas.map(x=>x.id===c.id?nueva:x)}}},`Modificó ${folioTexto(c.folio)} · ${ubicacion(sv)}`)
  })
  setEditando(null);setVista('mis')
 }
 function revertirListo(sid,cid,a){
  if(!administrador)return
  const sv=db.servicios[sid],c=sv?.comandas.find(x=>x.id===cid)
  if(!sv||!c||sv.cerrado||!c.items.some(p=>p.estado==='listo'&&(a==='gorditas'?p.ruta==='gorditas':a==='sopes'?['sopes','huarache'].includes(p.ruta):p.ruta==='bebidas')))return
  actualizarComanda(sid,cid,items=>items.map(p=>{
   if(p.estado!=='listo')return p
   if(a==='gorditas'&&p.ruta==='gorditas')return {...p,estado:'pendiente'}
   if(a==='sopes'&&p.ruta==='sopes')return {...p,estado:'pendiente'}
   if(a==='sopes'&&p.ruta==='huarache')return {...p,estado:'dorado'}
   if(a==='bebidas'&&p.ruta==='bebidas')return {...p,estado:'pendiente'}
   return p
  }),`Quitó Listo de ${a} · ${folioTexto(c.folio)} · ${ubicacion(sv)}`)
 }
 function reabrirCuenta(sid){
  const s=db.servicios[sid];if(!administrador||!s?.cerrado)return
  const otra=servicios.find(x=>x.id!==sid&&x.tipo==='mesa'&&s.tipo==='mesa'&&x.numero===s.numero&&!x.cerrado)
  if(otra){window.alert('Esta mesa ya tiene otra cuenta abierta. Ciérrala antes de reabrir la anterior.');return}
  editar(sid,x=>({...x,cerrado:false}),`Reabrió cuenta · ${ubicacion(s)} · conserva pagos y folios`)
  setServicioId(sid);setVista('cobros')
 }
 const subtotalDivision=(sv,n)=>productos(sv).filter(p=>p.estado!=='cancelado'&&(p.division||1)===n).reduce((v,p)=>v+p.precio*p.cantidad,0)
 const pagadoDivision=(sv,n)=>sv.pagos.filter(p=>Array.isArray(p.divisiones)&&p.divisiones.includes(n)).reduce((v,p)=>v+(p.partes?.[n]||0),0)
 const divisionesCobro=actual?Array.from({length:actual.divisiones},(_,i)=>i+1):[]
 const montoSeleccionado=actual?seleccionDiv.reduce((v,n)=>v+Math.max(0,subtotalDivision(actual,n)-pagadoDivision(actual,n)),0):0
 function pagarDivision(){
  if(!administrador||!actual||actual.cerrado||!seleccionDiv.length)return
  if(actual.pagos.some(p=>!p.divisiones)){window.alert('Esta cuenta ya tiene abonos generales anteriores. Usa un abono por monto para evitar contabilizar dos veces.');return}
  const partes=Object.fromEntries(seleccionDiv.map(n=>[n,Math.round(Math.max(0,subtotalDivision(actual,n)-pagadoDivision(actual,n))*100)/100]));const importe=Object.values(partes).reduce((a,b)=>a+b,0)
  if(importe<=0||importe>saldo+.001){window.alert('El importe seleccionado no es válido.');return}
  editar(servicioId,x=>({...x,pagos:[...x.pagos,{id:id(),monto:importe,metodo,fecha:hora(),autor:usuario,divisiones:[...seleccionDiv],partes}]}),`Cobró divisiones ${seleccionDiv.join(', ')} · ${pesos(importe)} · ${ubicacion(actual)}`)
  setSeleccionDiv([])
 }
 function terminarArea(c,a){const s=db.servicios[c.servicioId];if(!s)return;actualizarComanda(s.id,c.id,items=>items.map(p=>{
  if(p.estado==='cancelado')return p
  if(a==='gorditas'&&p.estado==='pendiente'&&p.ruta==='huarache')return {...p,estado:'dorado'}
  if(a==='gorditas'&&p.estado==='pendiente'&&p.ruta==='gorditas')return {...p,estado:'listo'}
  if(a==='sopes'&&((p.ruta==='sopes'&&p.estado==='pendiente')||(p.ruta==='huarache'&&p.estado==='dorado')))return {...p,estado:'listo'}
  if(a==='bebidas'&&p.ruta==='bebidas'&&p.estado==='pendiente')return {...p,estado:'listo'}
  return p
 }),`${folioTexto(c.folio)} · trabajo terminado en ${a}`)}
 function pagar(){if(!administrador||!actual||actual.cerrado||!actual.comandas.length)return;const n=Number(monto);if(!Number.isFinite(n)||n<=0||n>saldo+.001){window.alert(`Importe válido hasta ${pesos(saldo)}`);return}editar(servicioId,s=>({...s,pagos:[...s.pagos,{id:id(),monto:n,metodo,fecha:hora(),autor:usuario}]}),`Pago de ${pesos(n)} · ${metodo}`);setMonto('')}
 function cerrarCuenta(){if(!administrador||!actual||actual.cerrado)return;if(saldo>.001||!terminado(actual)||(actual.tipo==='llevar'&&!actual.entregado)){window.alert('Debe estar pagada, preparada y entregada si es para llevar.');return}editar(servicioId,s=>({...s,cerrado:true}),`Cuenta cerrada · ${ubicacion(actual)}`)}
 function cerrarJornada(){if(!administrador)return;if(activos.some(s=>s.comandas.length||s.borrador.length)){window.alert('Hay cuentas o pedidos abiertos. Resuélvelos antes de cerrar.');return}if(!confirmarDia){setConfirmarDia(true);return}const clave=window.prompt('Clave DEMO de cambio de jornada (escribe CERRAR):');if(clave!=='CERRAR')return;actualizar(d=>registrar({...d,fecha:new Date().toLocaleDateString('es-MX'),jornadas:[...d.jornadas,{fecha:d.fecha,cierre:hora(),ventas:servicios.filter(s=>s.cerrado).reduce((n,s)=>n+abonado(s),0)}]},`Jornada ${db.fecha} cerrada`));setConfirmarDia(false)}
 function moverEnCola(){if(!administrador)return;const colaActual=cola(ordenArea);const index=colaActual.findIndex(c=>c.id===ordenFolio);const dest=Number(ordenPos)-1;if(index<2||dest<2||dest>=colaActual.length||!Number.isInteger(dest))return;const nueva=[...colaActual.map(c=>c.id)];const [movida]=nueva.splice(index,1);nueva.splice(dest,0,movida);actualizar(d=>registrar({...d,orden:{...d.orden,[ordenArea]:nueva}},`Reordenó ${ordenArea}: ${folioTexto(colaActual[index].folio)} a posición ${dest+1}`))}
 const [ordenArea,setOrdenArea]=useState('gorditas')
 useEffect(()=>{if(!['gorditas','sopes'].includes(vista))return;const f=e=>{if(e.key!=='F9'||['INPUT','SELECT','TEXTAREA'].includes(document.activeElement?.tagName))return;const c=visiblesArea(vista)[0];if(c){e.preventDefault();terminarArea(c,vista)}};window.addEventListener('keydown',f);return()=>window.removeEventListener('keydown',f)})
 const tipoCantidad=['Tortilla','Vaso de plástico','Gorda sin comida'].includes(tipo)
 const cocinaRender=(a)=>{const lista=visiblesArea(a);return <section className="tarjeta cocina"><div className="tituloFila"><div><h2>{a==='gorditas'?'Gorditas · elaboración de huaraches':a==='sopes'?'Sopes · dorado de huaraches':'Bebidas y Menudo · tus pedidos'}</h2><p className="suave">Dos comandas como máximo. Una nueva aparece cuando se completa una de ellas.</p></div><span className="contador">{cola(a).length} pendientes</span></div><div className="rejilla-pedidos soloDos">{lista.map(c=>{const s=db.servicios[c.servicioId],ids=c.items.filter(p=>a==='gorditas'?p.estado==='pendiente'&&['gorditas','huarache'].includes(p.ruta):a==='sopes'?((p.ruta==='sopes'&&p.estado==='pendiente')||(p.ruta==='huarache'&&p.estado==='dorado')):p.ruta==='bebidas'&&p.estado==='pendiente').map(p=>p.id);return <article className="ticket comandaCocina" key={c.id}><strong>{folioTexto(c.folio)} · {ubicacion(s)}</strong>{c.adicional&&<span className="etiquetaPrioridad">Adicional prioritario</span>}<Bloque grande items={c.items} solo={ids}/><button className="principal ancho" onClick={()=>terminarArea(c,a)}>✓ Pedido completo</button></article>})}</div>{!lista.length&&<p className="vacio">Sin comandas pendientes.</p>}<p className="suave">Tecla F9: confirma la primera comanda visible (simula pedal o botón USB).</p></section>}
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
 return <div className="aplicacion"><header className="cabecera"><div><div className="marca">🌮 DOÑA PERA <span>· Prototipo v6</span></div><h1>Comandas y administración</h1><p>Pedidos, producción, empaquetado y cobros</p></div><div className="cabeceraDerecha"><span>Jornada: {db.fecha}</span><small>Demo local · sin sincronización ni seguridad real</small></div></header><main className="contenedor">
 <div className="franja"><label>Simular sesión <select value={usuario} onChange={e=>{const u=db.usuarios.find(x=>x.id===e.target.value);setUsuario(e.target.value);setServicioId('');setEditando(null);setSeleccionDiv([]);setVista(u?.rol==='gorditas'||u?.rol==='sopes'?u.rol:'mesero')}}>{db.usuarios.map(u=><option key={u.id} value={u.id}>{u.nombre} · {u.rol}</option>)}</select></label><span className="ayuda">Las cuentas son demostrativas, sin contraseñas reales.</span></div>
 {!esCocina&&<nav className="pestanas">{[['mesero','Tomar pedidos'],['mis','Mis pedidos'],['seguimiento','Seguimiento'],['llevar','Empaquetado'],['cobros','Cuentas y cobros'],['admin','Administración'],['gorditas','Cocina · Gorditas'],['sopes','Cocina · Sopes'],['bebidas','Bebidas y Menudo']].filter(([v])=>administrador||!['admin','llevar','cobros','gorditas','sopes'].includes(v)).map(([v,t])=><button key={v} className={vista===v?'seleccionado':''} onClick={()=>setVista(v)}>{t}</button>)}</nav>}
 {vista==='mesero'&&!esCocina&&<div className="columnas"><section className="tarjeta"><div className="tituloFila"><h2>Mis mesas</h2>{administrador&&<div className="botonesJuntos"><button onClick={()=>actualizar(d=>({...d,mesasCantidad:d.mesasCantidad+1}))}>+ Mesa {db.mesasCantidad+1}</button><button onClick={()=>{const n=Array.from({length:db.mesasCantidad},(_,i)=>db.mesasCantidad-i).find(n=>!db.mesasInactivas.includes(n)&&!servicios.some(x=>x.tipo==='mesa'&&x.numero===n&&!x.cerrado));if(n)actualizar(d=>({...d,mesasInactivas:[...d.mesasInactivas,n]}))}}>− Mesa</button></div>}</div><div className="rejilla-mesas">{Array.from({length:db.mesasCantidad},(_,i)=>i+1).filter(n=>!db.mesasInactivas.includes(n)).map(n=>{const s=servicios.find(x=>x.tipo==='mesa'&&x.numero===n&&!x.cerrado),ocupada=Boolean(s),bloqueo=ocupada&&!administrador&&s.responsable!==usuario;return <button key={n} className={`boton-mesa ${servicioId===s?.id?'activo':''}`} disabled={bloqueo} onClick={()=>abrirMesa(n)}>Mesa {n}<small>{bloqueo?'Otro mesero':ocupada?'En servicio':'Libre'}</small></button>})}</div>{administrador&&db.mesasInactivas.length>0&&<div className="chips"><span>Reactivar:</span>{db.mesasInactivas.map(n=><button key={n} onClick={()=>actualizar(d=>({...d,mesasInactivas:d.mesasInactivas.filter(x=>x!==n)}))}>Mesa {n}</button>)}</div>}<button className="principal ancho" onClick={nuevoParaLlevar}>+ Pedido para llevar</button><h3>Mis pedidos para llevar</h3>{accesibles.filter(s=>s.tipo==='llevar').map(s=><button key={s.id} className="listaSeleccion" onClick={()=>{setServicioId(s.id);setDivision(1)}}>{s.nombre} · {s.comandas.map(c=>folioTexto(c.folio)).join(', ')||'Sin enviar'}</button>)}{actual&&permiso&&<><h3>Divisiones</h3><div className="chips">{Array.from({length:actual.divisiones},(_,i)=>i+1).map(n=><button className={division===n?'activo':''} onClick={()=>setDivision(n)} key={n}>{n}.</button>)}<button onClick={agregarDivision}>+ Número</button></div></>}</section>
 <section className="tarjeta menuCaptura"><h2>Menú</h2>{actual&&permiso&&!actual.cerrado?<><p className="suave">{ubicacion(actual)} · División {division}.</p>
 <div className="opciones"><strong>Productos</strong><div className="botonera categoriasMenu">{['Gorditas','Huaraches','Sopes','Menudo','Bebidas','Plato de comida','Tortilla','Gorda sin comida','Vaso de plástico'].map(cat=><button key={cat} className={categoria===cat?'activo':''} onClick={()=>{setCategoria(cat);setExtras([]);setGuiso2('');setCantidad('1');setDorado('Normal');setGrasa('Normal');setTipo(({Gorditas:'Gordita',Huaraches:'Huarache',Sopes:'Sope',Menudo:'Menudo',Bebidas:'Agua','Plato de comida':'Plato de comida',Tortilla:'Tortilla','Gorda sin comida':'Gorda sin comida','Vaso de plástico':'Vaso de plástico'})[cat])}}>{cat}</button>)}</div></div>
 {categoria==='Sopes'&&<div className="opciones"><strong>Tamaño de sope</strong><div className="botonera">{['Sope','Sope chico'].map(t=><button key={t} className={tipo===t?'activo':''} onClick={()=>setTipo(t)}>{t==='Sope'?'Normal':'Chico'}</button>)}</div></div>}
 {categoria==='Bebidas'&&<div className="opciones"><strong>Tipo de bebida</strong><div className="botonera">{['Agua','Café','Refresco'].map(t=><button key={t} className={tipo===t?'activo':''} onClick={()=>setTipo(t)}>{t==='Agua'?'Agua':t==='Café'?'Café':'Refrescos'}</button>)}</div></div>}
 {llevaGuiso&&<div className="opciones"><strong>Guisos {tipo==='Plato de comida'?'· máximo dos':'· selecciona uno'}</strong><div className="botonera guisosMenu">{GUISOS.map(g=><button key={g} className={guiso===g||guiso2===g?'activo':''} onClick={()=>{if(tipo==='Plato de comida'){if(g===guiso){setGuiso(guiso2||'');setGuiso2('')}else if(g===guiso2)setGuiso2('');else if(!guiso)setGuiso(g);else if(!guiso2)setGuiso2(g);else{setGuiso(g);setGuiso2('')}}else{setGuiso(g);setGuiso2('')}}}>{g}</button>)}</div></div>}
 {llevaGuiso&&tipo!=='Plato de comida'&&<div className="opciones"><strong>Complementos (sin costo)</strong><div className="botonera">{complementos.map(x=><button key={x} className={extras.includes(x)?'activo':''} onClick={()=>setExtras(a=>a.includes(x)?a.filter(y=>y!==x):[...a,x])}>{x}</button>)}</div></div>}
 {(tipo.startsWith('Sope')||tipo==='Huarache')&&<><div className="opciones"><strong>Dorado</strong><div className="botonera">{['Normal','Bien dorado','No muy dorado'].map(x=><button key={x} className={dorado===x?'activo':''} onClick={()=>setDorado(x)}>{x}</button>)}</div></div><div className="opciones"><strong>Grasa</strong><div className="botonera">{['Normal','Sin grasa'].map(x=><button key={x} className={grasa===x?'activo':''} onClick={()=>setGrasa(x)}>{x}</button>)}</div></div></>}
 {tipo==='Agua'&&<><div className="opciones"><strong>Sabor</strong><div className="botonera">{['Horchata','Jamaica','Limón'].map(x=><button className={sabor===x?'activo':''} key={x} onClick={()=>setSabor(x)}>{x}</button>)}</div></div><div className="opciones"><strong>Tamaño</strong><div className="botonera">{['½ litro','1 litro'].map(x=><button className={tamanoAgua===x?'activo':''} key={x} onClick={()=>setTamanoAgua(x)}>{x}</button>)}</div></div></>}
 {tipo==='Café'&&<div className="opciones"><strong>Café</strong><div className="botonera">{['Sin crema','Con crema'].map(x=><button key={x} className={cafe===x?'activo':''} onClick={()=>setCafe(x)}>{x}</button>)}</div></div>}
 {tipo==='Refresco'&&<div className="opciones"><strong>Refresco</strong><div className="botonera">{['Coca','Manzanita','Fresca','Fanta'].map(x=><button key={x} className={refresco===x?'activo':''} onClick={()=>setRefresco(x)}>{x}</button>)}</div></div>}
 {tipo==='Menudo'&&<><div className="opciones"><strong>Presentación</strong><div className="botonera">{['Grande','Chico','Mini','Vaso con carne','Vaso sin carne'].map(x=><button className={menudoTam===x?'activo':''} key={x} onClick={()=>setMenudoTam(x)}>{x==='Vaso sin carne'?'Vaso de caldo sin carne':x}</button>)}</div></div>{!menudoTam.startsWith('Vaso')&&<div className="opciones"><strong>Preparación</strong><div className="botonera">{['Con carne','Con carne y pata','Solo pata'].map(x=><button key={x} className={menudoTipo===x?'activo':''} onClick={()=>setMenudoTipo(x)}>{x}</button>)}</div></div>}</>}
 {tipoCantidad&&<div className="opciones"><label>Cantidad</label><input type="number" min="1" step="1" value={cantidad} onChange={e=>setCantidad(e.target.value)}/></div>}
 <div className="menuAccion"><label>Observaciones opcionales<input value={nota} onChange={e=>setNota(e.target.value)} placeholder="Ej. sin cebolla, separado, poco caldo..."/></label><button className="principal" disabled={llevaGuiso&&!guiso} onClick={agregar}>+ Agregar al pedido</button></div>
 </>:<p className="vacio">Selecciona una mesa disponible o crea un pedido para llevar.</p>}</section>
 <section className="tarjeta"><h2>{actual&&permiso?`Cuenta · ${ubicacion(actual)}`:'Comanda'}</h2>{actual&&permiso?<><h3>{editando?`Modificando ${folioTexto(editando.folio)}`:"Por enviar"}</h3><Bloque items={editando?editando.items:actual.borrador} precios/>{(editando?editando.items:actual.borrador).map(p=><div key={p.id} className="miniAccion"><span>{combinado(p)}</span><span><button onClick={()=>editando?cambiarEnEdicion(p.id,-1):cantidadBorrador(p.id,-1)}>−</button> {p.cantidad} <button onClick={()=>editando?cambiarEnEdicion(p.id,1):cantidadBorrador(p.id,1)}>+</button> <button className="peligro" onClick={()=>editando?quitarEnEdicion(p.id):borrarBorrador(p.id)}>Borrar</button></span></div>)}<button className="principal ancho" disabled={editando?!editando.items.length:!actual.borrador.length} onClick={editando?guardarEdicion:enviar}>{editando?"Guardar cambios de comanda":"Enviar comanda"}</button>{editando&&<button onClick={()=>{setEditando(null);setVista("mis")}}>Cancelar edición</button>}<h3>Comandas enviadas</h3>{actual.comandas.map(c=><article key={c.id} className="comanda"><strong>{folioTexto(c.folio)}</strong> <small>· {usuarioNombre(c.creador)}</small><Bloque items={c.items} precios/>{!administrador&&visibleEnCocina(c)&&<p className="suave">En cocina · edición bloqueada</p>}</article>)}<div className="total"><strong>Total</strong><strong>{pesos(total(actual))}</strong></div><div className="total"><span>Abonado</span><b>{pesos(abonado(actual))}</b></div><div className="total"><span>Saldo</span><b>{pesos(saldo)}</b></div></>:<p className="vacio">Selecciona un pedido para continuar.</p>}</section></div>}
 {['gorditas','sopes','bebidas'].includes(vista)&&cocinaRender(vista)}
 {vista==='mis'&&!esCocina&&<section className="tarjeta"><h2>{administrador?'Todas las comandas':'Mis pedidos'}</h2><div className="rejilla-pedidos">{pedidos.map(c=><article key={c.id} className="ticket"><strong>{folioTexto(c.folio)} · {c.ubicacion}</strong><p>Responsable: {usuarioNombre(c.servicio.responsable)}</p><Bloque items={c.items}/><button className="principal" disabled={!editable(c.servicio,c)||Boolean(c.servicio.pagos.length)} onClick={()=>iniciarEdicion(c)}>Modificar pedido</button>{!editable(c.servicio,c)&&<p className="suave">No editable: en cocina o terminada</p>}{Boolean(c.servicio.pagos.length)&&<p className="suave">Cuenta con pagos: edición bloqueada</p>}</article>)}</div></section>}
 {vista==='seguimiento'&&!esCocina&&<section className="tarjeta"><div className="tituloFila"><h2>Seguimiento de pedidos</h2><span className="contador">Promedio real: {promedio?`${promedio} min`:'Recopilando datos'}</span></div><label>Buscar mesa, folio, cliente o responsable</label><input value={buscar} onChange={e=>setBuscar(e.target.value)} placeholder="Ej. Mesa 2, 000004, Daniela"/>{seguimientoGrupos.filter(Boolean).map(u=>{const lista=pedidos.filter(c=>c.servicio.responsable===u.id&&`${folioTexto(c.folio)} ${c.ubicacion} ${u.nombre}`.toLowerCase().includes(buscar.toLowerCase()));return lista.length>0&&<div key={u.id} className="grupoSeguimiento"><h3>{u.nombre}</h3><div className="rejilla-pedidos">{lista.map(c=>{const st=estadoComanda(c);const cola=servicios.flatMap(s=>s.comandas).filter(x=>x.folio<c.folio&&x.items.some(p=>['pendiente','dorado'].includes(p.estado))).length;return <article className={`ticket estado-${st}`} key={c.id}><strong>{folioTexto(c.folio)} · {c.ubicacion}</strong><p>— Responsable: {u.nombre} · {st.toUpperCase()}</p><p>{c.items.filter(p=>p.estado!=='cancelado').length} productos · {cola} comandas anteriores pendientes (aprox.)</p><p className="suave">Espera: {promedio?`aproximadamente ${Math.max(1,Math.round(promedio*(cola+1)*.75))}–${Math.round(promedio*(cola+1)*1.25)+2} min`:'Aún sin datos suficientes'}</p><details><summary>Ver productos</summary>{c.items.map(p=><div className="linea" key={p.id}><span>{p.cantidad} × {combinado(p)} · {estadoItem(p)}</span></div>)}</details></article>})}</div></div>})}</section>}
 {vista==='llevar'&&administrador&&<section className="tarjeta"><h2>Pedidos para llevar · empaquetado</h2><p className="suave">Una verificación por pedido completo. Sin sugerencias de empaque.</p>{activos.filter(s=>s.tipo==='llevar').map(s=><article key={s.id} className="comanda"><h3>{s.nombre} · {s.comandas.map(c=>folioTexto(c.folio)).join(', ')||'Sin enviar'}</h3><span className="contador">{terminado(s)?'Producción lista':'En preparación'}</span><Bloque items={productos(s)}/><button className="principal" disabled={!terminado(s)||s.entregado} onClick={()=>editar(s.id,x=>({...x,entregado:true}),`Pedido para llevar entregado a ${s.nombre}`)}>{s.entregado?'Entregado':'✓ Pedido completo · entregar'}</button><p>Saldo: {pesos(pendiente(s))}</p></article>)}</section>}
 {vista==='cobros'&&administrador&&<section className="tarjeta"><h2>💳 Cuentas y cobros</h2><p className="suave">Cada división paga los productos que consumió. Se conservan abonos y pagos.</p><div className="listaCuentas">{activos.filter(s=>s.comandas.length).map(s=><button key={s.id} className={servicioId===s.id?'activo':''} onClick={()=>{setServicioId(s.id);setSeleccionDiv([])}}>{ubicacion(s)} · Saldo {pesos(pendiente(s))}</button>)}</div>{actual&&!actual.cerrado&&actual.comandas.length>0&&<div className="adminCuenta"><h3>{ubicacion(actual)}</h3><div className="indicadores"><div><small>Total</small><strong>{pesos(total(actual))}</strong></div><div><small>Abonado</small><strong>{pesos(abonado(actual))}</strong></div><div><small>Saldo</small><strong>{pesos(saldo)}</strong></div></div><h3>Detalle por división</h3><div className="cobroDivisiones">{divisionesCobro.map(n=>{const sub=subtotalDivision(actual,n),pag=pagadoDivision(actual,n);return <label key={n} className="cobroDivision"><input type="checkbox" checked={seleccionDiv.includes(n)} disabled={sub-pag<=.001||actual.pagos.some(p=>!p.divisiones)} onChange={e=>setSeleccionDiv(prev=>e.target.checked?[...prev,n]:prev.filter(x=>x!==n))}/><span><strong>{n}. División</strong><small>{pesos(sub)} · Registrado {pesos(pag)} · Restante {pesos(Math.max(0,sub-pag))}</small></span></label>})}</div><div className="fila-final"><strong>Seleccionado: {pesos(montoSeleccionado)}</strong><select value={metodo} onChange={e=>setMetodo(e.target.value)}><option>Efectivo</option><option>Tarjeta</option><option>Transferencia</option></select><button className="principal" disabled={montoSeleccionado<=0||!seleccionDiv.length} onClick={pagarDivision}>Cobrar divisiones seleccionadas</button></div><h3>Abono por monto libre</h3><p className="suave">Úsalo para pagos parciales no asignados a una división. Si ya existen abonos generales, el cobro por división se bloquea para evitar duplicados.</p><div className="fila-final"><input type="number" value={monto} onChange={e=>setMonto(e.target.value)} min="0.01" step="0.01" placeholder="Importe $"/><select value={metodo} onChange={e=>setMetodo(e.target.value)}><option>Efectivo</option><option>Tarjeta</option><option>Transferencia</option></select><button className="principal" disabled={!saldo} onClick={pagar}>Registrar abono</button><button onClick={()=>setMonto(saldo.toFixed(2))}>Saldo completo</button></div><h3>Historial de pagos</h3>{actual.pagos.map(p=><p className="pagoFila" key={p.id}><strong>{pesos(p.monto)}</strong> · {p.metodo} · {p.divisiones?`Divisiones ${p.divisiones.join(', ')}`:'Abono general'} · {p.fecha}</p>)}<div className="separador"/><button className="principal" disabled={saldo>.001||!terminado(actual)||(actual.tipo==='llevar'&&!actual.entregado)} onClick={cerrarCuenta}>Cerrar cuenta</button></div>}</section>}
 {vista==='admin'&&administrador&&<section className="tarjeta"><h2>Administración</h2><div className="indicadores"><div><small>Comandas</small><strong>{servicios.reduce((n,s)=>n+s.comandas.length,0)}</strong></div><div><small>Cuentas abiertas</small><strong>{activos.filter(s=>s.comandas.length).length}</strong></div><div><small>Pagos registrados</small><strong>{pesos(servicios.reduce((n,s)=>n+abonado(s),0))}</strong></div></div><div className="separador"/><h3>Reorganizar comandas pendientes</h3><p className="suave">Las dos comandas visibles no se desplazan.</p><label>Área de cocina</label><select value={ordenArea} onChange={e=>{setOrdenArea(e.target.value);setOrdenFolio('')}}><option value="gorditas">Gorditas</option><option value="sopes">Sopes</option></select><label>Comanda en espera</label><select value={ordenFolio} onChange={e=>setOrdenFolio(e.target.value)}><option value="">Seleccionar</option>{cola(ordenArea).slice(2).map(c=><option key={c.id} value={c.id}>{folioTexto(c.folio)}</option>)}</select><label>Posición en cola</label><input type="number" min="3" max={Math.max(3,cola(ordenArea).length)} value={ordenPos} onChange={e=>setOrdenPos(e.target.value)}/><button onClick={moverEnCola}>Mover comanda</button><div className="separador"/><h3>Quitar «Listo» de cocina</h3><p className="suave">Solo el administrador puede corregir una comanda marcada como lista por error. Regresa al área que corresponde, sin modificar sus pagos.</p><input value={buscarListos} onChange={e=>setBuscarListos(e.target.value)} placeholder="Buscar mesa, folio o mesero..."/>{servicios.filter(s=>!s.cerrado).flatMap(s=>s.comandas.filter(c=>c.items.some(p=>p.estado==='listo')).map(c=>({s,c}))).filter(({s,c})=>`${ubicacion(s)} ${folioTexto(c.folio)} ${usuarioNombre(s.responsable)}`.toLowerCase().includes(buscarListos.toLowerCase())).map(({s,c})=><div className="linea reapertura" key={c.id}><span><strong>{ubicacion(s)} · {folioTexto(c.folio)}</strong><small> · {usuarioNombre(s.responsable)}</small><Bloque items={c.items.filter(p=>p.estado==='listo')}/></span><div className="botonesJuntos">{['gorditas','sopes','bebidas'].filter(a=>c.items.some(p=>p.estado==='listo'&&(a==='gorditas'?p.ruta==='gorditas':a==='sopes'?['sopes','huarache'].includes(p.ruta):p.ruta==='bebidas'))).map(a=><button className="ligero" key={a} onClick={()=>revertirListo(s.id,c.id,a)}>Quitar listo · {a==='bebidas'?'Bebidas y Menudo':a}</button>)}</div></div>)}<div className="separador"/><h3>Reabrir cuentas cerradas por mesa</h3><p className="suave">Reabre una cuenta conservando sus folios, productos, pagos y abonos. No regresa a cocina.</p>{cerradas.length===0&&<p className="vacio">No hay cuentas cerradas.</p>}{cerradas.map(s=><div className="linea reapertura" key={s.id}><span><strong>{ubicacion(s)}</strong> · {s.comandas.map(c=>folioTexto(c.folio)).join(', ')} · Total {pesos(total(s))} · Pagado {pesos(abonado(s))}</span><button className="ligero" onClick={()=>reabrirCuenta(s.id)}>Reabrir cuenta</button></div>)}<div className="separador"/><h3>Movimientos recientes</h3><input value={buscarMov} onChange={e=>setBuscarMov(e.target.value)} placeholder="Buscar folio, mesero o movimiento..."/>{db.auditoria.filter(a=>`${a.mensaje} ${usuarioNombre(a.autor)}`.toLowerCase().includes(buscarMov.toLowerCase())).slice(-80).reverse().map(a=><div className="historial" key={a.id}>{a.mensaje}<small>{a.fecha} · {usuarioNombre(a.autor)}</small></div>)}<div className="separador"/><h3>Jornada {db.fecha}</h3><p className="suave">No puede cerrarse mientras haya cuentas pendientes. Protección de contraseña real pendiente del backend.</p><button className="peligro" onClick={cerrarJornada}>{confirmarDia?'Confirmar cambio de jornada':'Cerrar jornada'}</button><div className="separador"/></section>}
 <footer className="pie">DEMO local: datos solo en este navegador. Usuarios sin contraseña y permisos de interfaz no seguros. No utilizar para ventas reales hasta implementar servidor, autenticación y sincronización.</footer></main></div>
}
export default App
