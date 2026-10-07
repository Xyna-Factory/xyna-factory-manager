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
import { RouterModule, UrlMatchResult, UrlSegment } from '@angular/router';

import { RedirectComponent, redirectGuardCanActivate, redirectGuardCanDeactivate, RedirectGuardConfigProvider, RedirectGuardProvider, XynaRoutes } from '@zeta/nav';
import { rightGuardCanActivate } from '@zeta/nav/right.guard';

import { AdministrativeVetoesComponent } from './administrative-vetoes/administrative-vetoes.component';
import { CapacitiesComponent } from './capacities/capacities.component';
import { FACTORY_MANAGER, RIGHT_FACTORY_MANAGER, RIGHT_FACTORY_MANAGER_ADMINISTRATIVE_VETOES, RIGHT_FACTORY_MANAGER_CAPACITIES, RIGHT_FACTORY_MANAGER_CRON_LIKE_ORDERS, RIGHT_FACTORY_MANAGER_DEPLOYMENT_ITEMS, RIGHT_FACTORY_MANAGER_FILTER, RIGHT_FACTORY_MANAGER_ORDER_INPUT_SOURCES, RIGHT_FACTORY_MANAGER_ORDER_TYPES, RIGHT_FACTORY_MANAGER_STORABLE_INSTANCES, RIGHT_FACTORY_MANAGER_TIME_CONTROLLED_ORDERS, RIGHT_FACTORY_MANAGER_TRIGGER, RIGHT_FACTORY_MANAGER_WORKSPACES_AND_APPLICATIONS, RIGHT_FACTORY_MANAGER_XYNA_PROPERTIES } from './const';
import { CronlikeOrdersComponent } from './cronlike-orders/cronlike-orders.component';
import { DeploymentItemsComponent } from './deployment-items/deployment-items.component';
import { FactoryManagerComponent } from './factory-manager.component';
import { OrderInputSourcesComponent } from './order-input-sources/order-input-sources.component';
import { OrderTypesComponent } from './order-types/order-types.component';
import { PluginComponent } from './plugin/plugin.component';
import { ApplicationsComponent } from './runtime-contexts/applications/applications.component';
import { WorkspacesComponent } from './runtime-contexts/workspaces/workspaces.component';
import { StorableInstancesComponent } from './storable-instances/storable-instances.component';
import { TimeControlledOrdersComponent } from './time-controlled-orders/time-controlled-orders.component';
import { FilterComponent } from './trigger-and-filter/filter.component';
import { TriggerComponent } from './trigger-and-filter/trigger.component';
import { XynaPropertiesComponent } from './xyna-properties/xyna-properties.component';


const ROOT = 'Factory-Manager';

// matcher instead of a route param, because the RedirectGuard strips route params from the stored url
export function pluginMatcher(segments: UrlSegment[]): UrlMatchResult {
    return segments.length === 1 && segments[0].path.startsWith(FACTORY_MANAGER.PLUGIN)
        ? { consumed: segments }
        : null;
}

