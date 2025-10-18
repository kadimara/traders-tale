import ModulePNL from '../features/modules/ModulePNL';

export default function Home() {
  return (
    <main
      className="flex flex-col gap-1"
      style={{ width: '90%', margin: 'auto' }}
    >
      <ModulePNL />
    </main>
  );
}
