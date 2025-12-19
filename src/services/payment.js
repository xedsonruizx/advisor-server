// Mock Payment Service for Chile (Placeholder for WebPay / Flow / MercadoPago)
// En un entorno real, aquí se integraría el SDK de la pasarela chilena.

export async function createCheckoutSession({ plan, customerId, successUrl, cancelUrl }) {
  // Simulamos un retraso de red
  // await new Promise(resolve => setTimeout(resolve, 500));

  console.log(`[Payment Service] Iniciando transacción para cliente ${customerId} por ${plan.price} ${plan.currency}`);
  
  // Como no hay una pasarela real configurada aún, devolvemos la URL de éxito directamente
  // Esto simula que el pago fue "exitoso" inmediatamente para fines de demostración.
  // En producción, devolveríamos la URL de redirección a Webpay/Flow.
  
  // TODO: Integrar Flow.cl o WebPay Plus aquí.
  
  return { url: successUrl }
}
