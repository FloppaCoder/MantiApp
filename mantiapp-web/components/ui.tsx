'use client';
import Link from 'next/link';
import { useEffect, useRef, type ReactNode } from 'react';
import { normalized } from '@/lib/domain';
const drawings: Record<string, ReactNode> = {
    grid: <><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></>,
    box: <><path d="m12 3 9 5v9l-9 5-9-5V8l9-5Zm0 9v10M3 8l9 4 9-4M8 5l9 5"/></>,
    calendar: <><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 3v4m10-4v4M3 11h18m-13 4h2m4 0h2"/></>,
    orders: <><rect x="5" y="4" width="14" height="18" rx="2"/><rect x="9" y="2" width="6" height="4" rx="1"/><path d="m8 12 1 1 2-2m2 1h3m-8 5h8"/></>,
    users: <><circle cx="9" cy="7" r="3"/><path d="M3 21v-3a6 6 0 0 1 12 0v3m2-17a3 3 0 0 1 0 6m1 4a5 5 0 0 1 3 4v3"/></>,
    history: <><path d="M3 11a9 9 0 1 1 2 7M3 4v7h7m2-5v6l4 2"/></>,
    chart: <><path d="M4 3v18h17M9 16v-5m5 5V6m5 10v-8"/></>,
    bell: <><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M9 21h6"/></>,
    settings: <><path d="m9 3-1 3-3 1v4l-2 1 2 2v4l3 1 1 2h6l1-2 3-1v-4l2-2-2-1V7l-3-1-1-3H9Z"/><circle cx="12" cy="12" r="3"/></>,
    search: <><circle cx="10" cy="10" r="6"/><path d="m15 15 6 6"/></>,
    arrow: <path d="M4 12h16m-6-6 6 6-6 6"/>,
    back: <path d="M20 12H4m6-6-6 6 6 6"/>,
    plus: <path d="M12 4v16M4 12h16"/>,
    check: <path d="m4 12 5 5L20 6"/>,
    close: <path d="m5 5 14 14M19 5 5 19"/>,
    menu: <path d="M4 6h16M4 12h16M4 18h16"/>,
    logout: <><path d="M10 3H4v18h6m3-14 5 5-5 5m-5-5h13"/></>,
    alert: <><path d="m12 3 10 18H2L12 3Zm0 6v5m0 3v1"/></>,
    clock: <><circle cx="12" cy="12" r="9"/><path d="M12 6v6l4 2"/></>,
    pin: <><path d="M19 10c0 6-7 12-7 12S5 16 5 10a7 7 0 0 1 14 0Z"/><circle cx="12" cy="10" r="2"/></>,
    download: <path d="M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5"/>,
    list: <path d="M8 5h13M8 12h13M8 19h13M3 5h1m-1 7h1m-1 7h1"/>,
    edit: <><path d="m15 4 5 5M4 15 16 3l5 5L9 20l-6 1 1-6Z"/></>,
    lock: <><rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V6a4 4 0 0 1 8 0v4m-4 4v3"/></>,
    refresh: <><path d="M20 9a8 8 0 0 0-14-4L3 8m0-5v5h5m-4 7a8 8 0 0 0 14 4l3-3m0 5v-5h-5"/></>,
};
export function Icon({ name, size = 20 }: {
    name: string;
    size?: number;
}) {
    return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{drawings[name] ?? drawings.box}</svg>;
}
export function Brand() { return <span className="brand"><span className="brand-symbol brand-logo" aria-hidden="true"/>Manti<span className="brand-light">App</span></span>; }
export function ButtonLink({ href, children, secondary = false }: {
    href: string;
    children: ReactNode;
    secondary?: boolean;
}) {
    return <Link className={`button ${secondary ? 'secondary' : ''}`} href={href}>{children}</Link>;
}
export function Badge({ value }: {
    value?: string | null;
}) {
    const label = normalized(value);
    const tone = ['operativo', 'completada', 'completado', 'baja'].includes(label) ? 'green' : ['vencido', 'critica', 'alta', 'fuera de servicio'].includes(label) ? 'red' : ['pendiente', 'proximo', 'media', 'advertencia', 'en mantenimiento'].includes(label) ? 'amber' : 'blue';
    return <span className={`badge ${tone}`}><span />{value || 'Sin estado'}</span>;
}
export function PageHeading({ title, subtitle, children }: {
    title: string;
    subtitle: string;
    children?: ReactNode;
}) {
    return <div className="page-heading"><div><h1>{title}</h1><p>{subtitle}</p></div><div className="actions">{children}</div></div>;
}
export function Panel({ title, subtitle, action, children, className = '' }: {
    title?: string;
    subtitle?: string;
    action?: ReactNode;
    children: ReactNode;
    className?: string;
}) {
    return <section className={`panel ${className}`}>{title && <div className="panel-heading"><div><h2>{title}</h2>{subtitle && <p>{subtitle}</p>}</div>{action}</div>}{children}</section>;
}
export function Notice({ children, danger = false }: {
    children: ReactNode;
    danger?: boolean;
}) { return <div className={`notice ${danger ? 'danger' : ''}`} role={danger ? 'alert' : 'status'}><Icon name={danger ? 'alert' : 'lock'}/><div>{children}</div></div>; }
export function Empty({ title = 'No hay registros todavía', description = 'Los registros aparecerán aquí cuando estén disponibles.', children }: {
    title?: string;
    description?: string;
    children?: ReactNode;
}) {
    return <div className="empty"><span className="empty-icon"><Icon name="box" size={28}/></span><h3>{title}</h3><p>{description}</p>{children}</div>;
}
export function Loading() { return <div className="loading" role="status"><span className="spinner"/>Cargando información…</div>; }
export function ResourceState({ loading, error, retry, children }: {
    loading: boolean;
    error?: string;
    retry: () => void;
    children: ReactNode;
}) {
    if (loading)
        return <Loading />;
    if (error)
        return <div className="error-state"><Notice danger>{error}</Notice><button className="button secondary" onClick={retry}><Icon name="refresh"/>Volver a intentar</button></div>;
    return <>{children}</>;
}
export function Stat({ label, value, icon, tone = 'blue', hint }: {
    label: string;
    value: number | string;
    icon: string;
    tone?: string;
    hint: string;
}) {
    return <section className="stat panel"><div className="stat-top"><span>{label}</span><span className={`stat-icon ${tone}`}><Icon name={icon}/></span></div><strong>{value}</strong><p>{hint}</p></section>;
}
export function SearchField({ value, onChange, placeholder = 'Buscar…' }: {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
}) {
    return <label className="search-field"><Icon name="search"/><span className="sr-only">{placeholder}</span><input type="search" value={value} onChange={event => onChange(event.target.value)} placeholder={placeholder}/></label>;
}
export function Field({ label, children, hint }: {
    label: string;
    children: ReactNode;
    hint?: string;
}) {
    return <label className="field"><span>{label}</span>{children}{hint && <small>{hint}</small>}</label>;
}
export function Modal({ title, children, onClose, busy = false, variant = 'default' }: {
    title: string;
    children: ReactNode;
    onClose: () => void;
    busy?: boolean;
    variant?: 'default' | 'navigation';
}) {
    const dialog = useRef<HTMLDialogElement>(null);
    useEffect(() => {
        const element = dialog.current;
        const previousOverflow = document.body.style.overflow;
        element?.showModal();
        if (variant === 'navigation') document.body.style.overflow = 'hidden';
        return () => {
            element?.close();
            if (variant === 'navigation') document.body.style.overflow = previousOverflow;
        };
    }, [variant]);
    return <dialog ref={dialog} className={`modal ${variant === 'navigation' ? 'navigation-dialog' : ''}`} aria-label={title} onCancel={event => { event.preventDefault(); if (!busy)
        onClose(); }}><div className="panel-heading">{variant === 'navigation' ? <Brand/> : <h2>{title}</h2>}<button type="button" className="icon-button" aria-label="Cerrar diálogo" disabled={busy} onClick={onClose}><Icon name="close"/></button></div>{children}</dialog>;
}
export function Bars({ values }: {
    values: {
        label: string;
        count: number;
    }[];
}) {
    const max = Math.max(1, ...values.map(item => item.count));
    return values.length ? <div className="bars">{values.map((item, index) => <div key={item.label} className="bar-row"><div><span>{item.label}</span><strong>{item.count}</strong></div><div className="bar-track"><span style={{ width: `${item.count / max * 100}%`, backgroundColor: ['#3d62db', '#37a58b', '#e5b34c', '#8d79cd'][index % 4] }}/></div></div>)}</div> : <Empty description="No hay datos suficientes para mostrar una distribución."/>;
}
