<?php

declare(strict_types=1);

namespace App\Contracts;

use App\Models\Order;

interface PaymentGateway
{
    /**
     * Create a hosted checkout session for the given (already-priced) order.
     *
     * @return array{id: string, url: string}
     */
    public function createCheckoutSession(Order $order, string $successUrl, string $cancelUrl): array;

    /**
     * Verify and decode an incoming webhook payload.
     *
     * @return array{type: string, data: array}
     *
     * @throws \App\Exceptions\InvalidWebhookSignatureException
     */
    public function constructWebhookEvent(string $payload, string $signature): array;
}
