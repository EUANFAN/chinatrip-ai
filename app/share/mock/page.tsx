import { ShareView } from "@/features/share/ShareView";

export default function MockSharePage() {
  return (
    <ShareView
      initialShare={{
        id: "mock-share",
        shareId: "mock",
        question: "How can foreigners use Alipay or WeChat Pay in China?",
        answer:
          "Foreign visitors can usually use Alipay and WeChat Pay by linking an international bank card before or soon after arrival.\n\n## What Foreign Visitors Must Handle\n1. Card setup: Add your Visa or Mastercard in the app and complete identity checks if prompted.\n2. Backup payment: Carry a small amount of cash and at least one physical bank card in case mobile payment fails.\n3. Local verification: Some services may ask for passport details or phone verification.\n\n## Step-by-Step Plan\n1. Install both apps: Set up Alipay and WeChat before departure if possible.\n2. Link your card: Test a small payment after arrival.\n3. Save hotel address: Keep your hotel name and address in Chinese for taxis and delivery.",
        createdAt: new Date(Date.UTC(2026, 4, 21, 8, 0)).toISOString(),
        viewCount: 0,
      }}
    />
  );
}
