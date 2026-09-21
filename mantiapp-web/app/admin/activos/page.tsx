import { AssetsPage } from '@/components/assets';
import { Suspense } from 'react';
import { Loading } from '@/components/ui';
export default function Page() { return <Suspense fallback={<Loading/>}><AssetsPage/></Suspense>; }
