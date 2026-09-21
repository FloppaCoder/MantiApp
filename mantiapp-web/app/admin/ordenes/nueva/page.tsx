import { NewOrderPage } from '@/components/orders';
import { Suspense } from 'react';
import { Loading } from '@/components/ui';
export default function Page() { return <Suspense fallback={<Loading/>}><NewOrderPage/></Suspense>; }
