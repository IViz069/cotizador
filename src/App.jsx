import React, { useEffect, useMemo, useRef, useState } from 'react'
import { exportNodeToPdf } from './utils/exportToPdf.js'
import './styles.css'

const IGV_RATE = 0.18 // 18%

export default function App() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    // ---- valores por defecto (editables) ----
    empresa: 'AUTOMOTORES GILDEMEISTER',
    sucursal: 'LA MARINA',
    direccionEmpresa: 'AV. LA MARINA 830',
    numCotizacion: 'PTA-00035-1',

    clienteNombre: 'Jorge Ortega Collazos',
    clienteDniRuc: '73239198',
    clienteDireccion: 'Av. Ejemplo 123, Comas',
    clienteTelefono: '12312321',
    clientePais: 'PER',
    clienteProvincia: 'Lima',
    clienteDistrito: 'Comas',

    vendedorNombre: 'LUIS VELASQUEZ QUISPE',
    vendedorTelefono: '993573784',
    vendedorCorreo: 'lvelasquez@gildemeister.pe',

    ctasCorrientes:
      'BCP S/191-1163403-0-44\n' +
      'BCP S/ INTERBANCARIA002-191-001163403044-56\n' +
      'BBVA S/0011-0178-01-00020024\n' +
      'BBVA S/ INTERBANCARIA011-178-000100020024-14',

    observaciones: '—'
  })

  // mapa seleccion: id -> { qty, disc }
  const [sel, setSel] = useState({})
  const pdfRef = useRef(null)

  useEffect(() => {
    const url = `${import.meta.env.BASE_URL}products.json`
    fetch(url)
      .then(r => r.json())
      .then(setProducts)
      .catch(() => setError('No se pudo cargar products.json'))
      .finally(() => setLoading(false))
  }, [])

  const selectedRows = useMemo(() => {
    return Object.entries(sel)
      .filter(([, v]) => Number(v.qty) > 0)
      .map(([id, v]) => {
        const p = products.find(x => String(x.id) === String(id))
        if (!p) return null
        const unit = Number(p.price) || 0
        const discPct = Math.min(Math.max(Number(v.disc) || 0, 0), 100)
        const qty = Math.max(Number(v.qty) || 0, 0)
        const subtotal = qty * unit * (1 - discPct / 100)
        const totalIgv = subtotal * (1 + IGV_RATE)
        return { id: p.id, name: p.name, qty, unit, discPct, subtotal, totalIgv }
      })
      .filter(Boolean)
  }, [sel, products])

  const totals = useMemo(() => {
    const sub = selectedRows.reduce((a, r) => a + r.subtotal, 0)
    const igv = sub * IGV_RATE
    const total = sub + igv
    return { sub, igv, total }
  }, [selectedRows])

  const handleSelectChange = (id, field, value) => {
    setSel(prev => ({
      ...prev,
      [id]: { qty: prev[id]?.qty || 0, disc: prev[id]?.disc || 0, [field]: value }
    }))
  }

  const handleExportPdf = async () => {
    if (!pdfRef.current) return
    await exportNodeToPdf(pdfRef.current, { filename: 'cotizacion.pdf', margin: 8 })
  }

  const setF = (k, v) => setForm(prev => ({ ...prev, [k]: v }))

  return (
    <div className="container">
      <header className="toolbar">
        <h1>Catálogo de Productos</h1>
        <button onClick={handleExportPdf}>Exportar a PDF</button>
      </header>

      {/* Panel de selección con miniaturas */}
      <section className="panel">
        <h2>Selecciona productos</h2>
        {loading && <p>Cargando…</p>}
        {error && <p className="error">{error}</p>}
        <div className="picker">
          {products.map(p => (
            <div className="picker-row" key={p.id}>
              <img className="picker-thumb" src={p.image} alt={p.name} />
              <div className="picker-name">
                <strong>{p.name}</strong>
                <small>SKU: {p.sku}</small>
              </div>
              <div className="picker-unit">S/ {Number(p.price).toFixed(2)}</div>
              <label className="picker-qty">
                Cant.
                <input
                  type="number" min="0" step="1"
                  value={sel[p.id]?.qty ?? 0}
                  onChange={e => handleSelectChange(p.id, 'qty', e.target.value)}
                />
              </label>
              <label className="picker-disc">
                % Dscto
                <input
                  type="number" min="0" max="100" step="0.01"
                  value={sel[p.id]?.disc ?? 0}
                  onChange={e => handleSelectChange(p.id, 'disc', e.target.value)}
                />
              </label>
            </div>
          ))}
        </div>
      </section>

      {/* Form de cabecera/cliente/vendedor */}
      <section className="panel">
        <h2>Datos de cabecera</h2>
        <div className="grid-2">
          <div className="form-col">
            <h3>Empresa</h3>
            <div className="row"><label>Empresa</label><input value={form.empresa} onChange={e=>setF('empresa',e.target.value)}/></div>
            <div className="row"><label>Sucursal</label><input value={form.sucursal} onChange={e=>setF('sucursal',e.target.value)}/></div>
            <div className="row"><label>Dirección</label><input value={form.direccionEmpresa} onChange={e=>setF('direccionEmpresa',e.target.value)}/></div>
            <div className="row"><label>N° Cotización</label><input value={form.numCotizacion} onChange={e=>setF('numCotizacion',e.target.value)}/></div>
          </div>
          <div className="form-col">
            <h3>Cliente</h3>
            <div className="row"><label>Nombre</label><input value={form.clienteNombre} onChange={e=>setF('clienteNombre',e.target.value)}/></div>
            <div className="row"><label>DNI/RUC</label><input value={form.clienteDniRuc} onChange={e=>setF('clienteDniRuc',e.target.value)}/></div>
            <div className="row"><label>Dirección</label><input value={form.clienteDireccion} onChange={e=>setF('clienteDireccion',e.target.value)}/></div>
            <div className="row"><label>Teléfono</label><input value={form.clienteTelefono} onChange={e=>setF('clienteTelefono',e.target.value)}/></div>
            <div className="row"><label>País</label><input value={form.clientePais} onChange={e=>setF('clientePais',e.target.value)}/></div>
            <div className="row"><label>Provincia</label><input value={form.clienteProvincia} onChange={e=>setF('clienteProvincia',e.target.value)}/></div>
            <div className="row"><label>Distrito</label><input value={form.clienteDistrito} onChange={e=>setF('clienteDistrito',e.target.value)}/></div>
          </div>
        </div>

        <div className="grid-2">
          <div className="form-col">
            <h3>Vendedor</h3>
            <div className="row"><label>Nombre</label><input value={form.vendedorNombre} onChange={e=>setF('vendedorNombre',e.target.value)}/></div>
            <div className="row"><label>Teléfono</label><input value={form.vendedorTelefono} onChange={e=>setF('vendedorTelefono',e.target.value)}/></div>
            <div className="row"><label>Correo</label><input value={form.vendedorCorreo} onChange={e=>setF('vendedorCorreo',e.target.value)}/></div>
          </div>
          <div className="form-col">
            <h3>Observaciones</h3>
            <textarea rows={6} value={form.observaciones} onChange={e=>setF('observaciones',e.target.value)} />
          </div>
        </div>

        <div className="grid-2">
          <div className="form-col">
            <h3>Cuentas Corrientes</h3>
            <textarea rows={6} value={form.ctasCorrientes} onChange={e=>setF('ctasCorrientes',e.target.value)} />
          </div>
        </div>
      </section>

      {/* Hoja exportable */}
<section
  className="pdf-sheet quote"
  ref={pdfRef}
  style={{
    position: 'fixed',
    top: 0,
    left: 0,
    transform: 'translate(-10000px, -10000px)', // fuera del viewport
    pointerEvents: 'none' // no estorba
  }}
>

        <div className="quote-header">
          <div className="logo-placeholder" />
          <div className="header-right">
            <div className="empresa">
              <div><strong>Empresa:</strong> {form.empresa}</div>
              <div><strong>Sucursal:</strong> {form.sucursal}</div>
              <div><strong>Dirección:</strong> {form.direccionEmpresa}</div>
            </div>
            <div className="cotiz">
              <div className="title">COTIZACIÓN {form.numCotizacion}</div>
              <div className="date">Fecha: {new Date().toLocaleDateString()}</div>
            </div>
          </div>
        </div>
        <hr className="rule" />


        <div className="quote-section two-col">
          <div>
            <h4>CLIENTE</h4>
            <hr className="rule" />
            <div className="kv"><span>Nombre:</span> <b>{form.clienteNombre}</b></div>
            <div className="kv"><span>DNI/RUC:</span> <b>{form.clienteDniRuc}</b></div>
            <div className="kv"><span>Dirección:</span> <b>{form.clienteDireccion}</b></div>
            <div className="kv"><span>Teléfono:</span> <b>{form.clienteTelefono}</b></div>
          </div>
          <div>
            <div className="kv"><span>País:</span> <b>{form.clientePais}</b></div>
            <div className="kv"><span>Provincia:</span> <b>{form.clienteProvincia}</b></div>
            <div className="kv"><span>Distrito:</span> <b>{form.clienteDistrito}</b></div>
          </div>
        </div>

        <div className="quote-section two-col">
          <div>
            <h4>VENDEDOR</h4>
            <hr className="rule" />
            <div className="kv"><span>Nombre:</span> <b>{form.vendedorNombre}</b></div>
            <div className="kv"><span>Teléfono:</span> <b>{form.vendedorTelefono}</b></div>
          </div>
          <div className="kv"><span>Correo:</span> <b>{form.vendedorCorreo}</b></div>
        </div>

        <div className="quote-section two-col">
          <div>
            <h4>Cta Corriente</h4>
            <div className="boxed">{form.ctasCorrientes}</div>
          </div>
          <div>
            <h4>Observaciones</h4>
            <div className="boxed">{form.observaciones}</div>
          </div>
        </div>

        <div className="quote-section">
          <h4>DETALLE DE LA COTIZACIÓN</h4>
          <hr className="rule" />
          <div className="table-wrap">
            <table className="quote-table">
              <thead>
                  <tr>
                    <th>Repuesto</th>
                    <th className="num tight">Cantidad</th>
                    <th className="num medium">Precio Unit.</th>
                    <th className="num tight">% Dscto</th>
                    <th className="num medium">Sub Total</th>
                    <th className="num wide">TOTAL inc IGV (S/.)</th>
                  </tr>
              </thead>
              <tbody>
                  {selectedRows.map(r => (
                    <tr key={r.id}>
                      <td>{r.name}</td>
                      <td className="num tight">{r.qty.toFixed(2)}</td>
                      <td className="num medium">{money(r.unit)}</td>
                      <td className="num tight">{r.discPct.toFixed(2)}</td>
                      <td className="num medium">{money(r.subtotal)}</td>
                      <td className="num wide">{money(r.totalIgv)}</td>
                    </tr>
                  ))}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan="4"></td>
                  <td className="num label">SUBTOTAL:</td>
                  <td className="num">{money(totals.sub)}</td>
                </tr>
                <tr>
                  <td colSpan="4"></td>
                  <td className="num label">IGV (18%):</td>
                  <td className="num">{money(totals.igv)}</td>
                </tr>
                <tr>
                  <td colSpan="4"></td>
                  <td className="num label total">TOTAL:</td>
                  <td className="num total">{money(totals.total)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </section>
    </div>
  )
}

function money(n) {
  return new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN', minimumFractionDigits: 2 }).format(Number(n||0))
}

