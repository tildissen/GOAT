import NameForm from '@/components/NameForm';

export default async function CreatePage({ searchParams }: { searchParams: Promise<{ eget?: string }> }) {
  const { eget } = await searchParams;
  return <NameForm mode="create" custom={eget === '1'} />;
}
