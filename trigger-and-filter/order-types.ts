/*
 * - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
 * Copyright 2023 Xyna GmbH, Germany
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *  http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
 */
export const ORDER_TYPES = {
    DEPLOY_FILTER: 'xmcp.factorymanager.filtermanager.DeployFilterInstance',
    DEPLOY_TRIGGER: 'xmcp.factorymanager.filtermanager.DeployTriggerInstance',
    DISABLE_FILTER: 'xmcp.factorymanager.filtermanager.DisableFilterInstance',
    DISABLE_TRIGGER: 'xmcp.factorymanager.filtermanager.DisableTriggerInstance',
    ENABLE_FILTER: 'xmcp.factorymanager.filtermanager.EnableFilterInstance',
    ENABLE_TRIGGER: 'xmcp.factorymanager.filtermanager.EnableTriggerInstance',
    FILTER_DETAIL: 'xmcp.factorymanager.filtermanager.GetFilterDetail',
    TRIGGER_DETAIL: 'xmcp.factorymanager.filtermanager.GetTriggerDetails',
    FILTER_INSTANCE_DETAIL: 'xmcp.factorymanager.filtermanager.GetFilterInstanceDetail',
    TRIGGER_INSTANCE_DETAIL: 'xmcp.factorymanager.filtermanager.GetTriggerInstanceDetail',
    FILTER_OVERVIEW: 'xmcp.factorymanager.filtermanager.GetFilterOverview',
    TRIGGER_OVERVIEW: 'xmcp.factorymanager.filtermanager.GetTriggerOverview',
    UNDEPLOY_FILTER: 'xmcp.factorymanager.filtermanager.UndeployFilterInstance',
    UNDEPLOY_TRIGGER: 'xmcp.factorymanager.filtermanager.UndeployTriggerInstance',
    POSSIBLE_TRIGGER_INSTANCES: 'xmcp.factorymanager.filtermanager.GetPossibleTriggerInstanceForFilterDeployment',
    POSSIBLE_CONTEXT_TRIGGER: 'xmcp.factorymanager.filtermanager.GetPossibleRTCForTriggerDeployment',
    POSSIBLE_START_PARAMETER_TRIGGER: 'xmcp.factorymanager.filtermanager.GetPossibleStartParameterForTriggerDeployment',
    POSSIBLE_CONTEXT_FILTER: 'xmcp.factorymanager.filtermanager.GetPossibleRTCForFilterDeployment'
};
