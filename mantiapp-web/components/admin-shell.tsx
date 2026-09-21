'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState, type ReactNode, type FormEvent } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Brand, Icon, Loading, Notice, Modal } from './ui';
const sections = [
    ['Dashboard', '/admin', 'grid'], ['Activos', '/admin/activos', 'box'],
    ['Mantenimientos', '/admin/mantenimientos', 'calendar'], ['Órdenes de trabajo', '/admin/ordenes', 'orders'],
    ['Técnicos', '/admin/tecnicos', 'users'], ['Historial', '/admin/historial', 'history'],
    ['Reportes', '/admin/reportes', 'chart'], ['Alertas', '/admin/alertas', 'bell'],
    ['Configuración', '/admin/configuracion', 'settings'],
];
export default function AdminShell({ children }: {
    children: ReactNode;
}) {
    const router = useRouter();
    const [account, setAccount] = useState<string | null>(null);
    const [failure, setFailure] = useState('');
    const [attempt, setAttempt] = useState(0);
    const [signingOut, setSigningOut] = useState(false);
    useEffect(() => {
        let active = true;
        async function verify() {
            try {
                const { data, error } = await supabase.auth.getUser();
                if (!active)
                    return;
                if (error || !data.user) {
                    router.replace('/login');
                    return;
                }
                const profile = await supabase.from('users').select('rol').eq('id', data.user.id).single();
                if (!active)
                    return;
                if (profile.error) {
                    setFailure('No pudimos verificar tus permisos. Vuelve a intentarlo.');
                    return;
                }
                if (profile.data?.rol !== 'administrador') {
                    router.replace('/login');
                    return;
                }
                setFailure('');
                setAccount(data.user.email ?? 'Administrador');
            }
            catch {
                if (active)
                    setFailure('No pudimos verificar la sesión. Revisa tu conexión.');
            }
        }
        void verify();
        const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
            if (event === 'SIGNED_OUT' || (event === 'TOKEN_REFRESHED' && !session)) {
                setAccount(null);
                router.replace('/login');
            }
        });
        const expired = () => { setAccount(null); router.replace('/login'); };
        window.addEventListener('manti:session-expired', expired);
        return () => { active = false; listener.subscription.unsubscribe(); window.removeEventListener('manti:session-expired', expired); };
    }, [router, attempt]);
    async function logout() {
        setSigningOut(true);
        try {
            const { error } = await supabase.auth.signOut();
            if (error)
                throw error;
            router.replace('/login');
        }
        catch {
            setFailure('No se pudo cerrar la sesión. Inténtalo de nuevo.');
        }
        finally {
            setSigningOut(false);
        }
    }
    if (!account)
        return <div className="session-screen"><Brand />{failure ? <><Notice danger>{failure}</Notice><button className="button" onClick={() => setAttempt(value => value + 1)}>Volver a intentar</button><Link href="/login">Volver al acceso</Link></> : <Loading />}</div>;
    return <AdminWorkspace account={account} failure={failure} signingOut={signingOut} logout={logout}>{children}</AdminWorkspace>;
}
export function AdminWorkspace({ children, account, failure = "", signingOut = false, logout }: {
    children: ReactNode;
    account: string;
    failure?: string;
    signingOut?: boolean;
    logout: () => void;
}) {
    const router = useRouter();
    const pathname = usePathname();
    const [menu, setMenu] = useState(false);
    const [query, setQuery] = useState("");
    function search(event: FormEvent) { event.preventDefault(); router.push(`/admin/activos?search=${encodeURIComponent(query.trim())}`); }
    const navigation = <><div className="sidebar-brand"><Link href="/admin" aria-label="MantiApp, inicio"><Brand /></Link></div><div className="nav-label">ESPACIO DE TRABAJO</div><nav aria-label="Navegación principal">{sections.map(([label, href, icon]) => <Link key={href} href={href} onClick={() => setMenu(false)} className={`nav-item ${pathname === href || (href !== '/admin' && pathname.startsWith(href + '/')) ? 'active' : ''}`} aria-current={pathname === href || (href !== '/admin' && pathname.startsWith(href + '/')) ? 'page' : undefined}><Icon name={icon}/><span>{label}</span></Link>)}</nav><div className="sidebar-bottom"><button onClick={logout} disabled={signingOut} className="nav-item logout"><Icon name="logout"/>{signingOut ? 'Cerrando sesión…' : 'Cerrar sesión'}</button></div></>;
    return <div className="admin-app"><a href="#contenido" className="skip-link">Saltar al contenido</a><aside className="sidebar">{navigation}</aside>{menu && <Modal title="Navegación" variant="navigation" onClose={() => setMenu(false)}><div className="mobile-navigation">{navigation}</div></Modal>}<div className="workspace"><header className="topbar"><div className="topbar-context"><button className="icon-button mobile-menu" onClick={() => setMenu(true)} aria-label="Abrir menú"><Icon name="menu"/></button><span className="breadcrumb">Administración <span>/</span> <strong>{sections.find(([, href]) => href !== '/admin' && pathname.startsWith(href))?.[0] ?? 'Dashboard'}</strong></span></div><div className="topbar-tools"><form onSubmit={search} className="top-search"><Icon name="search"/><input aria-label="Buscar activos" placeholder="Buscar activos…" value={query} onChange={event => setQuery(event.target.value)}/></form><Link href="/admin/alertas" className="icon-button" aria-label="Ver alertas"><Icon name="bell"/></Link><span className="header-divider"/><div className="account-avatar" title={account} aria-label={`Sesión de ${account}`}>{account[0].toUpperCase()}</div></div></header><main id="contenido" className="main-content">{failure && <Notice danger>{failure}</Notice>}{children}</main><footer className="workspace-footer"><span>MantiApp · Gestión de mantenimiento</span><span>Panel administrativo</span></footer></div></div>;
}
