<?php

namespace Tests\Fakes;

use App\Contracts\PaymentGateway;
use App\Models\Order;
use Stripe\Exception\ApiConnectionException;

/**
 * Test double bound in place of StripePaymentGateway so checkout/webhook
 * logic is verifiable without real Stripe test-mode credentials. Records
 * created sessions for assertions and skips real signature verification —
 * constructWebhookEvent() just decodes the JSON payload tests hand it.
 */
class FakePaymentGateway implements PaymentGateway
{
    /** @var array<int, array{id: string, order: Order, successUrl: string, cancelUrl: string}> */
    public array $createdSessions = [];

    public bool $shouldFail = false;

    public function createCheckoutSession(Order $order, string $successUrl, string $cancelUrl): array
    {
        if ($this->shouldFail) {
            throw new ApiConnectionException('Simulated Stripe outage.');
        }

        $id = 'cs_test_'.$order->id;

        $this->createdSessions[] = compact('id', 'order', 'successUrl', 'cancelUrl');

        return ['id' => $id, 'url' => "https://checkout.stripe.test/{$id}"];
    }

    public function constructWebhookEvent(string $payload, string $signature): array
    {
        return json_decode($payload, true);
    }
}
