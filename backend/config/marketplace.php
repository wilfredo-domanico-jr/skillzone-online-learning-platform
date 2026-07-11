<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Platform commission
    |--------------------------------------------------------------------------
    |
    | Percentage of each course sale the platform keeps; the remainder is
    | owed to the instructor and tracked in instructor_payouts. A flat rate
    | for all instructors — per-instructor/per-course overrides are a later
    | phase if ever needed.
    |
    */

    'commission_percent' => env('MARKETPLACE_COMMISSION_PERCENT', 30),

];
