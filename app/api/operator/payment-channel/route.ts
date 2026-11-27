import { proxyPaymentChannel } from '@/features/operator/payment-settings/paymentChannelProxy';
export const GET = (request: Request) => proxyPaymentChannel(request, 'operator');
export const PUT = (request: Request) => proxyPaymentChannel(request, 'operator');
