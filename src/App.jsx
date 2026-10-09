import { useState, useEffect } from 'react'
import { GUISOS, TIPOS, pesos, folioTexto, hora, id, prepararProducto } from './catalogo'
import './App.css'

const KEY = 'dona-pera-demo-v3'
const nuevoServicio = (tipo='mesa', nombre='', responsable='mesero1') => ({id:id(),tipo,nombre, responsable, divisiones:1,borrador:[],comandas:[],pagos:[],entregado:false,cerrado:false,creado:hora()})
const inicial = () => ({version:3,fecha:new Date().toLocaleDateString('es-MX'),jornadas:[],mesasCantidad:12,servicios:{},siguienteFolio:1,usuarios:[{id:'mesero1',nombre:'Mesero 1',rol:'mesero'},{id:'mesero2',nombre:'Mesero 2',rol:'mesero'},{id:'mesero3',nombre:'Mesero 3',rol:'mesero'},{id:'admin',nombre:'Administrador',rol:'admin'}],auditoria:[]})
function cargar() {try {const d=JSON.parse(localStorage.getItem(KEY));return d?.version===3 ? d : inicial()} catch {return inicial()}}
const todosItems = s => s.comandas.flatMap(c=>c.items)
const total = s => todosItems(s).filter(p=>p.estado!=='cancelado').reduce((a,p)=>a+p.precio*p.cantidad,0)
const abonado = s => s.pagos.reduce((a,p)=>a+p.monto,0)
const pendiente = s => Math.max(0,total(s)-abonado(s))
const terminada = s => s.comandas.length>0 && todosItems(s).filter(x=>x.estado!=='cancelado').every(x=>['listo','atendido'].includes(x.estado))
const partes = s => s.tipo==='llevar' ? `Para llevar · ${s.nombre}` : `Mesa ${s.numero}`
const estadoItem = p => ({pendiente:'Pendiente',dorado:'Pendiente de dorar',listo:'Listo',atendido:'Atiende mesero',cancelado:'Cancelado'})[p.estado] || p.estado
const hoy = () => new Date().toISOString()

