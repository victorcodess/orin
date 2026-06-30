import { StoreInit } from "@/components/shell/store-init";

export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <StoreInit />
      {children}
    </>
  );
}
