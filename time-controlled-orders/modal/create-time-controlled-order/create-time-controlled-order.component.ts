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
import { Component, ElementRef, Injector, ViewChild } from '@angular/core';

import { ApiService, StartOrderOptionsBuilder, XoRuntimeContext } from '@zeta/api';
import { I18nService, LocaleService } from '@zeta/i18n';
import { XcDialogComponent, XcFormDirective } from '@zeta/xc';

import { finalize } from 'rxjs/operators';

import { FM_RTC } from '../../../const';
import { ExecutionTimeBehaviorOnError } from '../../../cronlike-orders/components/execution-time/execution-time.constant';
import { XoOrderCustoms } from '../../../xo/xo-ordercustoms.model';
import { XoOrderDestination } from '../../../xo/xo-orderdestination.model';
import { XoOrderExecutionTime } from '../../../xo/xo-orderexecutiontime.model';
import { InputParameter, StorableInputParameterComponent } from '../../components/storable-input-parameter/storable-input-parameter.component';
import { XoTCOExecutionRestriction } from '../../xo/xo-tcoexecution-restriction.model';
import { XoTimeControlledOrderId } from '../../xo/xo-time-controlled-order-id.model';
import { XoTimeControlledOrder } from '../../xo/xo-time-controlled-order.model';
import { createTimeControlledOrder_translations_de_DE } from './locale/create-time-controlled-order-translations.de-DE';
import { createTimeControlledOrder_translations_en_US } from './locale/create-time-controlled-order-translations.en-US';


export interface TCODefaultData {
    default: XoTimeControlledOrder;
}
@Component({
    selector: 'create-time-controlled-order',
    templateUrl: './create-time-controlled-order.component.html',
    styleUrls: ['./create-time-controlled-order.component.scss'],
    standalone: false
})
export class CreateTimeControlledOrderComponent extends XcDialogComponent<boolean, TCODefaultData> {
    @ViewChild(XcFormDirective, { static: false })
    xcFormDirective: XcFormDirective;

    @ViewChild(StorableInputParameterComponent, { static: false })
    storableInputComponent: StorableInputParameterComponent;

    @ViewChild('errorMessage', { static: true })
    errorMessageRef: ElementRef;

    selectedExecutionRestriction = new XoTCOExecutionRestriction();
    selectedBehaviorOnError: ExecutionTimeBehaviorOnError;
    selectedExecutionTime = new XoOrderExecutionTime();
    selectedRuntimeContext: XoRuntimeContext;
    selectedDestination: XoOrderDestination;
    selectedCustomFields: XoOrderCustoms = new XoOrderCustoms();
    selectedfilterCriteria: string;
    selectedSortCriteria: string;
    selectedStorableFqn: string;
    selectedActiveState = true;
    selectedOrderType = '';
    selectedName = '';

    executionRestrictionValid: boolean;
    executionTimeValid: boolean;
    orderTypeValid: boolean;
    error: string;
    loading: boolean;

    private readonly CREATE_TCO_WP = 'xmcp.factorymanager.timecontrolledorders.CreateTCO';
    private readonly apiService: ApiService;

    private _querySelection: InputParameter;

    get valid(): boolean {
        return this.executionTimeValid && this.orderTypeValid && this.executionRestrictionValid && this.xcFormDirective.valid;
    }

    set querySelection(value: InputParameter) {
        this._querySelection = value;
        this.selectedStorableFqn = value ? value.fqn.encode() : undefined;
    }

    get querySelection(): InputParameter {
        return this._querySelection;
    }

    constructor(injector: Injector, private readonly i18nService: I18nService) {
        super(injector);
        this.apiService = injector.get(ApiService);

        this.i18nService.setTranslations(LocaleService.DE_DE, createTimeControlledOrder_translations_de_DE);
        this.i18nService.setTranslations(LocaleService.EN_US, createTimeControlledOrder_translations_en_US);

        if (this.injectedData.default) {
            this.duplicateFromTCO(this.injectedData.default);
        } else {
            this.addDefaultValues();
        }
    }

