import { handleDelivery } from '../../server/delivery.js';

export default function delivery(request, context) {
  return handleDelivery(request, context);
}

export const config = { path: '/api/delivery' };
