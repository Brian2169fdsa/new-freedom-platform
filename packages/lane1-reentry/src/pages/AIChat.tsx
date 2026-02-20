import { AIChatPanel } from '@nfp/shared';

export default function AIChat() {
  return (
    <div className="h-[calc(100vh-8rem)]">
      <AIChatPanel persona="lifeNavigator" />
    </div>
  );
}
