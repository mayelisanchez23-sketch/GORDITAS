export const GUISOS=['Frijoles','Papas','Chicharrón verde','Chicharrón rojo','Deshebrada','Rajas','Champiñones','Huevo rojo','Huevo verde','Picadillo','Papas con chorizo','Chorizo','Nopales','Salchicha','Moronga','Mole','Queso','Arroz']
export const TIPOS=['Gordita','Sope','Sope chico','Huarache','Plato de comida','Gorda sin comida','Tortilla','Vaso de plástico','Agua','Café','Menudo','Refresco']
export const PRECIOS={'Gordita':16,'Sope':35,'Sope chico':30,'Huarache':55,'Plato de comida':30,'Gorda sin comida':4,'Tortilla':2,'Vaso de plástico':2,'Refresco':25}
export const pesos=n=>new Intl.NumberFormat('es-MX',{style:'currency',currency:'MXN'}).format(n||0)
export const folioTexto=n=>`#${String(n).padStart(6,'0')}`
export const hora=()=>new Date().toLocaleString('es-MX')
export const id=()=>crypto.randomUUID()
export function prepararProducto(f){
 const {tipo,guiso,guiso2,extras,dorado,grasa,nota,sabor,tamanoAgua,cafe,menudoTam,menudoTipo,refresco}=f
 const comida=['Gordita','Sope','Sope chico','Huarache','Plato de comida'].includes(tipo)
 const dos=guiso2&&['Huarache','Plato de comida'].includes(tipo)
 let nombre=comida?`${tipo} de ${guiso}${dos?` / ${guiso2}`:''}`:tipo
 let precio=PRECIOS[tipo]??0,ruta='mesero'
 const detalle=comida?[...extras]:[]
 if(['Gordita','Gorda sin comida','Plato de comida'].includes(tipo))ruta='gorditas'
 if(tipo.startsWith('Sope'))ruta='sopes'
 if(tipo==='Huarache')ruta='huarache'
 if(tipo.startsWith('Sope')||tipo==='Huarache'){
  if(dorado!=='Normal')detalle.push(dorado.toLowerCase())
  if(grasa==='Sin grasa')detalle.push('sin grasa')
 }
 if(tipo==='Agua'){nombre=`Agua de ${sabor} · ${tamanoAgua}`;precio=tamanoAgua==='1 litro'?30:20}
 if(tipo==='Café'){nombre=`Café ${cafe.toLowerCase()}`;precio=cafe==='Con crema'?20:15}
 if(tipo==='Refresco')nombre=`Refresco ${refresco}`
 if(tipo==='Menudo'){
  nombre=menudoTam==='Vaso sin carne'?'Vaso de caldo sin carne':`Menudo ${menudoTam.toLowerCase()}`
  precio=({Grande:150,Chico:130,Mini:80,'Vaso con carne':50,'Vaso sin carne':35})[menudoTam]
  if(!menudoTam.startsWith('Vaso'))detalle.push(menudoTipo.toLowerCase())
 }
 if(nota.trim())detalle.push(nota.trim())
 return {nombre,precio,ruta,detalle:detalle.join(', ')}
}