    /**
     * @description Handles the change of the order type form to build the input Tree.
     */
    orderTypeChange(isValid: boolean) {
        this.orderTypeValid = isValid;
        this.updateInputParameterTree();
    }

    /**
     * @description Builds the input Tree based on the order type.
     */
    updateInputParameterTree() {
        const tmp = new XoOrderDestination();
        tmp.runtimeContext = this.selectedRuntimeContext;
        tmp.orderType = this.selectedOrderType;
        this.selectedDestination = tmp;
    }

    createTCO() {
        const tmpTCO = new XoTimeControlledOrder('');
        tmpTCO.name = this.selectedName;
        tmpTCO.enabled = this.selectedActiveState;
        tmpTCO.orderDestination.orderType = this.selectedOrderType;
        tmpTCO.orderDestination.runtimeContext = this.selectedRuntimeContext;
        tmpTCO.planningHorizon = this.selectedExecutionTime;
        tmpTCO.tCOExecutionRestriction = this.selectedExecutionRestriction;
        tmpTCO.orderCustoms = this.selectedCustomFields;
        tmpTCO.inputPayload = this.storableInputComponent.getPayload();
        tmpTCO.filterCriteria = this.selectedfilterCriteria;
        tmpTCO.sortCriteria = this.selectedSortCriteria;
        tmpTCO.storableFqn = this.selectedStorableFqn;
        this.loading = true;
        this.apiService
            .startOrder(FM_RTC, this.CREATE_TCO_WP, tmpTCO, XoTimeControlledOrderId, StartOrderOptionsBuilder.defaultOptionsWithErrorMessage)
            .pipe(finalize(() => {
                this.loading = false;
            }))
            .subscribe(result => {
                if (result.errorMessage) {
                    console.error(result.errorMessage);
                    this.error = result.errorMessage;
                    this.errorMessageRef.nativeElement.scrollIntoView({ block: 'center' });
                } else {
                    this.dismiss(true);
                }
            });
    }

    /**
     * @description Sets values from a default tco is provided (used for duplicating)
     */
    duplicateFromTCO(xoTimeControlledOrder: XoTimeControlledOrder) {
        this.selectedExecutionRestriction = xoTimeControlledOrder.tCOExecutionRestriction;
        this.selectedBehaviorOnError = xoTimeControlledOrder.tCOExecutionRestriction.behaviorOnError as ExecutionTimeBehaviorOnError;
        this.selectedExecutionTime = xoTimeControlledOrder.planningHorizon;
        this.selectedRuntimeContext = xoTimeControlledOrder.orderDestination.runtimeContext;
        this.selectedDestination = xoTimeControlledOrder.orderDestination;
        this.selectedCustomFields = xoTimeControlledOrder.orderCustoms;
        this.selectedfilterCriteria = xoTimeControlledOrder.filterCriteria;
        this.selectedSortCriteria = xoTimeControlledOrder.sortCriteria;
        this.selectedStorableFqn = xoTimeControlledOrder.storableFqn;
        this.selectedActiveState =  xoTimeControlledOrder.enabled;
        this.selectedOrderType =  xoTimeControlledOrder.orderDestination.orderType;
        this.selectedName =  xoTimeControlledOrder.name;
    }

    /**
     * @description Sets default values for startTime, endTime, activeState, timeWindow, timezone and behaviorOnError
     */
    addDefaultValues() {
        this.selectedActiveState = true;
        const ex = new XoOrderExecutionTime();
        const date = new Date();
        date.setMilliseconds(0);
        date.setSeconds(0);
        date.setMinutes(date.getMinutes() + 5);
        ex.startTime = date.getTime();
        date.setMinutes(date.getMinutes() + 10);
        ex.endTime = date.getTime();
        ex.timezone = 'UTC';
        ex.timeWindow = null;
        this.selectedExecutionTime = ex;
        this.selectedBehaviorOnError = ExecutionTimeBehaviorOnError.IGNORE;
    }
}
