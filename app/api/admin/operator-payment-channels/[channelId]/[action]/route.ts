import { proxyPaymentChannel } from '@/features/operator/payment-settings/paymentChannelProxy';
export async function POST(request: Request, context: { params: Promise<{ channelId: string; action: string }> }) {
  const { channelId, action } = await context.params;
  return proxyPaymentChannel(request, 'admin', [channelId, action]);
}
