// Swaps `id` with its neighbor `direction` steps away (-1 up, +1 down) within
// `ids`. Returns null if the swap would go out of bounds (caller no-ops).
export function swapPosition(ids: number[], id: number, direction: number): number[] | null {
    const index = ids.indexOf(id);
    const swapWith = index + direction;
    if (swapWith < 0 || swapWith >= ids.length) return null;

    const swapped = [...ids];
    [swapped[index], swapped[swapWith]] = [swapped[swapWith], swapped[index]];
    return swapped;
}
