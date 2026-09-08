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
import { RouterModule } from '@angular/router';

import { RedirectComponent, redirectGuardCanActivate, redirectGuardCanDeactivate, RedirectGuardConfigProvider, RedirectGuardProvider, XynaRoutes } from '@zeta/nav';
import { rightGuardCanActivate } from '@zeta/nav/right.guard';



import { FACTORY_MANAGER, RIGHT_FACTORY_MANAGER, RIGHT_FACTORY_MANAGER_ADMINISTRATIVE_VETOES, RIGHT_FACTORY_MANAGER_CAPACITIES, RIGHT_FACTORY_MANAGER_CRON_LIKE_ORDERS, RIGHT_FACTORY_MANAGER_DEPLOYMENT_ITEMS, RIGHT_FACTORY_MANAGER_FILTER, RIGHT_FACTORY_MANAGER_ORDER_INPUT_SOURCES, RIGHT_FACTORY_MANAGER_ORDER_TYPES, RIGHT_FACTORY_MANAGER_STORABLE_INSTANCES, RIGHT_FACTORY_MANAGER_TIME_CONTROLLED_ORDERS, RIGHT_FACTORY_MANAGER_TRIGGER, RIGHT_FACTORY_MANAGER_WORKSPACES_AND_APPLICATIONS, RIGHT_FACTORY_MANAGER_XYNA_PROPERTIES } from './const';















const ROOT = 'Factory-Manager';

