<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\CategoryResource;
use App\Models\Category;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Cache;

class CategoryController extends Controller
{
    /**
     * The category list changes rarely (there's no admin CRUD for it yet)
     * and is fetched on every catalog page load, so it's cached for an hour
     * rather than hitting the DB every time.
     */
    public function index(): JsonResponse
    {
        $categories = Cache::remember('categories:all', 3600, fn () => Category::orderBy('name')->get());

        return CategoryResource::collection($categories)->response();
    }
}
