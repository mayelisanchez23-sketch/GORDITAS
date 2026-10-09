export const GUISOS = ['Frijoles','Papas','Chicharrón verde','Chicharrón rojo','Deshebrada','Rajas','Champiñones','Huevo rojo','Huevo verde','Picadillo','Papas con chorizo','Chorizo','Nopales','Salchicha','Moronga','Mole','Queso','Arroz']
export const TIPOS = ['Gordita','Sope grande','Sope chico','Huarache','Plato de comida','Gorda sin comida','Tortilla','Vaso de plástico','Agua','Café','Menudo','Refresco']
export const PRECIOS = {'Gordita':16,'Sope grande':35,'Sope chico':30,'Huarache':55,'Plato de comida':30,'Gorda sin comida':4,'Tortilla':2,'Vaso de plástico':2,'Refresco':25}
export const pesos = n => new Intl.NumberFormat('es-MX',{style:'currency',currency:'MXN'}).format(n || 0)
export const folioTexto = n => `#${String(n).padStart(6,'0')}`
export const hora = () => new Date().toLocaleString('es-MX')
export const id = () => crypto.randomUUID()
export const prepararProducto = (form) => {
  const {tipo,guiso,guiso2,extras,dorado,grasa,nota,sabor,tamanoAgua,cafe,menudoTam,menudoTipo,refresco} = form
  const comida = ['Gordita','Sope grande','Sope chico','Huarache','Plato de comida'].includes(tipo)
  const guisos = guiso2 && ['Huarache','Plato de comida'].includes(tipo) ? `${guiso} / ${guiso2}` : guiso
  let nombre = comida ? `${tipo} de ${guisos}` : tipo
  let precio = PRECIOS[tipo] ?? 0
  let ruta = 'mesero'
  let detalle = comida ? [...extras] : []
  if (tipo === 'Gordita' || tipo === 'Gorda sin comida' || tipo === 'Plato de comida') ruta = 'gorditas'
  if (tipo.startsWith('Sope')) ruta = 'sopes'
  if (tipo === 'Huarache') ruta = 'huarache'
  if (tipo === 'Huarache' || tipo.startsWith('Sope')) {
    if (dorado !== 'Normal') detalle.push(dorado)
    if (grasa === 'Sin grasa') detalle.push('Sin grasa')
  }
  if (tipo === 'Agua') {nombre = `Agua de ${sabor} · ${tamanoAgua}`;precio = tamanoAgua === '1 litro' ? 30 : 20}
  if (tipo === 'Café') {nombre = `Café ${cafe.toLowerCase()}`;precio = cafe === 'Con crema' ? 20 : 15}
  if (tipo === 'Refresco') nombre = `Refresco ${refresco}`
  if (tipo === 'Menudo') {
    nombre = `Menudo ${menudoTam.toLowerCase()}`
    precio = ({Grande:150,Chico:130,Mini:80,'Vaso con carne':50,'Vaso sin carne':35})[menudoTam]
    if (!menudoTam.startsWith('Vaso')) detalle = [menudoTipo]
  }
  if (nota.trim()) detalle.push(nota.trim())
  return {nombre, precio, ruta, detalle:detalle.join(' · ')}
}
