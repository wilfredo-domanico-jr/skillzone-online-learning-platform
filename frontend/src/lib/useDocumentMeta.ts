import { useEffect } from 'react';

const DEFAULT_TITLE = 'SkillZone';
const DEFAULT_DESCRIPTION = 'Learn new skills from expert instructors — browse courses, enroll, and start learning today.';

/**
 * Sets document.title and the meta description tag for the current page,
 * restoring the site defaults on unmount. No react-helmet-async dependency —
 * this SPA only ever renders one route at a time, so direct DOM writes on
 * mount/unmount are simpler than a virtual head manager.
 */
export default function useDocumentMeta(title?: string | null, description?: string | null) {
    useEffect(() => {
        document.title = title ? `${title} · ${DEFAULT_TITLE}` : DEFAULT_TITLE;

        const tag = document.querySelector('meta[name="description"]');
        if (tag) tag.setAttribute('content', description || DEFAULT_DESCRIPTION);

        return () => {
            document.title = DEFAULT_TITLE;
            if (tag) tag.setAttribute('content', DEFAULT_DESCRIPTION);
        };
    }, [title, description]);
}