export const FactoryManagerRoutes: XynaRoutes = [
    {
        path: '',
        redirectTo: ROOT,
        pathMatch: 'full'
    },
    {
        path: ROOT,
        loadComponent: () => import('./factory-manager.component').then(m => m.FactoryManagerComponent),
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
                loadComponent: () => import('./runtime-contexts/workspaces/workspaces.component').then(m => m.WorkspacesComponent),
                canActivate: [rightGuardCanActivate],
                canDeactivate: [redirectGuardCanDeactivate],
                pathMatch: 'full',
                data : {right: RIGHT_FACTORY_MANAGER_WORKSPACES_AND_APPLICATIONS, reuse: FACTORY_MANAGER.WORKSPACES + '_reuse_id', redirectKey: ROOT, title: FACTORY_MANAGER.WORKSPACES}
            },
            {
                path: FACTORY_MANAGER.APPLICATIONS,
                loadComponent: () => import('./runtime-contexts/applications/applications.component').then(m => m.ApplicationsComponent),
                canActivate: [rightGuardCanActivate],
                canDeactivate: [redirectGuardCanDeactivate],
                pathMatch: 'full',
                data : {right: RIGHT_FACTORY_MANAGER_WORKSPACES_AND_APPLICATIONS, reuse: FACTORY_MANAGER.APPLICATIONS + '_reuse_id', redirectKey: ROOT, title: FACTORY_MANAGER.APPLICATIONS}
            },
            {
                path: FACTORY_MANAGER.TRIGGER,
                loadComponent: () => import('./trigger-and-filter/trigger.component').then(m => m.TriggerComponent),
                canActivate: [rightGuardCanActivate],
                canDeactivate: [redirectGuardCanDeactivate],
                pathMatch: 'full',
                data : {right: RIGHT_FACTORY_MANAGER_TRIGGER, reuse: FACTORY_MANAGER.TRIGGER + '_reuse_id', redirectKey: ROOT, title: FACTORY_MANAGER.TRIGGER}
            },
            {
                path: FACTORY_MANAGER.FILTER,
                loadComponent: () => import('./trigger-and-filter/filter.component').then(m => m.FilterComponent),
                canActivate: [rightGuardCanActivate],
                canDeactivate: [redirectGuardCanDeactivate],
                pathMatch: 'full',
                data : {right: RIGHT_FACTORY_MANAGER_FILTER, reuse: FACTORY_MANAGER.FILTER + '_reuse_id', redirectKey: ROOT, title: FACTORY_MANAGER.FILTER}
            },
            {
                path: FACTORY_MANAGER.ORDERTYPES,
                loadComponent: () => import('./order-types/order-types.component').then(m => m.OrderTypesComponent),
                canActivate: [rightGuardCanActivate],
                canDeactivate: [redirectGuardCanDeactivate],
                pathMatch: 'full',
                data : {right: RIGHT_FACTORY_MANAGER_ORDER_TYPES, reuse: FACTORY_MANAGER.ORDERTYPES + '_reuse_id', redirectKey: ROOT, title: FACTORY_MANAGER.ORDERTYPES}
            },
            {
                path: FACTORY_MANAGER.CRONLIKE_ORDRES,
                loadComponent: () => import('./cronlike-orders/cronlike-orders.component').then(m => m.CronlikeOrdersComponent),
                canActivate: [rightGuardCanActivate],
                canDeactivate: [redirectGuardCanDeactivate],
                pathMatch: 'full',
                data : {right: RIGHT_FACTORY_MANAGER_CRON_LIKE_ORDERS, reuse: FACTORY_MANAGER.CRONLIKE_ORDRES + '_reuse_id', redirectKey: ROOT, title: FACTORY_MANAGER.CRONLIKE_ORDRES}
            },
            {
                path: FACTORY_MANAGER.TIMECONTROLLED_ORDERS,
                loadComponent: () => import('./time-controlled-orders/time-controlled-orders.component').then(m => m.TimeControlledOrdersComponent),
                canActivate: [rightGuardCanActivate],
                canDeactivate: [redirectGuardCanDeactivate],
                pathMatch: 'full',
                data : {right: RIGHT_FACTORY_MANAGER_TIME_CONTROLLED_ORDERS, reuse: FACTORY_MANAGER.TIMECONTROLLED_ORDERS + '_reuse_id', redirectKey: ROOT, title: FACTORY_MANAGER.TIMECONTROLLED_ORDERS}
            },
            {
                path: FACTORY_MANAGER.ORDER_INPUT_SOURCES,
                loadComponent: () => import('./order-input-sources/order-input-sources.component').then(m => m.OrderInputSourcesComponent),
                canActivate: [rightGuardCanActivate],
                canDeactivate: [redirectGuardCanDeactivate],
                pathMatch: 'full',
                data : {right: RIGHT_FACTORY_MANAGER_ORDER_INPUT_SOURCES, reuse: FACTORY_MANAGER.ORDER_INPUT_SOURCES + '_reuse_id', redirectKey: ROOT, title: FACTORY_MANAGER.ORDER_INPUT_SOURCES}
            },
            {
                path: FACTORY_MANAGER.CAPACITIES,
                loadComponent: () => import('./capacities/capacities.component').then(m => m.CapacitiesComponent),
                canActivate: [rightGuardCanActivate],
                canDeactivate: [redirectGuardCanDeactivate],
                pathMatch: 'full',
                data : {right: RIGHT_FACTORY_MANAGER_CAPACITIES, reuse: FACTORY_MANAGER.CAPACITIES + '_reuse_id', redirectKey: ROOT, title: FACTORY_MANAGER.CAPACITIES}
            },
            {
                path: FACTORY_MANAGER.ADMINISTRATIVE_VETOES,
                loadComponent: () => import('./administrative-vetoes/administrative-vetoes.component').then(m => m.AdministrativeVetoesComponent),
                canActivate: [rightGuardCanActivate],
                canDeactivate: [redirectGuardCanDeactivate],
                pathMatch: 'full',
                data : {right: RIGHT_FACTORY_MANAGER_ADMINISTRATIVE_VETOES, reuse: FACTORY_MANAGER.ADMINISTRATIVE_VETOES + '_reuse_id', redirectKey: ROOT, title: FACTORY_MANAGER.ADMINISTRATIVE_VETOES}
            },
            {
                path: FACTORY_MANAGER.DEPLOYMENT_ITEMS,
                loadComponent: () => import('./deployment-items/deployment-items.component').then(m => m.DeploymentItemsComponent),
                canActivate: [rightGuardCanActivate],
                canDeactivate: [redirectGuardCanDeactivate],
                pathMatch: 'full',
                data : {right: RIGHT_FACTORY_MANAGER_DEPLOYMENT_ITEMS, reuse: FACTORY_MANAGER.DEPLOYMENT_ITEMS + '_reuse_id', redirectKey: ROOT, title: FACTORY_MANAGER.DEPLOYMENT_ITEMS}
            },
            {
                path: FACTORY_MANAGER.STORABLE_INSTANCES,
                loadComponent: () => import('./storable-instances/storable-instances.component').then(m => m.StorableInstancesComponent),
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
                loadComponent: () => import('./xyna-properties/xyna-properties.component').then(m => m.XynaPropertiesComponent),
                canActivate: [rightGuardCanActivate],
                canDeactivate: [redirectGuardCanDeactivate],
                pathMatch: 'full',
                data : {right: RIGHT_FACTORY_MANAGER_XYNA_PROPERTIES, reuse: FACTORY_MANAGER.XYNA_PROPERTIES + '_reuse_id', redirectKey: ROOT, title: FACTORY_MANAGER.XYNA_PROPERTIES}
            },
            {
                path: FACTORY_MANAGER.PLUGIN_00,
                loadComponent: () => import('./plugin/plugin.component').then(m => m.PluginComponent),
                canDeactivate: [redirectGuardCanDeactivate],
                pathMatch: 'full',
                data : {reuse: FACTORY_MANAGER.PLUGIN_00 + '_reuse_id', redirectKey: ROOT, title: FACTORY_MANAGER.PLUGIN_00}
            },
            {
                path: FACTORY_MANAGER.PLUGIN_01,
                loadComponent: () => import('./plugin/plugin.component').then(m => m.PluginComponent),
                canDeactivate: [redirectGuardCanDeactivate],
                pathMatch: 'full',
                data : {reuse: FACTORY_MANAGER.PLUGIN_01 + '_reuse_id', redirectKey: ROOT, title: FACTORY_MANAGER.PLUGIN_01}
            },
            {
                path: FACTORY_MANAGER.PLUGIN_02,
                loadComponent: () => import('./plugin/plugin.component').then(m => m.PluginComponent),
                canDeactivate: [redirectGuardCanDeactivate],
                pathMatch: 'full',
                data : {reuse: FACTORY_MANAGER.PLUGIN_02 + '_reuse_id', redirectKey: ROOT, title: FACTORY_MANAGER.PLUGIN_02}
            },
            {
                path: FACTORY_MANAGER.PLUGIN_03,
                loadComponent: () => import('./plugin/plugin.component').then(m => m.PluginComponent),
                canDeactivate: [redirectGuardCanDeactivate],
                pathMatch: 'full',
                data : {reuse: FACTORY_MANAGER.PLUGIN_03 + '_reuse_id', redirectKey: ROOT, title: FACTORY_MANAGER.PLUGIN_03}
            },
            {
                path: FACTORY_MANAGER.PLUGIN_04,
                loadComponent: () => import('./plugin/plugin.component').then(m => m.PluginComponent),
                canDeactivate: [redirectGuardCanDeactivate],
                pathMatch: 'full',
                data : {reuse: FACTORY_MANAGER.PLUGIN_04 + '_reuse_id', redirectKey: ROOT, title: FACTORY_MANAGER.PLUGIN_04}
            },
            {
                path: FACTORY_MANAGER.PLUGIN_05,
                loadComponent: () => import('./plugin/plugin.component').then(m => m.PluginComponent),
                canDeactivate: [redirectGuardCanDeactivate],
                pathMatch: 'full',
                data : {reuse: FACTORY_MANAGER.PLUGIN_05 + '_reuse_id', redirectKey: ROOT, title: FACTORY_MANAGER.PLUGIN_05}
            },
            {
                path: FACTORY_MANAGER.PLUGIN_06,
                loadComponent: () => import('./plugin/plugin.component').then(m => m.PluginComponent),
                canDeactivate: [redirectGuardCanDeactivate],
                pathMatch: 'full',
                data : {reuse: FACTORY_MANAGER.PLUGIN_06 + '_reuse_id', redirectKey: ROOT, title: FACTORY_MANAGER.PLUGIN_06}
            },
            {
                path: FACTORY_MANAGER.PLUGIN_07,
                loadComponent: () => import('./plugin/plugin.component').then(m => m.PluginComponent),
                canDeactivate: [redirectGuardCanDeactivate],
                pathMatch: 'full',
                data : {reuse: FACTORY_MANAGER.PLUGIN_07 + '_reuse_id', redirectKey: ROOT, title: FACTORY_MANAGER.PLUGIN_07}
            },
            {
                path: FACTORY_MANAGER.PLUGIN_08,
                loadComponent: () => import('./plugin/plugin.component').then(m => m.PluginComponent),
                canDeactivate: [redirectGuardCanDeactivate],
                pathMatch: 'full',
                data : {reuse: FACTORY_MANAGER.PLUGIN_08 + '_reuse_id', redirectKey: ROOT, title: FACTORY_MANAGER.PLUGIN_08}
            },
            {
                path: FACTORY_MANAGER.PLUGIN_09,
                loadComponent: () => import('./plugin/plugin.component').then(m => m.PluginComponent),
                canDeactivate: [redirectGuardCanDeactivate],
                pathMatch: 'full',
                data : {reuse: FACTORY_MANAGER.PLUGIN_09 + '_reuse_id', redirectKey: ROOT, title: FACTORY_MANAGER.PLUGIN_09}
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
