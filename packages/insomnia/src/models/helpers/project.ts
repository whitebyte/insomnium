import { isDefaultProject, Project } from '../project';

export const sortProjects = (projects: Project[]) => [
  ...projects.filter(isDefaultProject),
  ...projects.filter(p => !isDefaultProject(p))
    .sort((a, b) => a.name.localeCompare(b.name))
];
