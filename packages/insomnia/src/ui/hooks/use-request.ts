import { useFetcher, useParams } from 'react-router-dom';

import { GrpcRequest } from '../../models/grpc-request';
import { GrpcRequestMeta } from '../../models/grpc-request-meta';
import { Request } from '../../models/request';
import { RequestGroup } from '../../models/request-group';
import { RequestGroupMeta } from '../../models/request-group-meta';
import { RequestMeta } from '../../models/request-meta';
import { Settings } from '../../models/settings';
import { WebSocketRequest } from '../../models/websocket-request';
import { WorkspaceMeta } from '../../models/workspace-meta';

export const useRequestSetter = () => {
  const { projectId, workspaceId } = useParams<{ projectId: string; workspaceId: string }>();
  const fetcher = useFetcher();
  return (requestId: string, patch: Partial<GrpcRequest> | Partial<Request> | Partial<WebSocketRequest>) => {

    fetcher.submit(JSON.stringify(patch), {
      action: `/project/${projectId}/workspace/${workspaceId}/debug/request/${requestId}/update`,
      method: 'post',
      encType: 'application/json',
    });
  };
};

export const useRequestMetaPatcher = () => {
  const { projectId, workspaceId } = useParams<{ projectId: string; workspaceId: string }>();
  const fetcher = useFetcher();
  return (requestId: string, patch: Partial<GrpcRequestMeta> | Partial<RequestMeta>) => {
    fetcher.submit(patch, {
      action: `/project/${projectId}/workspace/${workspaceId}/debug/request/${requestId}/update-meta`,
      method: 'post',
      encType: 'application/json',
    });
  };
};

export const useRequestGroupPatcher = () => {
  const { projectId, workspaceId } = useParams<{ projectId: string; workspaceId: string }>();
  const fetcher = useFetcher();
  return (requestGroupId: string, patch: Partial<RequestGroup>) => {
    fetcher.submit(JSON.stringify(patch), {
      action: `/project/${projectId}/workspace/${workspaceId}/debug/request-group/${requestGroupId}/update`,
      method: 'post',
      encType: 'application/json',
    });
  };
};

export const useRequestGroupMetaPatcher = () => {
  const { projectId, workspaceId } = useParams<{ projectId: string; workspaceId: string }>();
  const fetcher = useFetcher();
  return (requestGroupId: string, patch: Partial<RequestGroupMeta>) => {
    fetcher.submit(patch, {
      action: `/project/${projectId}/workspace/${workspaceId}/debug/request-group/${requestGroupId}/update-meta`,
      method: 'post',
      encType: 'application/json',
    });
  };
};

export const useSettingsPatcher = () => {
  const fetcher = useFetcher();
  return (patch: Partial<Settings>) => {
    fetcher.submit(JSON.stringify(patch), {
      action: '/settings/update',
      method: 'post',
      encType: 'application/json',
    });
  };
};

export const useWorkspaceMetaPatcher = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const fetcher = useFetcher();
  return (workspaceId: string, patch: Partial<WorkspaceMeta>) => {
    fetcher.submit(patch, {
      action: `/project/${projectId}/workspace/${workspaceId}/update-meta`,
      method: 'post',
      encType: 'application/json',
    });
  };
};

export type CreateRequestType = 'HTTP' | 'gRPC' | 'GraphQL' | 'WebSocket' | 'Event Stream' | 'From Curl';
