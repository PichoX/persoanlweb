import React, { useState, useEffect } from 'react';
import './App.css';

function App() {
    const [stats, setStats] = useState({ nomina: 0, gastos: 0 });
    const [jornadas, setJornadas] = useState([]);
    const [form, setForm] = useState({ fecha: new Date().toISOString().split('T')[0], salida: '17:00' });

    useEffect(() => {
        fetchDatos();
    }, []);

    const fetchDatos = async () => {
        // En un entorno real, aquí llamarías a tu API
        // const res = await fetch('http://localhost:5000/api/resumen');
        // setStats(await res.json());
    };

    const registrarDia = async (e) => {
        e.preventDefault();
        // Simulación de envío al backend Postgres
        console.log("Enviando a Postgres:", form);
        alert("Jornada registrada en la base de datos");
    };

    return (
        <div className="app-container">
            <aside className="sidebar">
                <div className="logo">VFinance<span>PRO</span></div>
                <nav>
                    <button className="active">Dashboard</button>
                    <button>Historial</button>
                    <button>Configuración</button>
                </nav>
            </aside>

            <main className="main-content">
                <header>
                    <h1>Dashboard de Finanzas</h1>
                    <div className="user-info">Admin | COP</div>
                </header>

                <div className="stats-grid">
                    <div className="card">
                        <span className="label">Ingresos Nómina</span>
                        <span className="value">$ {new Intl.NumberFormat('es-CO').format(stats.nomina)}</span>
                    </div>
                    <div className="card highlight">
                        <span className="label">Horas Extras</span>
                        <span className="value">$ 0</span>
                    </div>
                </div>

                <div className="action-section">
                    <div className="form-card">
                        <h3>Registrar Salida de Hoy</h3>
                        <form onSubmit={registrarDia}>
                            <div className="input-group">
                                <label>Fecha</label>
                                <input type="date" value={form.fecha} onChange={e => setForm({ ...form, fecha: e.target.value })} />
                            </div>
                            <div className="input-group">
                                <label>Hora de Salida</label>
                                <input type="time" value={form.salida} onChange={e => setForm({ ...form, salida: e.target.value })} />
                            </div>
                            <button type="submit" className="btn-save">Guardar en Base de Datos</button>
                        </form>
                    </div>
                </div>
            </main>
        </div>
    );
}

export default App;
