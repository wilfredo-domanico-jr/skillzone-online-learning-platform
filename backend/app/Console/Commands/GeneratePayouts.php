<?php

namespace App\Console\Commands;

use App\Models\InstructorPayout;
use App\Models\OrderItem;
use Illuminate\Console\Command;
use Illuminate\Support\Carbon;

class GeneratePayouts extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'payouts:generate
        {--start= : Period start date (Y-m-d), defaults to the 1st of last calendar month}
        {--end= : Period end date (Y-m-d), defaults to the last day of last calendar month}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Sum paid order items per instructor for a period into instructor_payouts ledger rows';

    public function handle(): int
    {
        $start = $this->option('start') ? Carbon::parse($this->option('start'))->startOfDay() : now()->subMonthNoOverflow()->startOfMonth();
        $end = $this->option('end') ? Carbon::parse($this->option('end'))->endOfDay() : now()->subMonthNoOverflow()->endOfMonth();

        $commissionPercent = (float) config('marketplace.commission_percent');

        $totals = OrderItem::query()
            ->join('orders', 'orders.id', '=', 'order_items.order_id')
            ->where('orders.status', 'paid')
            ->whereBetween('orders.paid_at', [$start, $end])
            ->selectRaw('order_items.instructor_id, SUM(order_items.price_at_purchase) as gross')
            ->groupBy('order_items.instructor_id')
            ->get();

        if ($totals->isEmpty()) {
            $this->info('No paid orders found in this period.');

            return self::SUCCESS;
        }

        foreach ($totals as $row) {
            $existing = InstructorPayout::where('instructor_id', $row->instructor_id)
                ->whereDate('period_start', $start->toDateString())
                ->whereDate('period_end', $end->toDateString())
                ->first();

            if ($existing) {
                $this->warn("Payout already exists for instructor #{$row->instructor_id} for this period — skipping.");

                continue;
            }

            $gross = round((float) $row->gross, 2);
            $fee = round($gross * ($commissionPercent / 100), 2);
            $net = round($gross - $fee, 2);

            InstructorPayout::create([
                'instructor_id' => $row->instructor_id,
                'period_start' => $start->toDateString(),
                'period_end' => $end->toDateString(),
                'gross_amount' => $gross,
                'platform_fee_amount' => $fee,
                'net_amount' => $net,
                'status' => 'pending',
            ]);

            $this->info("Payout generated for instructor #{$row->instructor_id}: net \${$net}");
        }

        return self::SUCCESS;
    }
}
