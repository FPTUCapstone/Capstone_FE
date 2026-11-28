import { proxyPaymentChannel } from '@/features/operator/payment-settings/paymentChannelProxy';
export const GET = (request: Request) => proxyPaymentChannel(request, 'admin');
