import { IconName } from '@fortawesome/fontawesome-svg-core';
import React, { FC, Fragment, useState } from 'react';
import {
    Button,
    GridList,
    Heading,
    Input,
    Item,
    ListBox,
    Menu,
    MenuTrigger,
    Popover,
    SearchField,
    Select,
    SelectValue
} from 'react-aria-components';
import {
    LoaderFunction,
    matchPath,
    redirect,
    useFetcher,
    useLoaderData,
    useNavigate,
    useParams,
    useSearchParams
} from 'react-router-dom';

import { parseApiSpec, ParsedApiSpec } from '../../common/api-specs';
import {
    DASHBOARD_SORT_ORDERS,
    DashboardSortOrder,
    dashboardSortOrderName,
    getProductName
} from '../../common/constants';
import { fuzzyMatchAll, isNotNullOrUndefined } from '../../common/misc';
import { descendingNumberSort, sortMethodMap } from '../../common/sorting';
import { strings } from '../../common/strings';
import * as models from '../../models';
import { ApiSpec } from '../../models/api-spec';
import { CaCertificate } from '../../models/ca-certificate';
import { ClientCertificate } from '../../models/client-certificate';
import { sortProjects } from '../../models/helpers/project';
import {
    DEFAULT_PROJECT_ID,
    Project
} from '../../models/project';
import { isDesign, Workspace } from '../../models/workspace';
import { WorkspaceMeta } from '../../models/workspace-meta';
import { guard } from '../../utils/guard';
import { ProjectDropdown } from '../components/dropdowns/project-dropdown';

import { WorkspaceCardDropdown } from '../components/dropdowns/workspace-card-dropdown';
import { ErrorBoundary } from '../components/error-boundary';
import { Icon } from '../components/icon';
import { showAlert, showPrompt } from '../components/modals';
import { ImportModal } from '../components/modals/import-modal';
import { EmptyStatePane } from '../components/panes/project-empty-state-pane';
import { SidebarLayout } from '../components/sidebar-layout';
import { TimeFromNow } from '../components/time-from-now';

export interface WorkspaceWithMetadata {
    _id: string;
    hasUnsavedChanges: boolean;
    lastModifiedTimestamp: number;
    created: number;
    modifiedLocally: number;
    spec: Record<string, any> | null;
    specFormat: 'openapi' | 'swagger' | null;
    name: string;
    apiSpec: ApiSpec | null;
    specFormatVersion: string | null;
    workspace: Workspace;
    workspaceMeta: WorkspaceMeta;
    clientCertificates: ClientCertificate[];
    caCertificate: CaCertificate | null;
}

export const indexLoader: LoaderFunction = async ({ params }) => {
    const projects = await models.project.all();

    if (projects[0]._id) {
        return redirect(
            `/project/${projects[0]._id}`
        );
    }

    return;
};

export interface ProjectLoaderData {
    workspaces: WorkspaceWithMetadata[];
    allFilesCount: number;
    documentsCount: number;
    collectionsCount: number;
    projectsCount: number;
    activeProject: Project;
    projects: Project[];
}