function App() {
  const [db,setDb] = useState(cargar)
  const [usuario,setUsuario] = useState('mesero1')
  const [vista,setVista] = useState('mesero')
  const [servicioId,setServicioId] = useState('mesa-1')
  const [division,setDivision] = useState(1)
  const [tipo,setTipo] = useState('Gordita')
  const [guiso,setGuiso] = useState('Frijoles')
  const [guiso2,setGuiso2] = useState('')
  const [extras,setExtras] = useState([])
  const [dorado,setDorado] = useState('Normal')
  const [grasa,setGrasa] = useState('Normal')
  const [nota,setNota] = useState('')
  const [sabor,setSabor] = useState('Horchata')
  const [tamanoAgua,setTamanoAgua] = useState('½ litro')
  const [cafe,setCafe] = useState('Sin crema')
  const [menudoTam,setMenudoTam] = useState('Grande')
  const [menudoTipo,setMenudoTipo] = useState('Con carne')
  const [refresco,setRefresco] = useState('Coca')
  const [area,setArea] = useState('gorditas')
  const [grande,setGrande] = useState(false)
  const [pagina,setPagina] = useState(0)
  const [textoBuscar,setTextoBuscar] = useState('')
  const [importePago,setImportePago] = useState('')
  const [metodo,setMetodo] = useState('Efectivo')
  const [confirmarCierre,setConfirmarCierre] = useState(false)
  const rol=db.usuarios.find(u=>u.id===usuario)?.rol || 'mesero'
  const nombreUsuario=db.usuarios.find(u=>u.id===usuario)?.nombre || usuario
  const administrador=rol==='admin'

  useEffect(()=>{try{localStorage.setItem(KEY,JSON.stringify(db))}catch{console.warn('No se pudo guardar la demostración local')}},[db])
  const actualizar=(fn)=>setDb(d=>fn(d))
  const registrar=(d,mensaje,autor=usuario)=>({...d,auditoria:[...d.auditoria,{id:id(),fecha:hora(),autor,mensaje}]})
  const editar=(clave,fn,mensaje)=>actualizar(d=>{
    const anterior=d.servicios[clave];if(!anterior)return d
    const nuevo={...d,servicios:{...d.servicios,[clave]:fn(anterior)}}
    return mensaje?registrar(nuevo,mensaje):nuevo
  })
  const servicios=Object.values(db.servicios)
  const activos=servicios.filter(s=>!s.cerrado)
  const visibles=activos.filter(s=>administrador||s.responsable===usuario)
  const actual=db.servicios[servicioId]
  const permiso=actual&&(administrador||actual.responsable===usuario)
  
  const tareas = servicios
    .flatMap(s =>
      s.comandas.flatMap(c =>
        c.items
          .filter(p =>
            p.estado !== 'cancelado' &&
            (
              (area === 'gorditas' &&
                (p.ruta === 'gorditas' || p.ruta === 'huarache') &&
                p.estado === 'pendiente') ||
              (area === 'sopes' &&
                (
                  (p.ruta === 'sopes' && p.estado === 'pendiente') ||
                  (p.ruta === 'huarache' && p.estado === 'dorado')
                ))
            )
          )
          .map(p => ({
            ...p,
            servicioId: s.id,
            folio: c.folio,
            ubicacion: partes(s),
            responsable: c.creador,
            fecha: c.fecha,
            comandaId: c.id
          }))
      )
    )
    .sort((a, b) =>
      Number(b.prioritario) - Number(a.prioritario) ||
      a.folio - b.folio
    )

  const tareasMostradas=grande?tareas.slice(pagina*2,pagina*2+2):tareas
  const pedidosPropios=servicios.flatMap(s=>s.comandas.filter(c=>administrador||c.creador===usuario||s.responsable===usuario).map(c=>({...c,ubicacion:partes(s),servicio:s}))).sort((a,b)=>b.folio-a.folio)
  const itemsFinalizados=servicios.flatMap(s=>s.comandas.flatMap(c=>c.items.filter(p=>p.estado==='listo').map(p=>({...p,servicioId:s.id,folio:c.folio,ubicacion:partes(s)}))))
  const tiempos=servicios.flatMap(s=>s.comandas.filter(c=>c.completadoEn).map(c=>(new Date(c.completadoEn)-new Date(c.enviadoEn))/60000)).filter(x=>Number.isFinite(x)&&x>=0)
  const promedio=tiempos.length?Math.max(1,Math.round(tiempos.reduce((a,b)=>a+b,0)/tiempos.length)):null
  const restantes=actual?pendiente(actual):0
  const opcionesExtras=tipo==='Gordita'?['Con queso','Con frijoles','Con arroz']:tipo.startsWith('Sope')?['Con verdura','Con todo','Con queso y crema','Con cebolla','Con cilantro','Con frijoles','Con arroz']:['Con queso','Sin queso','Con frijoles','Con arroz']
  const usaGuisos=['Gordita','Sope grande','Sope chico','Huarache','Plato de comida'].includes(tipo)

  function abrirMesa(n){const clave=`mesa-${n}`;actualizar(d=> d.servicios[clave]?d:{...d,servicios:{...d.servicios,[clave]:{...nuevoServicio('mesa','',usuario),id:clave,numero:n}}});setServicioId(clave);setDivision(1)}
  function nuevoParaLlevar(){const nombre=window.prompt('Nombre del cliente para llevar:');if(!nombre?.trim())return;const s=nuevoServicio('llevar',nombre.trim(),usuario);actualizar(d=>({...d,servicios:{...d.servicios,[s.id]:s}}));setServicioId(s.id);setDivision(1);setVista('mesero')}
  function agregarDivision(){if(!permiso)return;const n=actual.divisiones+1;editar(servicioId,s=>({...s,divisiones:n}));setDivision(n)}
  function agregar(){if(!permiso||actual.cerrado)return;const p=prepararProducto({tipo,guiso,guiso2,extras,dorado,grasa,nota,sabor,tamanoAgua,cafe,menudoTam,menudoTipo,refresco});editar(servicioId,s=>({...s,borrador:[...s.borrador,{...p,id:id(),division,cantidad:1}]}));setNota('')}
  function cambiarBorrador(itemId,delta){editar(servicioId,s=>({...s,borrador:s.borrador.map(p=>p.id===itemId?{...p,cantidad:p.cantidad+delta}:p).filter(p=>p.cantidad>0)}))}
  function enviar(){if(!permiso||!actual.borrador.length||actual.cerrado)return;actualizar(d=>{const s=d.servicios[servicioId],folio=d.siguienteFolio,adicional=s.comandas.length>0,fecha=hora(),enviadoEn=hoy();const items=s.borrador.map(p=>({...p,estado:p.ruta==='mesero'?'atendido':'pendiente',prioritario:adicional}));const comanda={id:id(),folio,fecha,enviadoEn,creador:usuario,adicional,items};const mod={...d,siguienteFolio:folio+1,servicios:{...d.servicios,[servicioId]:{...s,comandas:[...s.comandas,comanda],borrador:[]}}};return registrar(mod,`${folioTexto(folio)} enviada · ${partes(s)}${adicional?' · adicional prioritario':''}`)})}
  function cambiarItem(servicio,folio,itemId,estado,razon=''){actualizar(d=>{const s=d.servicios[servicio];if(!s)return d;const cs=s.comandas.map(c=>{if(c.folio!==folio)return c;const items=c.items.map(p=>p.id===itemId?{...p,estado}:p);const completo=items.filter(p=>p.estado!=='cancelado').every(p=>['listo','atendido'].includes(p.estado));return {...c,items,completadoEn:completo?(c.completadoEn||hoy()):null}});return registrar({...d,servicios:{...d.servicios,[servicio]:{...s,comandas:cs}}},`${folioTexto(folio)} · ${estado} · ${razon||'Actualización de producción'}`)})}
  function finalizar(p){cambiarItem(p.servicioId,p.folio,p.id,p.ruta==='huarache'&&p.estado==='pendiente'?'dorado':'listo',`Área ${area}`)}
  function cancelar(c,p){if(!permiso||actual.cerrado||['listo','atendido','cancelado'].includes(p.estado))return;const motivo=window.prompt('Motivo obligatorio de cancelación:');if(!motivo?.trim())return;cambiarItem(servicioId,c.folio,p.id,'cancelado',`Cancelación por ${nombreUsuario}: ${motivo.trim()}`)}
  function editarCantidad(c,p,delta){if(!permiso||actual.cerrado||['listo','atendido','cancelado'].includes(p.estado))return;if(!administrador&&p.estado!=='pendiente')return;const nueva=p.cantidad+delta;if(nueva<1){window.alert('Para quitar el producto usa Cancelar con motivo.');return}const motivo=window.prompt('Motivo de modificación:');if(!motivo?.trim())return;editar(servicioId,s=>({...s,comandas:s.comandas.map(x=>x.folio===c.folio?{...x,items:x.items.map(y=>y.id===p.id?{...y,cantidad:nueva}:y)}:x)}),`Cambio #${c.folio} · ${p.nombre} · ${p.cantidad} → ${nueva}; ${motivo.trim()}`)}
  function pagar(){if(!administrador||!actual||actual.comandas.length===0||actual.cerrado)return;const monto=Number(importePago);if(!Number.isFinite(monto)||monto<=0||monto>restantes+0.001){window.alert(`Ingresa un importe entre $0.01 y ${pesos(restantes)}.`);return}editar(servicioId,s=>({...s,pagos:[...s.pagos,{id:id(),monto,metodo,fecha:hora(),autor:usuario}]}),`Pago ${pesos(monto)} · ${metodo} · ${partes(actual)}`);setImportePago('')}
  function cerrarMesa(){if(!administrador||!actual||actual.cerrado)return;if(pendiente(actual)>0.001){window.alert('No se puede cerrar una cuenta con saldo pendiente.');return}if(!terminada(actual)){window.alert('Todavía hay productos sin terminar.');return}if(actual.tipo==='llevar'&&!actual.entregado){window.alert('Primero confirma la entrega del pedido para llevar.');return}if(!window.confirm('¿Cerrar definitivamente esta cuenta?'))return;editar(servicioId,s=>({...s,cerrado:true}),`Cuenta cerrada · ${partes(actual)}`)}
  function cambiarDia(){if(!administrador)return;const abiertas=activos.filter(s=>s.comandas.length>0||s.borrador.length>0);if(abiertas.length){window.alert(`Hay ${abiertas.length} cuentas o pedidos abiertos. Deben resolverse antes del cierre de jornada.`);return}if(!confirmarCierre){setConfirmarCierre(true);return}const clave=window.prompt('Escribe CERRAR JORNADA para confirmar (demostración; no es contraseña real):');if(clave!=='CERRAR JORNADA')return;actualizar(d=>registrar({...d,fecha:new Date().toLocaleDateString('es-MX'),jornadas:[...d.jornadas,{fecha:d.fecha,cierre:hora(),ventas:servicios.filter(s=>s.cerrado).reduce((a,s)=>a+abonado(s),0)}]},`Jornada ${db.fecha} cerrada`));setConfirmarCierre(false)}
  function mostrar(s){setServicioId(s.id);setDivision(1);setVista('mesero')}
  const bloqueGrupo=(items)=>Object.entries(Object.groupBy(items,p=>p.division)).sort((a,b)=>Number(a[0])-Number(b[0])).map(([n,ps])=><div className="grupo" key={n}><strong className="numeroGrupo">{n}.</strong>{ps.map(p=><div key={p.id} className="renglon"><span>{p.cantidad} × {p.nombre}{p.detalle&&<small>{p.detalle}</small>}</span><b>{pesos(p.precio*p.cantidad)}</b></div>)}</div>)
  return <div className="aplicacion">
    <header className="cabecera"><div><div className="marca">🌮 DOÑA PERA <span>· Prototipo v3</span></div><h1>Comandas y administración</h1><p>Pedidos, producción, empaquetado y cobros</p></div><div className="cabeceraDerecha"><span>Jornada: {db.fecha}</span><small>Demo local · sin usuarios reales ni sincronización</small></div></header>
    <main className="contenedor">
      <div className="franja"><label>Simular sesión <select value={usuario} onChange={e=>{setUsuario(e.target.value);setServicioId('');setVista('mesero')}}>{db.usuarios.map(u=><option key={u.id} value={u.id}>{u.nombre} · {u.rol}</option>)}</select></label><span className="ayuda">La selección de usuario es solo para probar la interfaz. Aún no existe control de acceso seguro.</span></div>
      <nav className="pestanas">{[['mesero','Tomar pedidos'],['mis','Mis pedidos'],['seguimiento','Seguimiento'],['gorditas','Cocina · Gorditas'],['sopes','Cocina · Sopes'],['admin','Administración'],['llevar','Para llevar']].filter(([v])=>administrador||!['admin','llevar'].includes(v)).map(([clave,nombre])=><button key={clave} className={(clave==='gorditas'||clave==='sopes'?vista==='cocina'&&area===clave:vista===clave)?'seleccionado':''} onClick={()=>{if(['gorditas','sopes'].includes(clave)){setArea(clave);setVista('cocina');setPagina(0)}else setVista(clave)}}>{nombre}</button>)}</nav>
      {vista==='mesero'&&<div className="columnas">
        <section className="tarjeta"><div className="tituloFila"><h2>Mis mesas</h2>{administrador&&<button className="ligero" onClick={()=>actualizar(d=>({...d,mesasCantidad:d.mesasCantidad+1}))}>+ Mesa</button>}</div><div className="rejilla-mesas">{Array.from({length:db.mesasCantidad},(_,i)=>i+1).map(n=>{const s=db.servicios[`mesa-${n}`];const bloqueado=s&&!s.cerrado&&!administrador&&s.responsable!==usuario;return <button key={n} disabled={bloqueado} className={`boton-mesa ${servicioId===`mesa-${n}`?'activo':''}`} onClick={()=>abrirMesa(n)}>Mesa {n}<small>{s&&!s.cerrado?(bloqueado?'Otro mesero':'En servicio'):'Libre'}</small></button>})}</div><button className="principal ancho" onClick={nuevoParaLlevar}>+ Pedido para llevar</button><div className="separador"/><h3>Mis pedidos para llevar</h3>{visibles.filter(s=>s.tipo==='llevar').map(s=><button className="listaSeleccion" key={s.id} onClick={()=>mostrar(s)}>{s.nombre} · {s.comandas.map(c=>folioTexto(c.folio)).join(', ')||'Sin enviar'}</button>)}<p className="suave">Las mesas de otros meseros no pueden editarse.</p>{actual&&permiso&&<><div className="separador"/><div className="tituloFila"><h3>Divisiones del pedido</h3><button className="ligero" onClick={agregarDivision}>+ Número</button></div><div className="chips">{Array.from({length:actual.divisiones},(_,i)=>i+1).map(n=><button key={n} className={division===n?'activo':''} onClick={()=>setDivision(n)}>{n}.</button>)}</div></>}</section>
        <section className="tarjeta"><h2>Menú</h2>{actual&&permiso&&!actual.cerrado?<><p className="suave">{partes(actual)} · división {division}.</p><div className="chips tipos">{TIPOS.map(t=><button key={t} className={tipo===t?'activo':''} onClick={()=>{setTipo(t);setExtras([]);setGuiso2('');setNota('');setDorado('Normal');setGrasa('Normal')}}>{t}</button>)}</div>{usaGuisos&&<><label>Guiso</label><select value={guiso} onChange={e=>setGuiso(e.target.value)}>{GUISOS.map(g=><option key={g}>{g}</option>)}</select>{['Huarache','Plato de comida'].includes(tipo)&&<><label>Segundo guiso (opcional)</label><select value={guiso2} onChange={e=>setGuiso2(e.target.value)}><option value="">Solo uno</option>{GUISOS.filter(g=>g!==guiso).map(g=><option key={g}>{g}</option>)}</select></>}<label>Complementos (sin costo)</label><div className="checks">{opcionesExtras.map(x=><label key={x}><input type="checkbox" checked={extras.includes(x)} onChange={()=>setExtras(v=>v.includes(x)?v.filter(z=>z!==x):[...v,x])}/>{x}</label>)}</div>{(tipo.startsWith('Sope')||tipo==='Huarache')&&<><label>Dorado</label><select value={dorado} onChange={e=>setDorado(e.target.value)}>{['Normal','Bien dorado','No muy dorado'].map(x=><option key={x}>{x}</option>)}</select><label>Grasa</label><select value={grasa} onChange={e=>setGrasa(e.target.value)}><option>Normal</option><option>Sin grasa</option></select></>}</>}
        {tipo==='Agua'&&<><label>Sabor</label><select value={sabor} onChange={e=>setSabor(e.target.value)}>{['Horchata','Jamaica','Limón'].map(x=><option key={x}>{x}</option>)}</select><label>Presentación</label><select value={tamanoAgua} onChange={e=>setTamanoAgua(e.target.value)}><option>½ litro</option><option>1 litro</option></select></>}
        {tipo==='Café'&&<><label>Presentación</label><select value={cafe} onChange={e=>setCafe(e.target.value)}><option>Sin crema</option><option>Con crema</option></select></>}
        {tipo==='Refresco'&&<><label>Refresco</label><select value={refresco} onChange={e=>setRefresco(e.target.value)}>{['Coca','Manzanita','Fresca','Fanta'].map(x=><option key={x}>{x}</option>)}</select></>}
        {tipo==='Menudo'&&<><label>Presentación</label><select value={menudoTam} onChange={e=>setMenudoTam(e.target.value)}>{['Grande','Chico','Mini','Vaso con carne','Vaso sin carne'].map(x=><option key={x}>{x}</option>)}</select>{!menudoTam.startsWith('Vaso')&&<><label>Opción</label><select value={menudoTipo} onChange={e=>setMenudoTipo(e.target.value)}>{['Con carne','Con carne y pata','Solo pata'].map(x=><option key={x}>{x}</option>)}</select></>}</>}
        <label>Observaciones opcionales</label><input value={nota} onChange={e=>setNota(e.target.value)} placeholder="Ej. Sin cebolla"/><div className="fila-final"><strong>{pesos(prepararProducto({tipo,guiso,guiso2,extras,dorado,grasa,nota,sabor,tamanoAgua,cafe,menudoTam,menudoTipo,refresco}).precio)}</strong><button className="principal" onClick={agregar}>+ Agregar</button></div></>:<p className="vacio">Selecciona una mesa libre, asignada a ti, o crea un pedido para llevar.</p>}</section>
        <section className="tarjeta"><h2>{actual&&permiso?`Cuenta · ${partes(actual)}`:'Comanda'}</h2>{actual&&permiso?<><h3>Por enviar</h3>{actual.borrador.length===0&&<p className="vacio">Sin productos en borrador.</p>}{bloqueGrupo(actual.borrador)}{actual.borrador.map(p=><div className="miniAccion" key={p.id}><span>{p.nombre}</span><span><button onClick={()=>cambiarBorrador(p.id,-1)}>−</button> {p.cantidad} <button onClick={()=>cambiarBorrador(p.id,1)}>+</button></span></div>)}<button className="principal ancho" disabled={!actual.borrador.length||actual.cerrado} onClick={enviar}>Enviar comanda</button><div className="separador"/><h3>Comandas enviadas</h3>{actual.comandas.map(c=><div className="comanda" key={c.id}><div className="tituloFila"><strong>{folioTexto(c.folio)}</strong>{c.adicional&&<span className="etiquetaPrioridad">Adicional prioritario</span>}</div><small>Registró: {db.usuarios.find(u=>u.id===c.creador)?.nombre}</small>{bloqueGrupo(c.items.filter(p=>p.estado!=='cancelado'))}{c.items.filter(p=>p.estado!=='cancelado').map(p=><div className="miniAccion" key={p.id}><small>{estadoItem(p)}</small>{!actual.cerrado&&!['listo','atendido'].includes(p.estado)&&<span><button onClick={()=>editarCantidad(c,p,-1)}>−</button><button onClick={()=>editarCantidad(c,p,1)}>+</button><button className="peligro" onClick={()=>cancelar(c,p)}>Cancelar</button></span>}</div>)}</div>)}<div className="total"><span>Total</span><strong>{pesos(total(actual))}</strong></div><div className="total"><span>Abonado</span><b>{pesos(abonado(actual))}</b></div><div className="total"><span>Saldo</span><b>{pesos(restantes)}</b></div></>:<p className="vacio">Selecciona un pedido para continuar.</p>}</section>
      </div>}
      {vista==='cocina'&&<section className={`tarjeta ${grande?'modoGrande':''}`}><div className="tituloFila"><div><h2>{area==='gorditas'?'Gorditas · elaboración de huaraches':'Sopes · dorado de huaraches'}</h2><p className="suave">Prioridad a pedidos adicionales pendientes. Preparación sin botón de recepción.</p></div><div className="botonesJuntos"><span className="contador">{tareas.length} productos pendientes</span><button className="ligero" onClick={()=>{setGrande(x=>!x);setPagina(0)}}>{grande?'Vista normal':'Letras grandes · 2'}</button></div></div><div className="rejilla-pedidos">{tareasMostradas.map((p,index)=><article className={`ticket ${index===0&&grande?'siguiente':''}`} key={p.id}>{p.prioritario&&<span className="etiquetaPrioridad">⚡ Adicional prioritario</span>}<small>{folioTexto(p.folio)} · {p.ubicacion} · División {p.division}.</small><h3>{p.cantidad} × {p.nombre}</h3>{p.detalle&&<p>{p.detalle}</p>}<button className="principal ancho" onClick={()=>finalizar(p)}>{p.ruta==='huarache'&&p.estado==='pendiente'?'✓ Elaborado · a Sopes':'✓ Listo'}</button></article>)}</div>{tareas.length===0&&<p className="vacio">No hay pedidos en espera.</p>}{grande&&<div className="paginacion"><button disabled={pagina===0} onClick={()=>setPagina(p=>Math.max(0,p-1))}>← Anteriores</button><span>{pagina+1} / {Math.max(1,Math.ceil(tareas.length/2))}</span><button disabled={(pagina+1)*2>=tareas.length} onClick={()=>setPagina(p=>p+1)}>Siguientes →</button></div>}<p className="suave">Un pedal o botón USB configurado como tecla F9 podrá activar la primera tarjeta visible en esta demostración.</p><AtajoTeclado habilitado={vista==='cocina'} tarea={tareasMostradas[0]} alPulsar={finalizar}/></section>}
      {vista==='mis'&&<section className="tarjeta"><h2>{administrador?'Todas las comandas':'Mis pedidos'}</h2><div className="rejilla-pedidos">{pedidosPropios.map(c=><article className="ticket" key={c.id}><strong>{folioTexto(c.folio)}</strong><h3>{c.ubicacion}</h3><p>Responsable: {db.usuarios.find(u=>u.id===c.creador)?.nombre}</p><p>{c.items.filter(p=>p.estado!=='cancelado').map(p=>`${p.cantidad} ${p.nombre}`).join(' · ')}</p><span className="contador">{c.items.every(p=>['listo','atendido','cancelado'].includes(p.estado))?'Preparado':'Pendiente'}</span></article>)}</div>{!pedidosPropios.length&&<p className="vacio">No tienes comandas registradas.</p>}</section>}
      {vista==='seguimiento'&&<section className="tarjeta"><div className="tituloFila"><h2>Seguimiento de pedidos</h2><span className="contador">Promedio real: {promedio?`${promedio} min`:'Recopilando datos'}</span></div><label>Buscar mesa, folio o cliente</label><input value={textoBuscar} onChange={e=>setTextoBuscar(e.target.value)} placeholder="Ej. 000002 o María"/><div className="rejilla-pedidos">{pedidosPropios.filter(c=>`${folioTexto(c.folio)} ${c.ubicacion}`.toLowerCase().includes(textoBuscar.toLowerCase())).map(c=>{const cola=servicios.flatMap(s=>s.comandas).filter(x=>x.folio<c.folio&&x.items.some(p=>['pendiente','dorado'].includes(p.estado))).length;return <article className="ticket" key={c.id}><strong>{folioTexto(c.folio)} · {c.ubicacion}</strong><p>{c.items.filter(p=>p.estado!=='cancelado').length} productos · {cola} comandas anteriores pendientes (aprox.)</p><p className="suave">Tiempo estimado: {promedio?`aproximadamente ${Math.max(1,Math.round(promedio*(cola+1)*0.75))}–${Math.round(promedio*(cola+1)*1.25)+2} min`:'Aún sin suficientes pedidos terminados'}</p><details><summary>Ver productos</summary>{c.items.map(p=><p key={p.id}>{p.nombre} · {estadoItem(p)}</p>)}</details></article>})}</div><p className="suave">Estimaciones orientativas. No se conoce cuándo comienza físicamente cada preparación. Los adicionales pueden adelantar la cola.</p></section>}
      {vista==='llevar'&&administrador&&<section className="tarjeta"><h2>Empaquetado · pedidos para llevar</h2><p className="suave">Un solo botón de verificación por pedido completo; no se sugieren platos ni divisiones de empaque.</p>{activos.filter(s=>s.tipo==='llevar').map(s=><article className="comanda" key={s.id}><div className="tituloFila"><h3>{s.nombre} · {s.comandas.map(c=>folioTexto(c.folio)).join(', ')||'Sin enviar'}</h3><span className="contador">{terminada(s)?'Producción lista':'En preparación'}</span></div>{bloqueGrupo(todosItems(s).filter(p=>p.estado!=='cancelado'))}<button className="principal" disabled={!terminada(s)||s.entregado} onClick={()=>{setServicioId(s.id);if(!window.confirm(`¿Todo el pedido de ${s.nombre} está completo y se entregó?`))return;editar(s.id,x=>({...x,entregado:true}),`Verificación única y entrega · ${s.nombre}`)}}>{s.entregado?'Entregado':'✓ Pedido completo · entregar'}</button><small>Pago: {pesos(abonado(s))} · Saldo: {pesos(pendiente(s))}</small></article>)}</section>}
      {vista==='admin'&&administrador&&<section className="tarjeta"><div className="tituloFila"><h2>Administración</h2><button className="ligero" onClick={nuevoParaLlevar}>+ Comanda para llevar</button></div><div className="indicadores"><div><small>Comandas registradas</small><strong>{servicios.reduce((a,s)=>a+s.comandas.length,0)}</strong></div><div><small>Cuentas abiertas</small><strong>{activos.filter(s=>s.comandas.length>0).length}</strong></div><div><small>Abonos registrados</small><strong>{pesos(servicios.reduce((a,s)=>a+abonado(s),0))}</strong></div></div><h3>Cuentas y cobros</h3><div className="listaCuentas">{activos.filter(s=>s.comandas.length).map(s=><button key={s.id} className={servicioId===s.id?'activo':''} onClick={()=>setServicioId(s.id)}>{partes(s)} · {pesos(pendiente(s))} pendiente</button>)}</div>{actual&&!actual.cerrado&&<div className="adminCuenta"><h3>{partes(actual)}</h3><p>Responsable: {db.usuarios.find(u=>u.id===actual.responsable)?.nombre}</p><label>Reasignar a mesero</label><select value={actual.responsable} onChange={e=>editar(servicioId,s=>({...s,responsable:e.target.value}),`Reasignado a ${e.target.value}`)}>{db.usuarios.map(u=><option value={u.id} key={u.id}>{u.nombre}</option>)}</select><div className="indicadores"><div><small>Total</small><strong>{pesos(total(actual))}</strong></div><div><small>Pagado</small><strong>{pesos(abonado(actual))}</strong></div><div><small>Por cobrar</small><strong>{pesos(restantes)}</strong></div></div><label>Abono o pago completo</label><div className="fila-final"><input type="number" min="0.01" step="0.01" placeholder="Importe $" value={importePago} onChange={e=>setImportePago(e.target.value)}/><select value={metodo} onChange={e=>setMetodo(e.target.value)}><option>Efectivo</option><option>Tarjeta</option><option>Transferencia</option></select><button className="principal" onClick={pagar} disabled={restantes<=0||!actual.comandas.length}>Registrar pago</button></div><button className="ligero" onClick={()=>setImportePago(String(restantes.toFixed(2)))}>Colocar saldo completo</button><div className="fila-final"><button className="principal" onClick={cerrarMesa}>Cerrar cuenta</button>{actual.tipo==='llevar'&&<button className="ligero" onClick={()=>{setVista('llevar')}}>Ver empaquetado</button>}</div><h3>Historial de pagos</h3>{actual.pagos.map(p=><p key={p.id}>{pesos(p.monto)} · {p.metodo} · {p.fecha}</p>)}</div>}<div className="separador"/><h3>Corrección de productos marcados listos</h3>{itemsFinalizados.map(p=><div className="linea" key={p.id}><span>{folioTexto(p.folio)} · {p.ubicacion} · {p.nombre}</span><button className="peligro" onClick={()=>{const razon=window.prompt('Motivo obligatorio para revertir listo:');if(razon?.trim())cambiarItem(p.servicioId,p.folio,p.id,p.ruta==='huarache'?'dorado':p.ruta==='mesero'?'atendido':'pendiente',`Corrección ADMIN: ${razon.trim()}`)}}>Revertir listo</button></div>)}<div className="separador"/><h3>Jornada {db.fecha}</h3><p className="suave">Para cambiar de jornada, todas las cuentas y pedidos deben estar cerrados. Se conserva el historial.</p><button className="peligro" onClick={cambiarDia}>{confirmarCierre?'Confirmar cierre de jornada':'Cerrar jornada y pasar al nuevo día'}</button><p className="suave">En esta demo la confirmación es simbólica. La contraseña real requiere autenticación en servidor.</p><div className="separador"/><h3>Movimientos recientes</h3>{db.auditoria.slice(-25).reverse().map(a=><div className="historial" key={a.id}>{a.mensaje}<small>{a.fecha} · {db.usuarios.find(u=>u.id===a.autor)?.nombre||a.autor}</small></div>)}</section>}
      <footer className="pie">Doña Pera · Demostración local. Los cobros son registros de prueba; no procesan dinero. No usar como sistema real de caja hasta conectar autenticación, base de datos y controles de concurrencia.</footer>
    </main>
  </div>
}
function AtajoTeclado({habilitado,tarea,alPulsar}){useEffect(()=>{const fn=e=>{if(!habilitado||!tarea||e.key!=='F9'||['INPUT','TEXTAREA','SELECT'].includes(document.activeElement?.tagName))return;e.preventDefault();alPulsar(tarea)};window.addEventListener('keydown',fn);return()=>window.removeEventListener('keydown',fn)},[habilitado,tarea,alPulsar]);return null}
export default App
