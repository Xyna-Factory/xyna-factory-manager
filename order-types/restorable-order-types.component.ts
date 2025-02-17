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
import { Component, Injector, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import { FactoryManagerSettingsService } from '@fman/misc/services/factory-manager-settings.service';
import { ApiService } from '@zeta/api';
import { I18nService, LocaleService } from '@zeta/i18n';
import { XcDialogService } from '@zeta/xc';

import { InputScreenWorkflowPackage, RestorableRouteComponent } from '../restorable-route.component';
import { order_types_translations_de_DE } from './locale/order-types-translations.de-DE';
import { order_types_translations_en_US } from './locale/order-types-translations.en-US';
import { XoOrderType } from './xo/xo-order-type.model';


export interface OrderTypeInputScreenWorkflowPackage extends InputScreenWorkflowPackage {
    GetOrdertypeCapacities: string;
    GetDestinations: string;
}


export const ORDER_TYPE_ISWP: OrderTypeInputScreenWorkflowPackage = {
    List: 'xmcp.factorymanager.ordertypes.GetOrderTypes',
    Details: 'xmcp.factorymanager.ordertypes.GetOrderType',
    Add: 'xmcp.factorymanager.ordertypes.CreateOrderType',
    Save: 'xmcp.factorymanager.ordertypes.ChangeOrderType',
    Delete: 'xmcp.factorymanager.ordertypes.DeleteOrderType',
    GetOrdertypeCapacities: 'xmcp.factorymanager.ordertypes.GetOrdertypeCapacities',
    GetDestinations: 'xmcp.factorymanager.ordertypes.GetDestinations'
};


@Component({
    template: '',
    standalone: false
})
export class RestorableOrderTypesComponent extends RestorableRouteComponent<XoOrderType> implements OnInit {

    protected UNSPECIFIED_DETAILS_ERROR = 'fman.order-types.unspecified-details-error';
    protected UNSPECIFIED_ADD_ERROR = 'fman.order-types.unspecified-add-error';
    protected UNSPECIFIED_SAVE_ERROR = 'fman.order-types.unspecified-save-error';
    protected UNSPECIFIED_GET_RUNTIME_CONTEXTS_ERROR = 'fman.order-types.unspecified-get-runtime-contexts-error';
    protected CONFIRM_DELETE = 'fman.order-types.confirm-delete';

    protected USE_DEFAULT = 'fman.order-types.use-default';

    private readonly TOOLTIP_HEADER_MONITORING_LEVEL = `Monitoring Level:
0:  No audit data will be created at all.
5:  Rudimentary audit data will only be created if an error occurs.
10: Rudimentary audit data will be created. After creation, the only update to the captured data is performed after finishing the Cleanup stage.
15: Rudimentary audit data will be created. Every Master Workflow state change results in an update to the captured data, especially to the "last update" timestamp.
17: While an order is running, comprehensive audit data will be created similar to Monitoring Level 20. If no error occurs, all audit data will be removed (similar to Monitoring Level 0).
18: While an order is running, comprehensive audit data will be created similar to Monitoring Level 20. If no error occurs, audit data will be reduced (similar to Monitoring Level 10 and 15).
20: Comprehensive audit data including input, output and error information for every single workflow step will be created.

`;

    private readonly TOOLTIP_HEADER_PRECEDENCE = `Precedence:
Value of precedence is the decision criterion if a conflicting Order Type configuration is found.
Typical values:
HIGH (100+): Change Monitoring Level even if set explicitly by Order Entry Interface.
100: Precedence used by Order Entry Interfaces
MEDIUM (1-99): Don't change Monitoring Level set by Order Entry Interface.
DEFAULT (0): Used by constant configuration of Order Types.
LOW (less than 0): Select low Precedence values to prefer Monitoring Level defined by parent orders.

`;

    constructor(
        apiService: ApiService,
        dialogService: XcDialogService,
        route: ActivatedRoute,
        router: Router,
        i18nService: I18nService,
        injector: Injector,
        settings: FactoryManagerSettingsService
    ) {
        super(apiService, dialogService, route, router, i18nService, injector, settings);

        this.i18nService.setTranslations(LocaleService.DE_DE, order_types_translations_de_DE);
        this.i18nService.setTranslations(LocaleService.EN_US, order_types_translations_en_US);
    }

    protected get TOOLTIP_HEADER(): string {
        return this.TOOLTIP_HEADER_MONITORING_LEVEL + this.TOOLTIP_HEADER_PRECEDENCE;
    }

    private translateConstants() {
        this.UNSPECIFIED_DETAILS_ERROR = this.i18nService.translate(this.UNSPECIFIED_DETAILS_ERROR);
        this.UNSPECIFIED_ADD_ERROR = this.i18nService.translate(this.UNSPECIFIED_ADD_ERROR);
        this.UNSPECIFIED_SAVE_ERROR = this.i18nService.translate(this.UNSPECIFIED_SAVE_ERROR);
        this.CONFIRM_DELETE = this.i18nService.translate(this.CONFIRM_DELETE);
        this.UNSPECIFIED_GET_RUNTIME_CONTEXTS_ERROR = this.i18nService.translate(this.UNSPECIFIED_GET_RUNTIME_CONTEXTS_ERROR);
        this.USE_DEFAULT = this.i18nService.translate(this.USE_DEFAULT);
    }

    ngOnInit() {
        super.ngOnInit();
        this.translateConstants();
    }

}
