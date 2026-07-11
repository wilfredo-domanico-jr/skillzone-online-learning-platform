<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $notifications = $request->user()->notifications()->paginate($request->integer('per_page', 20));

        $paginated = $notifications->through(fn ($n) => [
            'id' => $n->id,
            'type' => $n->data['type'] ?? null,
            'data' => $n->data,
            'read_at' => $n->read_at,
            'created_at' => $n->created_at,
        ]);

        return response()->json(array_merge($paginated->toArray(), [
            'unread_count' => $request->user()->unreadNotifications()->count(),
        ]));
    }

    public function markRead(Request $request, string $notificationId): JsonResponse
    {
        $notification = $request->user()->notifications()->where('id', $notificationId)->firstOrFail();
        $notification->markAsRead();

        return response()->json(['message' => 'Marked as read.']);
    }

    public function markAllRead(Request $request): JsonResponse
    {
        $request->user()->unreadNotifications->markAsRead();

        return response()->json(['message' => 'All notifications marked as read.']);
    }
}
