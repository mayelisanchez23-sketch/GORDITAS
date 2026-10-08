import { useState } from 'react'
import './App.css'

const GUISOS = ['Rajas','Champiñones','Chorizo','Moronga','Nopales','Salchicha','Deshebrada','Huevo verde','Huevo rojo','Chicharrón verde','Chicharrón rojo','Papas','Queso','Frijoles','Picadillo','Papas con chorizo']
const OPCIONES = ['Gordita','Sope','Huarache','Agua','Café','Menudo','Refresco']
const dinero = n => new Intl.NumberFormat('es-MX',{style:'currency',currency:'MXN'}).format(n)
const nuevoId = () => crypto.randomUUID()
const nuevaMesa = () => ({ comensales:1, borrador:[], comandas:[], movimientos:[], cerrada:false })
const inicial = () => ({ siguienteFolio:1, mesas:{}, auditoria:[] })
const cargar = () => {
  try { const datos = JSON.parse(localStorage.getItem('dona-pera-demo-v2')); return datos?.mesas && datos?.siguienteFolio ? datos : inicial() }
  catch { return inicial() }
}

function App() {
  const [db,setDb] = useState(cargar)
  const [vista,setVista] = useState('mesero')
  const [area,setArea] = useState('gorditas')
  const [mesa,setMesa] = useState(1)
  const [comensal,setComensal] = useState(1)
  const [tipo,setTipo] = useState('Gordita')
  const [guiso,setGuiso] = useState(GUISOS[0])
  const [segundoGuiso,setSegundoGuiso] = useState('')
  const [extras,setExtras] = useState([])
  const [presentacion,setPresentacion] = useState('Grande')
  const [sabor,setSabor] = useState('Horchata')
  const [tamAgua,setTamAgua] = useState('½ litro')
  const [cafe,setCafe] = useState('Sin crema')
  const [menudo,setMenudo] = useState('Con carne')
  const [nota,setNota] = useState('')
  const actual = db.mesas[mesa] || nuevaMesa()

  const guardar = modificar => setDb(estado => {
    const siguiente = modificar(estado)
    localStorage.setItem('dona-pera-demo-v2',JSON.stringify(siguiente))
    return siguiente
  })
  const editarMesa = (numero, modificar, evento) => guardar(estado => {
    const anterior = estado.mesas[numero] || nuevaMesa()
    const actualizado = modificar(anterior)
    return { ...estado, mesas:{...estado.mesas,[numero]:{...actualizado,movimientos: evento ? [...actualizado.movimientos,{fecha:new Date().toLocaleString('es-MX'),detalle:evento}] : actualizado.movimientos}} }
  })

  const alternarExtra = extra => setExtras(lista => lista.includes(extra) ? lista.filter(x => x!==extra) : [...lista,extra])
  const seleccionarTipo = nombre => { setTipo(nombre); setExtras([]); setNota(''); setSegundoGuiso('') }
  const seleccionarMesa = n => { setMesa(n); setComensal(1) }
  const crearComensal = () => {
    const n = actual.comensales + 1
    editarMesa(mesa,m=>({...m,comensales:n}),`Comensal ${n} agregado`)
    setComensal(n)
  }

  const detalles = () => {
    if (tipo==='Gordita') return {nombre:`Gordita de ${guiso}`,precio:16,detalle:extras.join(', '),ruta:'gorditas'}
    if (tipo==='Sope') return {nombre:`Sope de ${guiso}`,precio:35,detalle:extras.join(', '),ruta:'sopes'}
    if (tipo==='Huarache') return {nombre:`Huarache de ${guiso}${segundoGuiso ? ` / ${segundoGuiso}` : ''}`,precio:55,detalle:extras.join(', '),ruta:'huarache'}
    if (tipo==='Agua') return {nombre:`Agua de ${sabor} (${tamAgua})`,precio:tamAgua==='1 litro'?30:20,detalle:'',ruta:'mesero'}
    if (tipo==='Café') return {nombre:`Café ${cafe.toLowerCase()}`,precio:cafe==='Con crema'?20:15,detalle:'',ruta:'mesero'}
    if (tipo==='Menudo') return {nombre:`Menudo ${presentacion.toLowerCase()}`,precio:({Grande:150,Chico:120,Mini:100,Vaso:60})[presentacion],detalle:menudo,ruta:'mesero'}
    return {nombre:'Refresco',precio:20,detalle:'',ruta:'mesero'}
  }
  const agregar = () => {
    const p=detalles()
    const item={id:nuevoId(),...p,detalle:[p.detalle,nota.trim()].filter(Boolean).join(' · '),comensal,cantidad:1,estado:p.ruta==='mesero'?'atendido':'pendiente',prioritario:false}
    editarMesa(mesa,m=>({...m,borrador:[...m.borrador,item]}))
    setNota('')
  }
  const cantidad = (id,cambio) => editarMesa(mesa,m=>({...m,borrador:m.borrador.map(p=>p.id===id?{...p,cantidad:p.cantidad+cambio}:p).filter(p=>p.cantidad>0)}))
  const enviar = () => {
    if (!actual.borrador.length) return
    guardar(estado => {
      const anterior=estado.mesas[mesa]||nuevaMesa()
      const folio=estado.siguienteFolio
      const adicional=anterior.comandas.length>0
      const items=anterior.borrador.map(p=>({...p,prioritario:adicional}))
      const comanda={folio,id:nuevoId(),fecha:new Date().toLocaleString('es-MX'),adicional,items}
      return {...estado,siguienteFolio:folio+1,mesas:{...estado.mesas,[mesa]:{...anterior,borrador:[],comandas:[...anterior.comandas,comanda],movimientos:[...anterior.movimientos,{fecha:comanda.fecha,detalle:`Comanda #${String(folio).padStart(6,'0')} enviada${adicional?' (adicional)':''}`} ]}}}
    })
  }
  const modificarItem = (numero,folio,id,nuevoEstado,accion) => editarMesa(numero,m=>({...m,comandas:m.comandas.map(c=>c.folio!==folio?c:{...c,items:c.items.map(p=>p.id===id?{...p,estado:nuevoEstado}:p)})}),accion)
  const cancelar = (numero,folio,item) => {
    if (item.estado==='listo'||item.estado==='cancelado'||item.estado==='atendido') return
    const motivo=window.prompt('Motivo de cancelación (obligatorio):')
    if (!motivo?.trim()) return
    modificarItem(numero,folio,item.id,'cancelado',`Cancelado ${item.nombre} de comanda #${folio}. Motivo: ${motivo.trim()}`)
  }
  const tareas = Object.entries(db.mesas).flatMap(([n,m])=>m.comandas.flatMap(c=>c.items.filter(p=>{
    if (area==='gorditas') return (p.ruta==='gorditas'||p.ruta==='huarache')&&p.estado==='pendiente'
    return (p.ruta==='sopes'&&p.estado==='pendiente')||(p.ruta==='huarache'&&p.estado==='dorado')
  }).map(p=>({...p,mesa:Number(n),folio:c.folio,fecha:c.fecha})))).sort((a,b)=>Number(b.prioritario)-Number(a.prioritario)||a.folio-b.folio)
  const productos = Object.entries(db.mesas).flatMap(([n,m])=>m.comandas.flatMap(c=>c.items.map(p=>({...p,mesa:Number(n),folio:c.folio}))))
  const opcionesExtras = tipo==='Gordita'?['Con queso','Con frijoles']:tipo==='Sope'?['Con verdura','Con todo','Con queso y crema','Con cebolla','Con cilantro']:['Con queso','Sin queso','Con frijoles']
  return <div className="aplicacion">
    <header className="cabecera"><div><div className="marca">🌮 DOÑA PERA <span>• Prototipo</span></div><h1>Sistema de comandas</h1><p>Mesas, comensales y producción</p></div><span className="notaDemo">Demo local · sin sincronización</span></header>
    <main className="contenedor">
      <nav className="pestanas" aria-label="Vistas de demostración">{[['mesero','Mesero'],['gorditas','Cocina · Gorditas'],['sopes','Cocina · Sopes'],['admin','Administrador']].map(([clave,nombre])=><button key={clave} className={(clave==='mesero'&&vista==='mesero')||(clave==='admin'&&vista==='admin')||(vista==='cocina'&&area===clave)?'seleccionado':''} onClick={()=>{if(clave==='gorditas'||clave==='sopes'){setVista('cocina');setArea(clave)}else setVista(clave)}}>{nombre}</button>)}</nav>
      {vista==='mesero'&&<div className="columnas">
        <section className="tarjeta"><h2>Mesas</h2><div className="rejilla-mesas">{Array.from({length:12},(_,i)=>i+1).map(n=><button key={n} className={`boton-mesa ${mesa===n?'activo':''}`} onClick={()=>seleccionarMesa(n)}>Mesa {n}<small>{db.mesas[n]?.comandas.length?'Con pedido':'Disponible'}</small></button>)}</div><div className="separador"/><div className="tituloFila"><h2>Comensales</h2><button className="ligero" onClick={crearComensal}>+ Agregar</button></div><div className="chips">{Array.from({length:actual.comensales},(_,i)=>i+1).map(n=><button key={n} className={comensal===n?'activo':''} onClick={()=>setComensal(n)}>Comensal {n}</button>)}</div></section>
        <section className="tarjeta"><h2>Menú</h2><p className="suave">Mesa {mesa} · Comensal {comensal}</p><div className="chips tipos">{OPCIONES.map(x=><button key={x} className={tipo===x?'activo':''} onClick={()=>seleccionarTipo(x)}>{x}</button>)}</div>
          {['Gordita','Sope','Huarache'].includes(tipo)&&<><label>Guiso</label><select value={guiso} onChange={e=>setGuiso(e.target.value)}>{GUISOS.map(x=><option key={x}>{x}</option>)}</select>{tipo==='Huarache'&&<><label>Segunda mitad (opcional)</label><select value={segundoGuiso} onChange={e=>setSegundoGuiso(e.target.value)}><option value="">Un solo guiso</option>{GUISOS.filter(x=>x!==guiso).map(x=><option key={x}>{x}</option>)}</select></>}<label>Complementos (sin costo)</label><div className="checks">{opcionesExtras.map(x=><label key={x}><input type="checkbox" checked={extras.includes(x)} onChange={()=>alternarExtra(x)}/>{x}</label>)}</div></>}
          {tipo==='Agua'&&<><label>Sabor</label><select value={sabor} onChange={e=>setSabor(e.target.value)}>{['Horchata','Jamaica','Limón'].map(x=><option key={x}>{x}</option>)}</select><label>Presentación</label><select value={tamAgua} onChange={e=>setTamAgua(e.target.value)}><option>½ litro</option><option>1 litro</option></select></>}
          {tipo==='Café'&&<><label>Presentación</label><select value={cafe} onChange={e=>setCafe(e.target.value)}><option>Sin crema</option><option>Con crema</option></select></>}
          {tipo==='Menudo'&&<><label>Tamaño</label><select value={presentacion} onChange={e=>setPresentacion(e.target.value)}>{['Grande','Chico','Mini','Vaso'].map(x=><option key={x}>{x}</option>)}</select><label>Preparación</label><select value={menudo} onChange={e=>setMenudo(e.target.value)}>{['Con carne','Con carne y pata','Solo pata'].map(x=><option key={x}>{x}</option>)}</select></>}
          <label>Indicaciones (opcional)</label><input value={nota} onChange={e=>setNota(e.target.value)} placeholder="Ej. Sin salsa"/><div className="fila-final"><strong>{dinero(detalles().precio)}</strong><button className="principal" onClick={agregar}>+ Agregar al pedido</button></div>
        </section>
        <section className="tarjeta"><h2>Cuenta · Mesa {mesa}</h2><p className="suave">Productos por enviar</p>{actual.borrador.length===0&&<p className="vacio">Aún no agregas productos.</p>}{actual.borrador.map(p=><div className="linea" key={p.id}><div><b>{p.nombre}</b><small>Comensal {p.comensal}{p.detalle?` · ${p.detalle}`:''}</small><small>{dinero(p.precio)} c/u</small></div><div className="controles"><button onClick={()=>cantidad(p.id,-1)}>−</button><span>{p.cantidad}</span><button onClick={()=>cantidad(p.id,1)}>+</button></div></div>)}<button className="principal ancho" disabled={!actual.borrador.length} onClick={enviar}>Enviar comanda</button><div className="separador"/><h3>Comandas enviadas</h3>{actual.comandas.length===0&&<p className="vacio">Aún no se han enviado comandas.</p>}{actual.comandas.map(c=><div className="comanda" key={c.folio}><div className="tituloFila"><strong>#{String(c.folio).padStart(6,'0')}</strong>{c.adicional&&<span className="etiquetaPrioridad">Adicional prioritario</span>}</div>{c.items.map(p=><div className="linea" key={p.id}><div><b>{p.cantidad} × {p.nombre}</b><small>Comensal {p.comensal} · {p.estado==='dorado'?'En dorado':p.estado==='atendido'?'Mesero atiende':p.estado}</small>{p.detalle&&<small>{p.detalle}</small>}</div>{['pendiente','dorado'].includes(p.estado)&&<button className="peligro" onClick={()=>cancelar(mesa,c.folio,p)}>Cancelar</button>}</div>)}</div>)}<div className="total"><span>Total activo</span><b>{dinero([...actual.borrador,...actual.comandas.flatMap(c=>c.items)].filter(p=>p.estado!=='cancelado').reduce((s,p)=>s+p.precio*p.cantidad,0))}</b></div></section>
      </div>}
      {vista==='cocina'&&<section className="tarjeta"><div className="tituloFila"><div><h2>Producción: {area==='gorditas'?'Gorditas y fabricación de huaraches':'Sopes y dorado de huaraches'}</h2><p className="suave">Los adicionales se muestran primero, sin interrumpir trabajos iniciados.</p></div><span className="contador">{tareas.length} pendientes</span></div>{tareas.length===0?<p className="vacio">No hay productos pendientes en esta área.</p>:<div className="rejilla-pedidos">{tareas.map(p=><article className="ticket" key={p.id}>{p.prioritario&&<span className="etiquetaPrioridad">⚡ ADICIONAL PRIORITARIO</span>}<div className="tituloFila"><strong>Comanda #{String(p.folio).padStart(6,'0')}</strong><span>{p.fecha}</span></div><h3>Mesa {p.mesa} · Comensal {p.comensal}</h3><p className="productoGrande">{p.cantidad} × {p.nombre}</p>{p.detalle&&<p className="detalle">{p.detalle}</p>}<button className="principal ancho" onClick={()=>modificarItem(p.mesa,p.folio,p.id,p.ruta==='huarache'&&p.estado==='pendiente'?'dorado':'listo',`${p.nombre} · #${p.folio} → ${p.ruta==='huarache'&&p.estado==='pendiente'?'Enviado a dorado':'Listo'}`)}>{p.ruta==='huarache'&&p.estado==='pendiente'?'✓ Elaborado · pasar a sopes':'✓ Marcar listo'}</button></article>)}</div>}</section>}
      {vista==='admin'&&<section className="tarjeta"><h2>Administración · Supervisión</h2><p className="suave">Modo demostración: las pestañas no son un control de acceso. El cobro real y el cierre de mesas se habilitarán con autenticación y backend.</p><div className="indicadores"><div><small>Comandas enviadas</small><strong>{Object.values(db.mesas).reduce((s,m)=>s+m.comandas.length,0)}</strong></div><div><small>Productos listos</small><strong>{productos.filter(p=>p.estado==='listo').reduce((s,p)=>s+p.cantidad,0)}</strong></div><div><small>Total de cuentas abiertas (no cobrado)</small><strong>{dinero(productos.filter(p=>p.estado!=='cancelado').reduce((s,p)=>s+p.precio*p.cantidad,0))}</strong></div></div><h3>Corrección de productos listos</h3>{productos.filter(p=>p.estado==='listo').length===0&&<p className="vacio">No hay productos listos para corregir.</p>}{productos.filter(p=>p.estado==='listo').map(p=><div className="linea" key={p.id}><div><b>#{String(p.folio).padStart(6,'0')} · Mesa {p.mesa} · Comensal {p.comensal}</b><small>{p.cantidad} × {p.nombre}</small></div><button className="peligro" onClick={()=>{const motivo=window.prompt('Motivo de corrección (obligatorio):'); if(motivo?.trim()) modificarItem(p.mesa,p.folio,p.id,p.ruta==='huarache'?'dorado':p.ruta==='mesero'?'atendido':'pendiente',`ADMIN demo: revirtió listo en #${p.folio} por ${motivo.trim()}`)}}>Revertir listo</button></div>)}<h3>Movimientos y cancelaciones</h3>{Object.entries(db.mesas).flatMap(([n,m])=>m.movimientos.map((x,i)=><div className="historial" key={`${n}-${i}`}><strong>Mesa {n}</strong> · {x.detalle}<small>{x.fecha}</small></div>))}</section>}
    </main>
  </div>
}
export default App
