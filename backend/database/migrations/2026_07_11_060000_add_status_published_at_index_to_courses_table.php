<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * The public catalog's default query filters on status and sorts by
     * published_at — the existing single-column status index doesn't cover
     * that sort, so large catalogs still need a filesort. A composite index
     * makes the common case (published, newest-first) index-only.
     */
    public function up(): void
    {
        Schema::table('courses', function (Blueprint $table) {
            $table->index(['status', 'published_at']);
        });
    }

    public function down(): void
    {
        Schema::table('courses', function (Blueprint $table) {
            $table->dropIndex(['status', 'published_at']);
        });
    }
};
