import React, { useState, useEffect } from 'react';
import { Layout, Dashboard, Clock, Settings, Wallet } from 'lucide-react';
import Card from './components/Card';
import Table from './components/Table';
import Modal from './components/Modal';

// This is a high-level preview of how the React version is structured
const App = () => {
    const [records, setRecords] = useState(JSON.parse(localStorage.getItem('vfinance_records')) || []);
    const [view, setView] = useState('dashboard');

    const config = {
        DAY_PRICE: 59000,
        OVERTIME_PRICE: 5500
    };

    const calculateTotalExtras = () => {
        return records.reduce((acc, r) => acc + (r.extraValue || 0), 0);
    };

    return (
        <div className="flex h-screen bg-slate-950 text-white font-inter">
            {/* Sidebar component */}
            <Sidebar currentView={view} setView={setView} />

            <main className="flex-1 overflow-y-auto p-8">
                <header className="mb-8 flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold">{view === 'dashboard' ? 'Resumen' : 'Configuración'}</h1>
                        <p className="text-slate-400">Panel de Finanzas Personales COP</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center font-bold text-black">A</div>
                        <span>Admin</span>
                    </div>
                </header>

                {view === 'dashboard' && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                        <Card title="Ingresos Totales" value={formatCOP(records.reduce((acc, r) => acc + r.amount, 0))} icon={<Wallet className="text-emerald-500" />} />
                        <Card title="Ganancia Extras" value={formatCOP(calculateTotalExtras())} icon={<Clock className="text-amber-500" />} />
                        <Card title="Egresos / Gastos" value={formatCOP(Math.abs(records.filter(r => r.amount < 0).reduce((acc, r) => acc + r.amount, 0)))} icon={<Wallet className="text-rose-500" />} />
                    </div>
                )}

                {/* Dynamic content rendering based on view state */}
                <Table data={records} />
            </main>
        </div>
    );
};

const formatCOP = (val) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(val);

export default App;
