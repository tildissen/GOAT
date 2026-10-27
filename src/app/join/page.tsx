import NameForm from '@/components/NameForm';

export default async function JoinPage({ searchParams }: { searchParams: Promise<{ code?: string }> }) {
  const { code } = await searchParams;
  return <NameForm mode="join" initialCode={code ?? ''} />;
}
