export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="max-w-7xl min-h-screen flex flex-col justify-center items-center gap-12">{children}</div>
  );
}
