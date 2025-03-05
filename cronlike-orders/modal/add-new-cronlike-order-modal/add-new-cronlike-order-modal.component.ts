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
import { Component, Injector, ViewChild } from '@angular/core';

import { ApiService, FullQualifiedName, RuntimeContext, StartOrderOptionsBuilder, XoApplication, XoRuntimeContext, XoWorkspace } from '@zeta/api';
import { isString } from '@zeta/base';
import { I18nService, LocaleService } from '@zeta/i18n';
import { XcAutocompleteDataWrapper, XcDialogComponent, XcFormDirective } from '@zeta/xc';

import { InputParameterRef } from '../../../misc/components/input-parameter/input-parameter-ref.class';
import { FMFocusCandidateRef } from '../../../misc/directives/fm-focus-candidate.directive';
import { XoRestrictionBasedTimeWindow } from '../../../xo/xo-timewindow.model';
import { ExecutionTimeBehaviorOnError } from '../../components/execution-time/execution-time.constant';
import { XoCronLikeOrder } from '../../xo/xo-cronlike-order.model';
import { addNewCronlikeOrderModal_translations_de_DE } from './locale/add-new-cronlike-order-modal-translations.de-DE';
import { addNewCronlikeOrderModal_translations_en_US } from './locale/add-new-cronlike-order-modal-translations.en-US';


export interface AddNewCronLikeOrderModalComponentData {
    addWorkflow: string;
    getOrderTypes: string;
    rtc: RuntimeContext;
    i18nService: I18nService;
    duplicate: XoCronLikeOrder;
    UNSPECIFIED_GET_RUNTIME_CONTEXTS_ERROR: string;
    GET_ORDER_TYPES_EMPTY_LIST_ERROR: (r: XoRuntimeContext) => string;
    UNSPECIFIED_GET_ORDER_TYPES_ERROR: string;
}

@Component({
    selector: 'app-add-new-cronlike-order-modal',
    templateUrl: './add-new-cronlike-order-modal.component.html',
    styleUrls: ['./add-new-cronlike-order-modal.component.scss'],
    standalone: false
})
export class AddNewCronlikeOrderModalComponent extends XcDialogComponent<boolean, AddNewCronLikeOrderModalComponentData> {
    @ViewChild(XcFormDirective, { static: false })
    xcFormDirective: XcFormDirective;

    executionTimeInvalid = false;
    orderTypeValid = false;
    busy: boolean;

    get invalid(): boolean {
        if (!this.orderTypeValid || this.executionTimeInvalid) {
            return true;
        }
        return this.xcFormDirective ? this.xcFormDirective.invalid : false;
    }

    cronlikeOrder: XoCronLikeOrder;

    private _error: string;
    get error(): string {
        return this._error;
    }
    set error(value: string) {
        this._error = value;
        if (value) {
            this.errorBoxFocusCandidateRef.focus();
        }
    }
    errorBoxFocusCandidateRef = FMFocusCandidateRef.getInstance();

    inputParameterRef = InputParameterRef.getInstance();

    //#region ############################################################ RUNTIME CONTEXT
    get selectedServerRuntimeContext(): XoRuntimeContext {
        if (this.cronlikeOrder) {
            return this.cronlikeOrder.destination.runtimeContext;
        }
        return null;
    }

    set selectedServerRuntimeContext(value: XoRuntimeContext) {
        if (this.cronlikeOrder) {
            this.cronlikeOrder.destination.runtimeContext = value;
            this.selectedGUIRuntimeContext = value instanceof XoWorkspace ? RuntimeContext.fromWorkspace(value.name) : value instanceof XoApplication ? RuntimeContext.fromApplicationVersion(value.name, value.versionName) : null;
            this.cronlikeOrder.destination.orderType = '';
            this.cronlikeOrder.payload = '';
            this.updateInputParameterTree();
        }
    }

    private _selectedGUIRuntimeContext: RuntimeContext;
    get selectedGUIRuntimeContext(): RuntimeContext {
        if (this.cronlikeOrder) {
            const rtc = this.cronlikeOrder.destination.runtimeContext;
            if (rtc instanceof XoWorkspace) {
                return (this.selectedGUIRuntimeContext = RuntimeContext.fromWorkspace(rtc.name));
            }
            if (rtc instanceof XoApplication) {
                return (this.selectedGUIRuntimeContext = RuntimeContext.fromApplicationVersion(rtc.name, this.cronlikeOrder.version));
            }
        }
        return this._selectedGUIRuntimeContext;
    }
    set selectedGUIRuntimeContext(value: RuntimeContext) {
        this._selectedGUIRuntimeContext = value;
    }
    //#endregion

    //#region ############################################################ ORDER TYPE

    get selectedOrderType(): string {
        return this.cronlikeOrder.destination.orderType;
    }

