import './rendererListeners';
import React, { lazy, Suspense } from 'react';
import {
    createMemoryRouter,
    matchPath,
    Outlet
} from 'react-router-dom';
import {
    ACTIVITY_DEBUG,
    ACTIVITY_SPEC,
    getProductName
} from '../common/constants';
import { initializeLogging } from '../common/log';
import { DEFAULT_PROJECT_ID } from '../models/project';
import { ErrorRoute } from './routes/error';
import Root from './routes/root';

const Project = lazy(() => import('./routes/project'));
const Workspace = lazy(() => import('./routes/workspace'));
const UnitTest = lazy(() => import('./routes/unit-test'));
const Debug = lazy(() => import('./routes/debug'));
const Design = lazy(() => import('./routes/design'));

initializeLogging();
// Handy little helper
document.body.setAttribute('data-platform', process.platform);
document.title = getProductName();

let locationHistoryEntry = `/project/${DEFAULT_PROJECT_ID}`;
const prevLocationHistoryEntry = localStorage.getItem('locationHistoryEntry');

if (prevLocationHistoryEntry && matchPath({ path: '/', end: false }, prevLocationHistoryEntry)) {
    locationHistoryEntry = prevLocationHistoryEntry;
}

export const setupRouterStuff = (beginningPath: string | null = null) => {
    const router = createMemoryRouter(
        [
            {
                path: '/',
                id: 'root',
                loader: async (...args) =>
                    (await import('./routes/root')).loader(...args),
                element: <Root />,
                errorElement: <ErrorRoute />,
                children: [
                    {
                        path: 'import',
                        children: [
                            {
                                path: 'scan',
                                action: async (...args) =>
                                    (await import('./routes/import')).scanForResourcesAction(
                                        ...args
                                    )
                            },
                            {
                                path: 'resources',
                                action: async (...args) =>
                                    (await import('./routes/importResourcesAction')).importResourcesAction(
                                        ...args
                                    )
                            }
                        ]
                    },
                    {
                        path: 'settings/update',
                        action: async (...args) =>
                            (await import('./routes/actions')).updateSettingsAction(...args)
                    },
                    {
                        path: 'project',
                        children: [
                            {
                                path: ':projectId',
                                id: '/project/:projectId',
                                loader: async (...args) =>
                                    (await import('./routes/project')).loader(...args),
                                element:
                                    <Suspense >
                                        <Project />
                                    </Suspense>
                                ,
                                children: [
                                    {
                                        path: 'delete',
                                        action: async (...args) =>
                                            (
                                                await import('./routes/actions')
                                            ).deleteProjectAction(...args)
                                    },
                                    {
                                        path: 'rename',
                                        action: async (...args) =>
                                            (
                                                await import('./routes/actions')
                                            ).renameProjectAction(...args)
                                    }
                                ]
                            },
                            {
                                path: ':projectId/workspace',
                                children: [
                                    {
                                        path: ':workspaceId',
                                        id: ':workspaceId',
                                        loader: async (...args) =>
                                            (
                                                await import('./routes/workspace')
                                            ).workspaceLoader(...args),
                                        element:
                                            <Suspense >
                                                <Workspace />
                                            </Suspense>
                                        ,
                                        children: [
                                            {
                                                path: `${ACTIVITY_DEBUG}`,
                                                loader: async (...args) =>
                                                    (await import('./routes/debug')).loader(
                                                        ...args
                                                    ),
                                                element:
                                                    <Suspense >
                                                        <Debug />
                                                    </Suspense>
                                                ,
                                                children: [
                                                    {
                                                        path: 'reorder',
                                                        action: async (...args) =>
                                                            (
                                                                await import('./routes/actions')
                                                            ).reorderCollectionAction(...args)
                                                    },
                                                    {
                                                        path: 'request/:requestId',
                                                        id: 'request/:requestId',
                                                        loader: async (...args) =>
                                                            (await import('./routes/request')).loader(
                                                                ...args
                                                            ),
                                                        element: <Outlet />,
                                                        children: [
                                                            {
                                                                path: 'send',
                                                                action: async (...args) =>
                                                                    (
                                                                        await import('./routes/request')
                                                                    ).sendAction(...args)
                                                            },
                                                            {
                                                                path: 'connect',
                                                                action: async (...args) =>
                                                                    (
                                                                        await import('./routes/request')
                                                                    ).connectAction(...args)
                                                            },
                                                            {
                                                                path: 'duplicate',
                                                                action: async (...args) =>
                                                                    (
                                                                        await import('./routes/request')
                                                                    ).duplicateRequestAction(...args)
                                                            },
                                                            {
                                                                path: 'update',
                                                                action: async (...args) =>
                                                                    (
                                                                        await import('./routes/request')
                                                                    ).updateRequestAction(...args)
                                                            },
                                                            {
                                                                path: 'update-meta',
                                                                action: async (...args) =>
                                                                    (
                                                                        await import('./routes/request')
                                                                    ).updateRequestMetaAction(...args)
                                                            },
                                                            {
                                                                path: 'response/delete-all',
                                                                action: async (...args) =>
                                                                    (
                                                                        await import('./routes/request')
                                                                    ).deleteAllResponsesAction(...args)
                                                            },
                                                            {
                                                                path: 'response/delete',
                                                                action: async (...args) =>
                                                                    (
                                                                        await import('./routes/request')
                                                                    ).deleteResponseAction(...args)
                                                            }
                                                        ]
                                                    },
                                                    {
                                                        path: 'request/new',
                                                        action: async (...args) =>
                                                            (
                                                                await import('./routes/request')
                                                            ).createRequestAction(...args)
                                                    },
                                                    {
                                                        path: 'request/delete',
                                                        action: async (...args) =>
                                                            (
                                                                await import('./routes/request')
                                                            ).deleteRequestAction(...args)
                                                    },
                                                    {
                                                        path: 'request-group/new',
                                                        action: async (...args) =>
                                                            (
                                                                await import('./routes/request-group')
                                                            ).createRequestGroupAction(...args)
                                                    },
                                                    {
                                                        path: 'request-group/delete',
                                                        action: async (...args) =>
                                                            (
                                                                await import('./routes/request-group')
                                                            ).deleteRequestGroupAction(...args)
                                                    },
                                                    {
                                                        path: 'request-group/:requestGroupId/update',
                                                        action: async (...args) => (await import('./routes/request-group')).updateRequestGroupAction(...args)
                                                    },
                                                    {
                                                        path: 'request-group/duplicate',
                                                        action: async (...args) => (await import('./routes/request-group')).duplicateRequestGroupAction(...args)
                                                    },
                                                    {
                                                        path: 'request-group/:requestGroupId/update-meta',
                                                        action: async (...args) =>
                                                            (
                                                                await import('./routes/request-group')
                                                            ).updateRequestGroupMetaAction(...args)
                                                    }
                                                ]
                                            },
                                            {
                                                path: `${ACTIVITY_SPEC}`,
                                                loader: async (...args) =>
                                                    (await import('./routes/design')).loader(
                                                        ...args
                                                    ),
                                                element:
                                                    <Suspense >
                                                        <Design />
                                                    </Suspense>
                                                ,
                                                children: [
                                                    {
                                                        path: 'update',
                                                        action: async (...args) =>
                                                            (
                                                                await import('./routes/actions')
                                                            ).updateApiSpecAction(...args)
                                                    },
                                                    {
                                                        path: 'generate-request-collection',
                                                        action: async (...args) =>
                                                            (
                                                                await import('./routes/actions')
                                                            ).generateCollectionFromApiSpecAction(
                                                                ...args
                                                            )
                                                    }
                                                ]
                                            },
                                            {
                                                path: 'cacert',
                                                children: [
                                                    {
                                                        path: 'new',
                                                        action: async (...args) =>
                                                            (
                                                                await import('./routes/actions')
                                                            ).createNewCaCertificateAction(...args)
                                                    },
                                                    {
                                                        path: 'update',
                                                        action: async (...args) =>
                                                            (
                                                                await import('./routes/actions')
                                                            ).updateCaCertificateAction(...args)
                                                    },
                                                    {
                                                        path: 'delete',
                                                        action: async (...args) =>
                                                            (
                                                                await import('./routes/actions')
                                                            ).deleteCaCertificateAction(...args)
                                                    }
                                                ]
                                            },
                                            {
                                                path: 'clientcert',
                                                children: [
                                                    {
                                                        path: 'new',
                                                        action: async (...args) =>
                                                            (
                                                                await import('./routes/actions')
                                                            ).createNewClientCertificateAction(...args)
                                                    },
                                                    {
                                                        path: 'update',
                                                        action: async (...args) =>
                                                            (
                                                                await import('./routes/actions')
                                                            ).updateClientCertificateAction(...args)
                                                    },
                                                    {
                                                        path: 'delete',
                                                        action: async (...args) =>
                                                            (
                                                                await import('./routes/actions')
                                                            ).deleteClientCertificateAction(...args)
                                                    }
                                                ]
                                            },
                                            {
                                                path: 'environment',
                                                children: [
                                                    {
                                                        path: 'update',
                                                        action: async (...args) =>
                                                            (
                                                                await import('./routes/actions')
                                                            ).updateEnvironment(...args)
                                                    },
                                                    {
                                                        path: 'delete',
                                                        action: async (...args) =>
                                                            (
                                                                await import('./routes/actions')
                                                            ).deleteEnvironmentAction(...args)
                                                    },
                                                    {
                                                        path: 'create',
                                                        action: async (...args) =>
                                                            (
                                                                await import('./routes/actions')
                                                            ).createEnvironmentAction(...args)
                                                    },
                                                    {
                                                        path: 'duplicate',
                                                        action: async (...args) =>
                                                            (
                                                                await import('./routes/actions')
                                                            ).duplicateEnvironmentAction(...args)
                                                    },
                                                    {
                                                        path: 'set-active',
                                                        action: async (...args) =>
                                                            (
                                                                await import('./routes/actions')
                                                            ).setActiveEnvironmentAction(...args)
                                                    }
                                                ]
                                            },
                                            {
                                                path: 'cookieJar',
                                                children: [
                                                    {
                                                        path: 'update',
                                                        action: async (...args) =>
                                                            (
                                                                await import('./routes/actions')
                                                            ).updateCookieJarAction(...args)
                                                    }
                                                ]
                                            },
                                            {
                                                path: 'test/*',
                                                loader: async (...args) =>
                                                    (await import('./routes/unit-test')).loader(
                                                        ...args
                                                    ),
                                                element:
                                                    <Suspense >
                                                        <UnitTest />
                                                    </Suspense>
                                                ,
                                                children: [
                                                    {
                                                        index: true,
                                                        loader: async (...args) =>
                                                            (
                                                                await import('./routes/test-suite')
                                                            ).indexLoader(...args)
                                                    },
                                                    {
                                                        path: 'test-suite',
                                                        children: [
                                                            {
                                                                index: true,
                                                                loader: async (...args) =>
                                                                    (
                                                                        await import('./routes/test-suite')
                                                                    ).indexLoader(...args)
                                                            },
                                                            {
                                                                path: 'new',
                                                                action: async (...args) =>
                                                                    (
                                                                        await import('./routes/actions')
                                                                    ).createNewTestSuiteAction(...args)
                                                            },
                                                            {
                                                                path: ':testSuiteId',
                                                                id: ':testSuiteId',
                                                                loader: async (...args) =>
                                                                    (
                                                                        await import('./routes/test-suite')
                                                                    ).loader(...args),
                                                                children: [
                                                                    {
                                                                        index: true,
                                                                        loader: async (...args) =>
                                                                            (
                                                                                await import(
                                                                                    './routes/test-results'
                                                                                )
                                                                            ).indexLoader(...args)
                                                                    },
                                                                    {
                                                                        path: 'test-result',
                                                                        children: [
                                                                            {
                                                                                path: ':testResultId',
                                                                                id: ':testResultId',
                                                                                loader: async (...args) =>
                                                                                    (
                                                                                        await import(
                                                                                            './routes/test-results'
                                                                                        )
                                                                                    ).loader(...args)
                                                                            }
                                                                        ]
                                                                    },
                                                                    {
                                                                        path: 'delete',
                                                                        action: async (...args) =>
                                                                            (
                                                                                await import('./routes/actions')
                                                                            ).deleteTestSuiteAction(...args)
                                                                    },
                                                                    {
                                                                        path: 'rename',
                                                                        action: async (...args) =>
                                                                            (
                                                                                await import('./routes/actions')
                                                                            ).renameTestSuiteAction(...args)
                                                                    },
                                                                    {
                                                                        path: 'run-all-tests',
                                                                        action: async (...args) =>
                                                                            (
                                                                                await import('./routes/actions')
                                                                            ).runAllTestsAction(...args)
                                                                    },
                                                                    {
                                                                        path: 'test',
                                                                        children: [
                                                                            {
                                                                                path: 'new',
                                                                                action: async (...args) =>
                                                                                    (
                                                                                        await import(
                                                                                            './routes/actions'
                                                                                        )
                                                                                    ).createNewTestAction(...args)
                                                                            },
                                                                            {
                                                                                path: ':testId',
                                                                                children: [
                                                                                    {
                                                                                        path: 'delete',
                                                                                        action: async (...args) =>
                                                                                            (
                                                                                                await import(
                                                                                                    './routes/actions'
                                                                                                )
                                                                                            ).deleteTestAction(...args)
                                                                                    },
                                                                                    {
                                                                                        path: 'update',
                                                                                        action: async (...args) =>
                                                                                            (
                                                                                                await import(
                                                                                                    './routes/actions'
                                                                                                )
                                                                                            ).updateTestAction(...args)
                                                                                    },
                                                                                    {
                                                                                        path: 'run',
                                                                                        action: async (...args) =>
                                                                                            (
                                                                                                await import(
                                                                                                    './routes/actions'
                                                                                                )
                                                                                            ).runTestAction(...args)
                                                                                    }
                                                                                ]
                                                                            }
                                                                        ]
                                                                    }
                                                                ]
                                                            }
                                                        ]
                                                    }
                                                ]
                                            },
                                            {
                                                path: 'duplicate',
                                                action: async (...args) =>
                                                    (
                                                        await import('./routes/actions')
                                                    ).duplicateWorkspaceAction(...args)
                                            }
                                        ]
                                    },
                                    {
                                        path: 'new',
                                        action: async (...args) =>
                                            (
                                                await import('./routes/actions')
                                            ).createNewWorkspaceAction(...args)
                                    },
                                    {
                                        path: 'delete',
                                        action: async (...args) =>
                                            (
                                                await import('./routes/actions')
                                            ).deleteWorkspaceAction(...args)
                                    },
                                    {
                                        path: 'update',
                                        action: async (...args) =>
                                            (
                                                await import('./routes/actions')
                                            ).updateWorkspaceAction(...args)
                                    },
                                    {
                                        path: ':workspaceId/update-meta',
                                        action: async (...args) =>
                                            (await import('./routes/actions')).updateWorkspaceMetaAction(
                                                ...args
                                            )
                                    }
                                ]
                            },
                            {
                                path: 'new',
                                action: async (...args) =>
                                    (
                                        await import('./routes/actions')
                                    ).createNewProjectAction(...args)
                            }
                        ]
                    }
                ]
            }


        ],
        {
            initialEntries: [beginningPath || locationHistoryEntry]
        }
    );

    // Store the last location in local storage
    router.subscribe(({ location }) => {
        const match = matchPath(
            {
                path: '/',
                end: false
            },
            location.pathname
        );

        localStorage.setItem('requester_locationHistoryEntry', location.pathname);
        localStorage.setItem('locationHistoryEntry', location.pathname);
        console.log('location.pathname', location.pathname);
    });

    return router;
};
