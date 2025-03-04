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
import { ApiService, XoRuntimeContext } from '@zeta/api';
import { I18nService, LocaleService } from '@zeta/i18n';
import { XcDialogService } from '@zeta/xc';

import { FM_WF_GET_ORDER_TYPES, UNSPECIFIED_GET_RUNTIME_CONTEXTS_ERROR } from '../const';
import { InputScreenWorkflowPackage, RestorableRouteComponent } from '../restorable-route.component';
import { ExecutionTimeBehaviorOnError, ExecutionTimeInterval, ExecutionTimeMonth, ExecutionTimeMonthlyAtWhichDayOfTheMonth, ExecutionTimeMonthlyBy, ExecutionTimeWeekday, ExecutionTimeWeekdayPositionInMonth, ExecutionTimeYearlyBy } from './components/execution-time/execution-time.constant';
import { cronlike_orders_translations_de_DE } from './locale/cronlike-orders-translations.de-DE';
import { cronlike_orders_translations_en_US } from './locale/cronlike-orders-translations.en-US';
import { XoCronLikeOrder } from './xo/xo-cronlike-order.model';


@Component({
    template: '',
    standalone: false
})
export class RestorableCronlikeOrdersComponent extends RestorableRouteComponent<XoCronLikeOrder> implements OnInit {
    protected UNSPECIFIED_DETAILS_ERROR = 'fman.restorable-cronlike-orders.unspecified-details-error';
    protected UNSPECIFIED_ADD_ERROR = 'fman.restorable-cronlike-orders.unspecified-add-error';
    protected UNSPECIFIED_SAVE_ERROR = 'fman.restorable-cronlike-orders.unspecified-save-error';
    protected UNSPECIFIED_GET_ORDER_TYPES_ERROR = 'fman.restorable-cronlike-orders.unspecified-get-order-types-error';
    protected CONFIRM_DELETE = 'fman.restorable-cronlike-orders.confirm-delete';

    protected UNSPECIFIED_GET_RUNTIME_CONTEXTS_ERROR = 'fman.restorable-cronlike-orders.unspecified-get-runtime-contexts-error';

    protected GET_ORDER_TYPES_EMPTY_LIST_ERROR(context: XoRuntimeContext): string {
        return this.i18nService.translate('fman.restorable-cronlike-orders.get-order-types-empty-list-error', {
            key: '$0',
            value: context.toString()
        });
    }

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

        this.i18nService.setTranslations(LocaleService.DE_DE, cronlike_orders_translations_de_DE);
        this.i18nService.setTranslations(LocaleService.EN_US, cronlike_orders_translations_en_US);
    }

    private translateConstants() {
        this.UNSPECIFIED_DETAILS_ERROR = this.i18nService.translate(this.UNSPECIFIED_DETAILS_ERROR);
        this.UNSPECIFIED_ADD_ERROR = this.i18nService.translate(this.UNSPECIFIED_ADD_ERROR);
        this.UNSPECIFIED_SAVE_ERROR = this.i18nService.translate(this.UNSPECIFIED_SAVE_ERROR);
        this.CONFIRM_DELETE = this.i18nService.translate(this.CONFIRM_DELETE);

        this.UNSPECIFIED_GET_RUNTIME_CONTEXTS_ERROR = this.i18nService.translate(UNSPECIFIED_GET_RUNTIME_CONTEXTS_ERROR);
        this.UNSPECIFIED_GET_ORDER_TYPES_ERROR = this.i18nService.translate(this.UNSPECIFIED_GET_ORDER_TYPES_ERROR);

        const descriptors = [
            ExecutionTimeInterval,
            ExecutionTimeBehaviorOnError,
            ExecutionTimeWeekday,
            ExecutionTimeWeekdayPositionInMonth,
            ExecutionTimeMonthlyBy,
            ExecutionTimeMonthlyAtWhichDayOfTheMonth,
            ExecutionTimeMonth,
            ExecutionTimeYearlyBy
        ];

        descriptors.forEach(desc => {
            Object.keys(desc).forEach(key => desc[key] = this.i18nService.translate(desc[key]));
        });
    }

    ngOnInit() {
        super.ngOnInit();
        this.translateConstants();
    }

}


export interface CronlikeOrdersScreenWorkflowPackage extends InputScreenWorkflowPackage {
    GetOrderTypes?: string;
}

export const CRONLIKE_ORDERS_ISWP: CronlikeOrdersScreenWorkflowPackage = {
    List: 'xmcp.factorymanager.cronlikeorders.GetCronLikeOrders',
    Details: 'xmcp.factorymanager.cronlikeorders.GetCronLikeOrder',
    Delete: 'xmcp.factorymanager.cronlikeorders.DeleteCronLikeOrder',
    Add: 'xmcp.factorymanager.cronlikeorders.CreateCronLikeOrder',
    Save: 'xmcp.factorymanager.cronlikeorders.UpdateCronLikeOrder',
    GetOrderTypes: FM_WF_GET_ORDER_TYPES
};