export const loader: LoaderFunction = async ({
    params,
    request
}): Promise<ProjectLoaderData> => {
    const search = new URL(request.url).searchParams;
    const { projectId } = params;
    guard(projectId, 'projectId parameter is required');
    const sortOrder = search.get('sortOrder') || 'modified-desc';
    const filter = search.get('filter') || '';
    const scope = search.get('scope') || 'all';
    const projectName = search.get('projectName') || '';

    let project = await models.project.getById(projectId);
    if (!project) {
        const defaultProject = await models.project.getById(DEFAULT_PROJECT_ID);
        project =
      defaultProject ||
      await models.project.create({
          _id: DEFAULT_PROJECT_ID,
          name: getProductName()
      });
    }
    guard(project, 'Project was not found');

    const projectWorkspaces = await models.workspace.findByParentId(project._id);

    const getWorkspaceMetaData = async (
        workspace: Workspace
    ): Promise<WorkspaceWithMetadata> => {
        const apiSpec = await models.apiSpec.getByParentId(workspace._id);

        let spec: ParsedApiSpec['contents'] = null;
        let specFormat: ParsedApiSpec['format'] = null;
        let specFormatVersion: ParsedApiSpec['formatVersion'] = null;
        if (apiSpec) {
            try {
                const result = parseApiSpec(apiSpec.contents);
                spec = result.contents;
                specFormat = result.format;
                specFormatVersion = result.formatVersion;
            } catch (err) {
                // Assume there is no spec
                // TODO: Check for parse errors if it's an invalid spec
            }
        }
        const workspaceMeta = await models.workspaceMeta.getOrCreateByParentId(
            workspace._id
        );
        guard(workspaceMeta, 'WorkspaceMeta was not found');

        // WorkspaceMeta is a good proxy for last modified time
        const workspaceModified = workspaceMeta?.modified || workspace.modified;

        const modifiedLocally = isDesign(workspace)
            ? apiSpec?.modified || 0
            : workspaceModified;

        // Span spec, workspace and sync related timestamps for card last modified label and sort order
        const lastModifiedFrom = [
            workspace?.modified,
            workspaceMeta?.modified,
            modifiedLocally
        ];

        const lastModifiedTimestamp = lastModifiedFrom
            .filter(isNotNullOrUndefined)
            .sort(descendingNumberSort)[0];

        const hasUnsavedChanges = Boolean(
            isDesign(workspace)
        );

        const clientCertificates = await models.clientCertificate.findByParentId(
            workspace._id
        );

        return {
            _id: workspace._id,
            hasUnsavedChanges,
            lastModifiedTimestamp,
            created: workspace.created,
            modifiedLocally,
            spec,
            specFormat,
            name: workspace.name,
            apiSpec,
            specFormatVersion,
            workspaceMeta,
            clientCertificates,
            caCertificate: await models.caCertificate.findByParentId(workspace._id),
            workspace
        };
    };

    // Fetch all workspace meta data in parallel
    const workspacesWithMetaData = await Promise.all(
        projectWorkspaces.map(getWorkspaceMetaData)
    );

    const workspaces = workspacesWithMetaData
        .filter(w => scope !== 'all' ? w.workspace.scope === scope : true)
    // @TODO - Figure out if the database has a way to sort/filter items that could replace this logic.
        .filter(workspace =>
            filter
                ? Boolean(
                    fuzzyMatchAll(
                        filter,
                        // Use the filter string to match against these properties
                        [
                            workspace.name,
                            workspace.workspace.scope === 'design'
                                ? 'document'
                                : 'collection',
                            workspace.specFormatVersion || ''
                        ],
                        { splitSpace: true, loose: true }
                    )?.indexes
                )
                : true
        )
        .sort((a, b) => sortMethodMap[sortOrder as DashboardSortOrder](a, b));

    const allProjects = await models.project.all();

    const projects = sortProjects(allProjects).filter(p =>
        p.name.toLowerCase().includes(projectName.toLowerCase())
    );

    return {
        workspaces,
        projects,
        projectsCount: allProjects.length,
        activeProject: project,
        allFilesCount: workspacesWithMetaData.length,
        documentsCount: workspacesWithMetaData.filter(
            w => w.workspace.scope === 'design'
        ).length,
        collectionsCount: workspacesWithMetaData.filter(
            w => w.workspace.scope === 'collection'
        ).length
    };
};

