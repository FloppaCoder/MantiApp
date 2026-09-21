import { OrderDetailPage } from '@/components/orders';
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <OrderDetailPage id={id}/>;
}
