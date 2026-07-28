<?php

declare(strict_types=1);

namespace App\Http\Controllers\Concerns;

use Illuminate\Database\Eloquent\Relations\Relation;

/**
 * Shared by CourseSectionController, LessonController, and
 * Instructor\QuizController's reorder endpoints — each persists a new
 * position for every id in an ordered array, ignoring any id that isn't
 * actually a child of the given relation.
 */
trait ReordersModels
{
    protected function reorderPositions(Relation $relation, array $ids): void
    {
        $validIds = $relation->whereIn('id', $ids)->pluck('id');
        $modelClass = get_class($relation->getRelated());

        foreach ($ids as $position => $id) {
            if ($validIds->contains($id)) {
                $modelClass::whereKey($id)->update(['position' => $position]);
            }
        }
    }
}