const ProjectRoute: FC = () => {
    const {
        workspaces,
        activeProject,
        projects,
        allFilesCount,
        collectionsCount,
        documentsCount,
        projectsCount
    } = useLoaderData() as ProjectLoaderData;

    const { projectId } = useParams() as {
        projectId: string;
    };

    const [searchParams, setSearchParams] = useSearchParams();
    const fetcher = useFetcher();
    const navigate = useNavigate();
    const filter = searchParams.get('filter') || '';
    const sortOrder =
    (searchParams.get('sortOrder') as DashboardSortOrder) || 'modified-desc';
    const [importModalType, setImportModalType] = useState<
    'uri' | 'file' | 'clipboard' | null
    >(null);

    const createNewCollection = () => {
        showPrompt({
            title: 'Create New Request Collection',
            submitName: 'Create',
            placeholder: 'My Collection',
            defaultValue: 'My Collection',
            selectText: true,
            onComplete: async (name: string) => {
                fetcher.submit(
                    {
                        name,
                        scope: 'collection'
                    },
                    {
                        action: `/project/${activeProject._id}/workspace/new`,
                        method: 'post'
                    }
                );
            }
        });
    };

    const createNewDocument = () => {
        showPrompt({
            title: 'Create New Design Document',
            submitName: 'Create',
            placeholder: 'my-spec.yaml',
            defaultValue: 'my-spec.yaml',
            selectText: true,
            onComplete: async (name: string) => {
                fetcher.submit(
                    {
                        name,
                        scope: 'design'
                    },
                    {
                        action: `/project/${activeProject._id}/workspace/new`,
                        method: 'post'
                    }
                );
            }
        });
    };

    const createNewProjectFetcher = useFetcher();

    const createInProjectActionList: {
        id: string;
        name: string;
        icon: IconName;
        action: () => void;
    }[] = [
        {
            id: 'new-collection',
            name: 'Request collection',
            icon: 'bars',
            action: createNewCollection
        },
        {
            id: 'new-document',
            name: 'Design document',
            icon: 'file',
            action: createNewDocument
        },
        {
            id: 'import',
            name: 'Import',
            icon: 'file-import',
            action: () => {
                setImportModalType('file');
            }
        }
    ];

    const scopeActionList: {
        id: string;
        label: string;
        icon: IconName;
        level: number;
        action?: {
            icon: IconName;
            label: string;
            run: () => void;
        };
    }[] = [
        {
            id: 'all',
            label: `All files (${allFilesCount})`,
            icon: 'folder',
            level: 0
        },
        {
            id: 'design',
            label: `Documents (${documentsCount})`,
            level: 1,
            icon: 'file',
            action: {
                icon: 'plus',
                label: 'New design document',
                run: createNewDocument
            }
        },
        {
            id: 'collection',
            label: `Collections (${collectionsCount})`,
            level: 1,
            icon: 'bars',
            action: {
                icon: 'plus',
                label: 'New request collection',
                run: createNewCollection
            }
        }
    ];

    return (
        <ErrorBoundary>
            <Fragment>
                <SidebarLayout
                    className="new-sidebar"
                    renderPageSidebar={
                        <div className="flex flex-1 flex-col overflow-hidden divide-solid divide-y divide-[--hl-md]">
                            <div className="flex flex-col flex-1">
                                <Heading className="p-[--padding-sm] uppercase text-xs">
                                    Projects ({projectsCount})
                                </Heading>
                                {(
                                    <div className="flex justify-between gap-1 p-[--padding-sm]">
                                        <SearchField
                                            aria-label="Projects filter"
                                            className="group relative flex-1"
                                            defaultValue={searchParams.get('filter')?.toString() ?? ''}
                                            onChange={projectName => {
                                                setSearchParams({
                                                    ...Object.fromEntries(searchParams.entries()),
                                                    projectName
                                                });
                                            }}
                                        >
                                            <Input
                                                placeholder="Filter"
                                                className="py-1 placeholder:italic w-full pl-2 pr-7 rounded-sm border border-solid border-[--hl-sm] bg-[--color-bg] text-[--color-font] focus:outline-none focus:ring-1 focus:ring-[--hl-md] transition-colors"
                                            />
                                            <div className="flex items-center px-2 absolute right-0 top-0 h-full">
                                                <Button className="flex group-data-[empty]:hidden items-center justify-center aspect-square w-5 aria-pressed:bg-[--hl-sm] rounded-sm text-[--color-font] hover:bg-[--hl-xs] focus:ring-inset ring-1 ring-transparent focus:ring-[--hl-md] transition-all text-sm">
                                                    <Icon icon="close" />
                                                </Button>
                                            </div>
                                        </SearchField>

                                        <Button
                                            onPress={() => {
                                                const defaultValue = `My ${strings.project.singular}`;
                                                showPrompt({
                                                    title: `Create New ${strings.project.singular}`,
                                                    submitName: 'Create',
                                                    placeholder: defaultValue,
                                                    defaultValue,
                                                    selectText: true,
                                                    onComplete: async name =>
                                                        createNewProjectFetcher.submit(
                                                            {
                                                                name
                                                            },
                                                            {
                                                                action: `/project/new`,
                                                                method: 'post'
                                                            }
                                                        )
                                                });
                                            }}
                                            aria-label="Create new Project"
                                            className="flex items-center justify-center h-full aspect-square aria-pressed:bg-[--hl-sm] rounded-sm text-[--color-font] hover:bg-[--hl-xs] focus:ring-inset ring-1 ring-transparent focus:ring-[--hl-md] transition-all text-sm"
                                        >
                                            <Icon icon="plus-circle" />
                                        </Button>
                                    </div>
                                )}

                                <GridList
                                    aria-label="Projects"
                                    items={projects}
                                    className="overflow-y-auto flex-1 data-[empty]:py-0 py-[--padding-sm]"
                                    disallowEmptySelection
                                    selectedKeys={[activeProject._id]}
                                    selectionMode="single"
                                    onSelectionChange={keys => {
                                        if (keys !== 'all') {
                                            const value = keys.values().next().value;
                                            navigate({
                                                pathname: `/project/${value}`,
                                                search: searchParams.toString()
                                            });
                                        }
                                    }}
                                >
                                    {item => {
                                        return (
                                            <Item
                                                key={item._id}
                                                id={item._id}
                                                textValue={item.name}
                                                className="group outline-none select-none"
                                            >
                                                <div className="flex select-none outline-none group-aria-selected:text-[--color-font] relative group-hover:bg-[--hl-xs] group-focus:bg-[--hl-sm] transition-colors gap-2 px-4 items-center h-[--line-height-xs] w-full overflow-hidden text-[--hl]">
                                                    <span className="group-aria-selected:bg-[--color-surprise] transition-colors top-0 left-0 absolute h-full w-[2px] bg-transparent" />
                                                    <Icon
                                                        icon={'laptop'}
                                                    />
                                                    <span className="truncate">{item.name}</span>
                                                    <span className="flex-1" />
                                                    <ProjectDropdown project={item} />
                                                </div>
                                            </Item>
                                        );
                                    }}
                                </GridList>
                            </div>
                            <GridList
                                aria-label="Scope filter"
                                items={scopeActionList}
                                className="overflow-y-auto flex-1 data-[empty]:py-0 py-[--padding-sm]"
                                disallowEmptySelection
                                selectedKeys={[searchParams.get('scope') || 'all']}
                                selectionMode="single"
                                onSelectionChange={keys => {
                                    if (keys !== 'all') {
                                        const value = keys.values().next().value;
                                        setSearchParams({
                                            ...Object.fromEntries(searchParams.entries()),
                                            scope: value
                                        });
                                    }
                                }}
                            >
                                {item => {
                                    return (
                                        <Item textValue={item.label} className="group outline-none select-none">
                                            <div
                                                className="flex select-none outline-none group-aria-selected:text-[--color-font] relative group-aria-selected:bg-[--hl-sm] group-hover:bg-[--hl-xs] group-focus:bg-[--hl-sm] transition-colors gap-2 px-4 items-center h-[--line-height-xs] w-full overflow-hidden text-[--hl]"
                                                style={{
                                                    paddingLeft: `${item.level + 1}rem`
                                                }}
                                            >
                                                <Icon icon={item.icon} />

                                                <span className="truncate capitalize">
                                                    {item.label}
                                                </span>
                                                <span className="flex-1" />
                                                {item.action &&
                                                    <Button
                                                        onPress={item.action.run}
                                                        aria-label={item.action.label}
                                                        className="opacity-80 items-center hover:opacity-100 focus:opacity-100 data-[pressed]:opacity-100 flex group-focus:opacity-100 group-hover:opacity-100 justify-center h-6 aspect-square aria-pressed:bg-[--hl-sm] rounded-sm text-[--color-font] hover:bg-[--hl-xs] focus:ring-inset ring-1 ring-transparent focus:ring-[--hl-md] transition-all text-sm"
                                                    >
                                                        <Icon icon={item.action.icon} />
                                                    </Button>
                                                }
                                            </div>
                                        </Item>
                                    );
                                }}
                            </GridList>
                        </div>
                    }
                    renderPaneOne={
                        <div className="w-full h-full flex flex-col overflow-hidden">
                            <div className="flex justify-between w-full gap-1 p-[--padding-md]">
                                <SearchField
                                    aria-label="Workspaces filter"
                                    className="group relative flex-1"
                                    defaultValue={searchParams.get('filter')?.toString()}
                                    onChange={filter => {
                                        setSearchParams({
                                            ...Object.fromEntries(searchParams.entries()),
                                            filter
                                        });
                                    }}
                                >
                                    <Input
                                        placeholder="Filter"
                                        className="py-1 placeholder:italic w-full pl-2 pr-7 rounded-sm border border-solid border-[--hl-sm] bg-[--color-bg] text-[--color-font] focus:outline-none focus:ring-1 focus:ring-[--hl-md] transition-colors"
                                    />
                                    <div className="flex items-center px-2 absolute right-0 top-0 h-full">
                                        <Button className="flex group-data-[empty]:hidden items-center justify-center aspect-square w-5 aria-pressed:bg-[--hl-sm] rounded-sm text-[--color-font] hover:bg-[--hl-xs] focus:ring-inset ring-1 ring-transparent focus:ring-[--hl-md] transition-all text-sm">
                                            <Icon icon="close" />
                                        </Button>
                                    </div>
                                </SearchField>
                                <Select
                                    aria-label="Sort order"
                                    className="h-full aspect-square"
                                    selectedKey={sortOrder}
                                    onSelectionChange={order =>
                                        setSearchParams({
                                            ...Object.fromEntries(searchParams.entries()),
                                            sortOrder: order.toString()
                                        })
                                    }
                                    items={DASHBOARD_SORT_ORDERS.map(order => {
                                        return {
                                            id: order,
                                            name: dashboardSortOrderName[order]
                                        };
                                    })}
                                >
                                    <Button
                                        aria-label="Select sort order"
                                        className="flex flex-shrink-0 items-center justify-center aspect-square h-full aria-pressed:bg-[--hl-sm] rounded-sm text-[--color-font] hover:bg-[--hl-xs] focus:ring-inset ring-1 ring-transparent focus:ring-[--hl-md] transition-all text-sm"
                                    >
                                        <Icon icon="sort" />
                                    </Button>
                                    <Popover className="min-w-max">
                                        <ListBox<{
                                            id: string;
                                            name: string;
                                        }> className="border select-none text-sm min-w-max border-solid border-[--hl-sm] shadow-lg bg-[--color-bg] py-2 rounded-md overflow-y-auto max-h-[85vh] focus:outline-none"
                                        >
                                            {item =>
                                                <Item
                                                    id={item.id}
                                                    key={item.id}
                                                    className="flex gap-2 px-[--padding-md] aria-selected:font-bold items-center text-[--color-font] h-[--line-height-xs] w-full text-md whitespace-nowrap bg-transparent hover:bg-[--hl-sm] disabled:cursor-not-allowed focus:bg-[--hl-xs] focus:outline-none transition-colors"
                                                    aria-label={item.name}
                                                    textValue={item.name}
                                                    value={item}
                                                >
                                                    {({ isSelected }) =>
                                                        <Fragment>
                                                            <span>{item.name}</span>
                                                            {isSelected &&
                                                                <Icon
                                                                    icon="check"
                                                                    className="text-[--color-success] justify-self-end"
                                                                />
                                                            }
                                                        </Fragment>
                                                    }
                                                </Item>
                                            }
                                        </ListBox>
                                    </Popover>
                                </Select>

                                <MenuTrigger>
                                    <Button
                                        aria-label="Create in project"
                                        className="flex items-center justify-center h-full aspect-square aria-pressed:bg-[--hl-sm] rounded-sm text-[--color-font] hover:bg-[--hl-xs] focus:ring-inset ring-1 ring-transparent focus:ring-[--hl-md] transition-all text-sm"
                                    >
                                        <Icon icon="plus-circle" />
                                    </Button>
                                    <Popover className="min-w-max">
                                        <Menu
                                            aria-label="Create in project actions"
                                            selectionMode="single"
                                            onAction={key => {
                                                const item = createInProjectActionList.find(
                                                    item => item.id === key
                                                );
                                                if (item) {
                                                    item.action();
                                                }
                                            }}
                                            items={createInProjectActionList}
                                            className="border select-none text-sm min-w-max border-solid border-[--hl-sm] shadow-lg bg-[--color-bg] py-2 rounded-md overflow-y-auto max-h-[85vh] focus:outline-none"
                                        >
                                            {item =>
                                                <Item
                                                    key={item.id}
                                                    id={item.id}
                                                    className="flex gap-2 px-[--padding-md] aria-selected:font-bold items-center text-[--color-font] h-[--line-height-xs] w-full text-md whitespace-nowrap bg-transparent hover:bg-[--hl-sm] disabled:cursor-not-allowed focus:bg-[--hl-xs] focus:outline-none transition-colors"
                                                    aria-label={item.name}
                                                >
                                                    <Icon icon={item.icon} />
                                                    <span>{item.name}</span>
                                                </Item>
                                            }
                                        </Menu>
                                    </Popover>
                                </MenuTrigger>

                            </div>

                            <GridList
                                aria-label="Workspaces"
                                items={workspaces}
                                onAction={key => {
                                    navigate(
                                        `/project/${projectId}/workspace/${key}/debug`
                                    );
                                }}
                                className="flex-1 overflow-y-auto data-[empty]:flex data-[empty]:justify-center grid [grid-template-columns:repeat(auto-fit,200px)] [grid-template-rows:repeat(auto-fit,200px)] gap-4 p-[--padding-md]"
                                renderEmptyState={() => {
                                    if (filter) {
                                        return (
                                            <div className="w-full h-full flex items-center justify-center">
                                                <p className="notice subtle">
                                                    No documents found for <strong>{filter}</strong>
                                                </p>
                                            </div>
                                        );
                                    }

                                    return (
                                        <EmptyStatePane
                                            createRequestCollection={createNewCollection}
                                            createDesignDocument={createNewDocument}
                                            importFrom={() => setImportModalType('file')}
                                        />
                                    );
                                }}
                            >
                                {item => {
                                    return (
                                        <Item
                                            key={item._id}
                                            id={item._id}
                                            textValue={item.name}
                                            className="[&_[role=gridcell]]:flex-1 [&_[role=gridcell]]:overflow-hidden [&_[role=gridcell]]:flex [&_[role=gridcell]]:flex-col outline-none p-[--padding-md] flex select-none w-full rounded-sm hover:shadow-md aspect-square ring-1 ring-[--hl-md] hover:ring-[--hl-sm] focus:ring-[--hl-lg] hover:bg-[--hl-xs] focus:bg-[--hl-sm] transition-all"
                                        >
                                            <div className="flex gap-2">
                                                <div className="flex items-center rounded-sm gap-2 bg-[--hl-xs] text-[--color-font] text-sm">
                                                    {isDesign(item.workspace) ?
                                                        <div className="px-2 rounded-s-sm bg-[--color-info] text-[--color-font-info]">
                                                            <Icon icon="file" />
                                                        </div>
                                                        :
                                                        <div className="px-2 rounded-s-sm bg-[--color-surprise] text-[--color-font-surprise]">
                                                            <Icon icon="bars" />
                                                        </div>
                                                    }
                                                    <span className="truncate pr-2">
                                                        {isDesign(item.workspace)
                                                            ? 'Document'
                                                            : 'Collection'}
                                                    </span>
                                                </div>
                                                <span className="flex-1" />
                                                <WorkspaceCardDropdown
                                                    {...item}
                                                    project={activeProject}
                                                    projects={projects}
                                                />
                                            </div>
                                            <Heading className="pt-4 text-lg font-bold truncate">
                                                {item.workspace.name}
                                            </Heading>
                                            <div className="flex-1 flex flex-col gap-2 justify-end text-sm text-[--hl]">
                                                {typeof item.spec?.info?.version === 'string' &&
                                                    <div className="flex-1 pt-2">
                                                        {item.spec.info.version.startsWith('v') ? '' : 'v'}
                                                        {item.spec.info.version}
                                                    </div>
                                                }
                                                {item.specFormat &&
                                                    <div className="text-sm flex items-center gap-2">
                                                        <Icon icon="file-alt" />
                                                        <span>
                                                            {item.specFormat === 'openapi'
                                                                ? 'OpenAPI'
                                                                : 'Swagger'}{' '}
                                                            {item.specFormatVersion}
                                                        </span>
                                                    </div>
                                                }
                                                {item.lastModifiedTimestamp &&
                                                    <div className="text-sm flex items-center gap-2 truncate">
                                                        <Icon icon="clock" />
                                                        <TimeFromNow
                                                            timestamp={
                                                                item.hasUnsavedChanges &&
                                  item.modifiedLocally ||
                                item.lastModifiedTimestamp
                                                            }
                                                        />
                                                        <span className="truncate">
                                                            {!item.hasUnsavedChanges}
                                                        </span>
                                                    </div>
                                                }
                                            </div>
                                        </Item>
                                    );
                                }}
                            </GridList>
                        </div>
                    }
                />
                {importModalType &&
                    <ImportModal
                        onHide={() => setImportModalType(null)}
                        projectName={activeProject.name}
                        from={{ type: importModalType }}
                        defaultProjectId={activeProject._id}
                    />
                }
            </Fragment>
        </ErrorBoundary>
    );
};

export default ProjectRoute;
