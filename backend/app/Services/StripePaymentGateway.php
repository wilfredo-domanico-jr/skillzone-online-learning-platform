<?php

declare(strict_types=1);

namespace App\Services;

use App\Contracts\PaymentGateway;
use App\Exceptions\InvalidWebhookSignatureException;
use App\Models\Order;
use Stripe\Exception\SignatureVerificationException;
use Stripe\StripeClient;
use Stripe\Webhook;

class StripePaymentGateway implements PaymentGateway
{
    public function __construct(private readonly StripeClient $client)
    {
    }

    public function createCheckoutSession(Order $order, string $successUrl, string $cancelUrl): array
    {
        $lineItems = $order->items->map(fn ($item) => [
            'price_data' => [
                'currency' => $order->currency,
                'product_data' => ['name' => $item->course->title],
                'unit_amount' => (int) round((float) $item->price_at_purchase * 100),
            ],
            'quantity' => 1,
        ])->all();

        $params = [
            'mode' => 'payment',
            'line_items' => $lineItems,
            'success_url' => $successUrl,
            'cancel_url' => $cancelUrl,
            'customer_email' => $order->user->email,
            'client_reference_id' => (string) $order->id,
            'metadata' => ['order_id' => $order->id],
        ];

        if ((float) $order->discount_total > 0) {
            $coupon = $this->client->coupons->create([
                'amount_off' => (int) round((float) $order->discount_total * 100),
                'currency' => $order->currency,
                'duration' => 'once',
                'name' => 'Order #'.$order->id.' discount',
            ]);

            $params['discounts'] = [['coupon' => $coupon->id]];
        }

        $session = $this->client->checkout->sessions->create($params);

        return ['id' => $session->id, 'url' => $session->url];
    }

    public function constructWebhookEvent(string $payload, string $signature): array
    {
        try {
            $event = Webhook::constructEvent($payload, $signature, config('services.stripe.webhook_secret'));
        } catch (SignatureVerificationException|\UnexpectedValueException $e) {
            throw new InvalidWebhookSignatureException($e->getMessage(), previous: $e);
        }

        return $event->toArray();
    }
}
