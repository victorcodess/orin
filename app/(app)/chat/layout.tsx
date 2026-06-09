export default function ChatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div data-chat-route className="contents">{children}</div>;
}
