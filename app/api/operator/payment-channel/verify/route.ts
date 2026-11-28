import { proxyPaymentChannel } from '@/features/operator/payment-settings/paymentChannelProxy';
export const POST = (request: Request) => proxyPaymentChannel(request, 'operator', ['verify']);
