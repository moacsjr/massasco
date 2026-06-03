import { ExtensionPoint } from '@temp-workspace/plugin-loader';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <><ExtensionPoint id="app:main-template" props={{ children }} /></>
  );
}