    set selectedOrderType(value: string) {
        this.cronlikeOrder.destination.orderType = value;
        this.cronlikeOrder.payload = '';
        this.updateInputParameterTree();
    }
    //#endregion

    behaviorOnErrorDataWrapper: XcAutocompleteDataWrapper;

    get behaviorOnError(): string {
        if (this.cronlikeOrder) {
            switch (this.cronlikeOrder.onerror) {
                case 'IGNORE':
                    return ExecutionTimeBehaviorOnError.IGNORE;
                case 'DROP':
                    return ExecutionTimeBehaviorOnError.DROP;
                case 'DISABLE':
                    return ExecutionTimeBehaviorOnError.DISABLE;
            }
        }
        return '';
    }
    set behaviorOnError(value: string) {
        if (this.cronlikeOrder) {
            switch (value) {
                case ExecutionTimeBehaviorOnError.IGNORE:
                    this.cronlikeOrder.onerror = 'IGNORE';
                    break;
                case ExecutionTimeBehaviorOnError.DROP:
                    this.cronlikeOrder.onerror = 'DROP';
                    break;
                case ExecutionTimeBehaviorOnError.DISABLE:
                    this.cronlikeOrder.onerror = 'DISABLE';
                    break;
            }
        }
    }

    constructor(injector: Injector, private readonly apiService: ApiService, private readonly i18n: I18nService) {
        super(injector);

        this.i18n.setTranslations(LocaleService.DE_DE, addNewCronlikeOrderModal_translations_de_DE);
        this.i18n.setTranslations(LocaleService.EN_US, addNewCronlikeOrderModal_translations_en_US);

        this.inputParameterRef.referenceIsEstablished.subscribe(ref => this.updateInputParameterTree());

        this.behaviorOnErrorDataWrapper = new XcAutocompleteDataWrapper(
            () => this.behaviorOnError,
            (value: string) => {
                this.behaviorOnError = value;
                this.killError();
            }
        );

        this.behaviorOnErrorDataWrapper.values = Object.keys(ExecutionTimeBehaviorOnError).map(key => ({ name: ExecutionTimeBehaviorOnError[key], value: ExecutionTimeBehaviorOnError[key] }));

        if (this.injectedData.duplicate) {
            this.cronlikeOrder = this.injectedData.duplicate;
            // TODO: Set all selected things
            this.updateInputParameterTree();
        } else {
            this.cronlikeOrder = new XoCronLikeOrder();
            this.cronlikeOrder.executionTime.timeWindow = new XoRestrictionBasedTimeWindow();
            this.addDefaultValues();
        }
        this.behaviorOnErrorDataWrapper.update();
    }

    add() {
        this.cronlikeOrder.payload = this.inputParameterRef.inputParameter;
        this.busy = true;

        // TimeWindow is abstract
        if (this.cronlikeOrder.executionTime && this.cronlikeOrder.executionTime.timeWindow) {
            const tw = this.cronlikeOrder.executionTime.timeWindow;
            if (tw.fqn.name === 'TimeWindow') {
                tw.fqn = FullQualifiedName.decode(tw.fqn.path + '.RestrictionBasedTimeWindow');
            }
        }

        this.apiService.startOrder(this.injectedData.rtc, this.injectedData.addWorkflow, this.cronlikeOrder, null, StartOrderOptionsBuilder.defaultOptionsWithErrorMessage).subscribe(
            result => {
                this.busy = false;
                if (result && result.errorMessage) {
                    this.error = this.injectedData.i18nService.translateErrorCode(result.errorMessage);
                } else {
                    this.dismiss(true);
                }
            },
            error => {
                this.error = isString(error) ? error : error.message;
            }
        );
    }

    killError() {
        this.error = '';
    }

    updateInputParameterTree() {
        const ot = this.selectedOrderType;
        const rtc = this.selectedGUIRuntimeContext;
        const inputParameterStr = this.cronlikeOrder ? this.cronlikeOrder.payload : '';

        if (this.inputParameterRef.isReferenceEstablished) {
            this.inputParameterRef.setNewData(inputParameterStr, rtc, ot);
        }
    }

    addDefaultValues() {
        delete this.cronlikeOrder.iD;
        this.cronlikeOrder.enabled = true;
        const ex = this.cronlikeOrder.executionTime;
        // ex.startTime = Date.now() - (new Date().getTimezoneOffset() * 60 * 1000);
        const date = new Date();
        date.setMilliseconds(0);
        date.setSeconds(0);
        date.setMinutes(date.getMinutes() + 5);
        ex.startTime = date.getTime();
        ex.timezone = 'UTC';
        this.cronlikeOrder.onerror = 'IGNORE';
        this.cronlikeOrder.destination.orderType = '';
    }
}
