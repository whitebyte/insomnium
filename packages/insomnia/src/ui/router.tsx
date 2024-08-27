import './rendererListeners';
import React, { lazy, Suspense } from 'react';
import ReactDOM from 'react-dom/client';
import {
  createMemoryRouter,
  matchPath,
  Outlet,
} from 'react-router-dom';

import {
  ACTIVITY_DEBUG,
  ACTIVITY_SPEC,
  getProductName,
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

const LLMRoute = lazy(() => import('./routes/llm'));

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
    // @TODO - Investigate file based routing to generate these routes:
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
                    ...args,
                  ),
              },
              {
                path: 'resources',
                action: async (...args) =>
                  (await import('./routes/importResourcesAction')).importResourcesAction(
                    ...args,
                  ),
              },
            ],
          },
          {
            path: 'settings/update',
            action: async (...args) =>
              (await import('./routes/actions')).updateSettingsAction(...args),
          },
          {
            id: '/llm',
            path: 'llm',
            element: (
              <Suspense >
                <LLMRoute />
              </Suspense>
            ),
          },
        ],
      },
    ],
    {
      initialEntries: [beginningPath || locationHistoryEntry],
    },
  );

  // Store the last location in local storage
  router.subscribe(({ location }) => {
    const match = matchPath(
      {
        path: '/',
        end: false,
      },
      location.pathname
    );

    localStorage.setItem('requester_locationHistoryEntry', location.pathname);
    localStorage.setItem('locationHistoryEntry', location.pathname);
    console.log("location.pathname", location.pathname);
  });

  return router;
};
