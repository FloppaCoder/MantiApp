import Image from 'next/image';
import logo from '@/app/icon.png';

// Logo de MantiApp para las tarjetas de login, registro y completar perfil.
export default function AuthLogo() {
  return <Image src={logo} alt="MantiApp" width={64} height={64} priority className="mx-auto mb-4" />;
}