export const FactoryManagerRoutes: XynaRoutes = [
    {
        path: '',
        redirectTo: ROOT,
        pathMatch: 'full'
    },
    {
        path: ROOT,
        component: FactoryManagerComponent,
        canActivate: [rightGuardCanActivate],
        data: { right: RIGHT_FACTORY_MANAGER, reuse: ROOT, title: ROOT },
        children: [
            {
                path: '',
                component: RedirectComponent,
                canActivate: [redirectGuardCanActivate],
                data: { reuse: ROOT, redirectKey: ROOT, redirectDefault: FACTORY_MANAGER.WORKSPACES } // important that the RedirectComponent uses the reuse-strategy as well ( => { reuse : uniqueKey })
            },

            // ++++++++++++++++++++++++++++++++++++++ FACTORY MANAGER
            {
                path: FACTORY_MANAGER.WORKSPACES,
                component: WorkspacesComponent,
                canActivate: [rightGuardCanActivate],
                canDeactivate: [redirectGuardCanDeactivate],
                pathMatch: 'full',
                data : {right: RIGHT_FACTORY_MANAGER_WORKSPACES_AND_APPLICATIONS, reuse: FACTORY_MANAGER.WORKSPACES + '_reuse_id', redirectKey: ROOT, title: FACTORY_MANAGER.WORKSPACES}
            },
            {
                path: FACTORY_MANAGER.APPLICATIONS,
                component: ApplicationsComponent,
                canActivate: [rightGuardCanActivate],
                canDeactivate: [redirectGuardCanDeactivate],
                pathMatch: 'full',
                data : {right: RIGHT_FACTORY_MANAGER_WORKSPACES_AND_APPLICATIONS, reuse: FACTORY_MANAGER.APPLICATIONS + '_reuse_id', redirectKey: ROOT, title: FACTORY_MANAGER.APPLICATIONS}
            },
            {
                path: FACTORY_MANAGER.TRIGGER,
                component: TriggerComponent,
                canActivate: [rightGuardCanActivate],
                canDeactivate: [redirectGuardCanDeactivate],
                pathMatch: 'full',
                data : {right: RIGHT_FACTORY_MANAGER_TRIGGER, reuse: FACTORY_MANAGER.TRIGGER + '_reuse_id', redirectKey: ROOT, title: FACTORY_MANAGER.TRIGGER}
            },
            {
                path: FACTORY_MANAGER.FILTER,
                component: FilterComponent,
                canActivate: [rightGuardCanActivate],
                canDeactivate: [redirectGuardCanDeactivate],
                pathMatch: 'full',
                data : {right: RIGHT_FACTORY_MANAGER_FILTER, reuse: FACTORY_MANAGER.FILTER + '_reuse_id', redirectKey: ROOT, title: FACTORY_MANAGER.FILTER}
            },
            {
                path: FACTORY_MANAGER.ORDERTYPES,
                component: OrderTypesComponent,
                canActivate: [rightGuardCanActivate],
                canDeactivate: [redirectGuardCanDeactivate],
                pathMatch: 'full',
                data : {right: RIGHT_FACTORY_MANAGER_ORDER_TYPES, reuse: FACTORY_MANAGER.ORDERTYPES + '_reuse_id', redirectKey: ROOT, title: FACTORY_MANAGER.ORDERTYPES}
            },
            {
                path: FACTORY_MANAGER.CRONLIKE_ORDERS,
                component: CronlikeOrdersComponent,
                canActivate: [rightGuardCanActivate],
                canDeactivate: [redirectGuardCanDeactivate],
                pathMatch: 'full',
                data : {right: RIGHT_FACTORY_MANAGER_CRON_LIKE_ORDERS, reuse: FACTORY_MANAGER.CRONLIKE_ORDERS + '_reuse_id', redirectKey: ROOT, title: FACTORY_MANAGER.CRONLIKE_ORDERS}
            },
            {
                path: FACTORY_MANAGER.TIMECONTROLLED_ORDERS,
                component: TimeControlledOrdersComponent,
                canActivate: [rightGuardCanActivate],
                canDeactivate: [redirectGuardCanDeactivate],
                pathMatch: 'full',
                data : {right: RIGHT_FACTORY_MANAGER_TIME_CONTROLLED_ORDERS, reuse: FACTORY_MANAGER.TIMECONTROLLED_ORDERS + '_reuse_id', redirectKey: ROOT, title: FACTORY_MANAGER.TIMECONTROLLED_ORDERS}
            },
            {
                path: FACTORY_MANAGER.ORDER_INPUT_SOURCES,
                component: OrderInputSourcesComponent,
                canActivate: [rightGuardCanActivate],
                canDeactivate: [redirectGuardCanDeactivate],
                pathMatch: 'full',
                data : {right: RIGHT_FACTORY_MANAGER_ORDER_INPUT_SOURCES, reuse: FACTORY_MANAGER.ORDER_INPUT_SOURCES + '_reuse_id', redirectKey: ROOT, title: FACTORY_MANAGER.ORDER_INPUT_SOURCES}
            },
            {
                path: FACTORY_MANAGER.CAPACITIES,
                component: CapacitiesComponent,
                canActivate: [rightGuardCanActivate],
                canDeactivate: [redirectGuardCanDeactivate],
                pathMatch: 'full',
                data : {right: RIGHT_FACTORY_MANAGER_CAPACITIES, reuse: FACTORY_MANAGER.CAPACITIES + '_reuse_id', redirectKey: ROOT, title: FACTORY_MANAGER.CAPACITIES}
            },
            {
                path: FACTORY_MANAGER.ADMINISTRATIVE_VETOES,
                component: AdministrativeVetoesComponent,
                canActivate: [rightGuardCanActivate],
                canDeactivate: [redirectGuardCanDeactivate],
                pathMatch: 'full',
                data : {right: RIGHT_FACTORY_MANAGER_ADMINISTRATIVE_VETOES, reuse: FACTORY_MANAGER.ADMINISTRATIVE_VETOES + '_reuse_id', redirectKey: ROOT, title: FACTORY_MANAGER.ADMINISTRATIVE_VETOES}
            },
            {
                path: FACTORY_MANAGER.DEPLOYMENT_ITEMS,
                component: DeploymentItemsComponent,
                canActivate: [rightGuardCanActivate],
                canDeactivate: [redirectGuardCanDeactivate],
                pathMatch: 'full',
                data : {right: RIGHT_FACTORY_MANAGER_DEPLOYMENT_ITEMS, reuse: FACTORY_MANAGER.DEPLOYMENT_ITEMS + '_reuse_id', redirectKey: ROOT, title: FACTORY_MANAGER.DEPLOYMENT_ITEMS}
            },
            {
                path: FACTORY_MANAGER.STORABLE_INSTANCES,
                component: StorableInstancesComponent,
                canActivate: [rightGuardCanActivate],
                canDeactivate: [redirectGuardCanDeactivate],
                pathMatch: 'full',
                data : {right: RIGHT_FACTORY_MANAGER_STORABLE_INSTANCES, reuse: FACTORY_MANAGER.STORABLE_INSTANCES + '_reuse_id', redirectKey: ROOT, title: FACTORY_MANAGER.STORABLE_INSTANCES}
            },
            // {
            //     path: FACTORY_MANAGER.DATA_MODELS,
            //     component: ,
            //     pathMatch: 'full'
            // },
            {
                path: FACTORY_MANAGER.XYNA_PROPERTIES,
                component: XynaPropertiesComponent,
                canActivate: [rightGuardCanActivate],
                canDeactivate: [redirectGuardCanDeactivate],
                pathMatch: 'full',
                data : {right: RIGHT_FACTORY_MANAGER_XYNA_PROPERTIES, reuse: FACTORY_MANAGER.XYNA_PROPERTIES + '_reuse_id', redirectKey: ROOT, title: FACTORY_MANAGER.XYNA_PROPERTIES}
            },
            {
                matcher: pluginMatcher,
                component: PluginComponent,
                canDeactivate: [redirectGuardCanDeactivate],
                data : {reuse: FACTORY_MANAGER.PLUGIN + '_reuse_id', redirectKey: ROOT, title:FACTORY_MANAGER.PLUGIN}
            }
        ]
    }
];

export const FactoryManagerRoutingModules = [
    RouterModule.forChild(FactoryManagerRoutes)
];

export const FactoryManagerRoutingProviders = [
    RedirectGuardProvider(),
    RedirectGuardConfigProvider(FACTORY_MANAGER.ORDERTYPES)
];
