import { describe, expect, it } from '@jest/globals';

import { DEFAULT_PROJECT_ID } from '../../project';
import { sortProjects } from '../project';

const defaultProject = { name: 'a', remoteId: null, _id: DEFAULT_PROJECT_ID };

const localA = { name: 'a', _id: 'localA' };
const localB = { name: 'b', _id: 'localB' };

describe('sortProjects', () => {
    it('sorts projects by default > local > remote > name', () => {
        const unSortedProjects = [
            localB,
            defaultProject,
            localA
        ];
        const result = sortProjects(unSortedProjects);

        const sortedProjects = [
            defaultProject,
            localA,
            localB
        ];
        expect(result).toEqual(sortedProjects);
    });
});
