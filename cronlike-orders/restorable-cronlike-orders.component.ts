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
import { Component, OnInit } from '@angular/core';

import { XoRuntimeContext } from '@zeta/api';
import { LocaleService } from '@zeta/i18n';

import { FM_WF_GET_ORDER_TYPES, UNSPECIFIED_GET_RUNTIME_CONTEXTS_ERROR } from '../const';
import { InputScreenWorkflowPackage, RestorableRouteComponent } from '../restorable-route.component';
import { ExecutionTimeBehaviorOnError, ExecutionTimeInterval, ExecutionTimeMonth, ExecutionTimeMonthlyAtWhichDayOfTheMonth, ExecutionTimeMonthlyBy, ExecutionTimeWeekday, ExecutionTimeWeekdayPositionInMonth, ExecutionTimeYearlyBy } from './components/execution-time/execution-time.constant';
import { cronlike_orders_translations_de_DE } from './locale/cronlike-orders-translations.de-DE';
import { cronlike_orders_translations_en_US } from './locale/cronlike-orders-translations.en-US';
import { XoCronLikeOrder } from './xo/xo-cronlike-order.model';


@Component({
    template: ''
})
export class RestorableCronlikeOrdersComponent extends RestorableRouteComponent<XoCronLikeOrder> implements OnInit {
    get UNSPECIFIED_DETAILS_ERROR(): string {
        return this.i18nService.translateSignal('fman.restorable-cronlike-orders.unspecified-details-error')();
    }

    get UNSPECIFIED_ADD_ERROR(): string {
        return this.i18nService.translateSignal('fman.restorable-cronlike-orders.unspecified-add-error')();
    }

    get UNSPECIFIED_SAVE_ERROR(): string {
        return this.i18nService.translateSignal('fman.restorable-cronlike-orders.unspecified-save-error')();
    }

    get UNSPECIFIED_GET_ORDER_TYPES_ERROR(): string {
        return this.i18nService.translateSignal('fman.restorable-cronlike-orders.unspecified-get-order-types-error')();
    }

    get CONFIRM_DELETE(): string {
        return this.i18nService.translateSignal('fman.restorable-cronlike-orders.confirm-delete')();
    }

    get UNSPECIFIED_GET_RUNTIME_CONTEXTS_ERROR(): string {
        return this.i18nService.translateSignal('fman.restorable-cronlike-orders.unspecified-get-runtime-contexts-error')();
    }

    protected GET_ORDER_TYPES_EMPTY_LIST_ERROR(context: XoRuntimeContext): string {
        return this.i18nService.translate('fman.restorable-cronlike-orders.get-order-types-empty-list-error', {
            key: '$0',
            value: context.toString()
        });
    }

    constructor() {
        super();

        this.i18nService.setTranslations(LocaleService.DE_DE, cronlike_orders_translations_de_DE);
        this.i18nService.setTranslations(LocaleService.EN_US, cronlike_orders_translations_en_US);
    }

    ngOnInit() {
        super.ngOnInit();
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
