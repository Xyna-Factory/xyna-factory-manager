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
import { Component, EventEmitter, Input, Output, ViewChild } from '@angular/core';

import { ApiService, StartOrderOptionsBuilder, XoArray, XoRuntimeContext } from '@zeta/api';
import { XcAutocompleteDataWrapper, XcFormDirective } from '@zeta/xc';

import { FM_RTC, FM_WF_GET_ORDER_TYPES } from '../../../const';
import { XoOrderTypeArray } from '../../../xo/xo-order-type.model';


@Component({
    selector: 'order-type-form',
    templateUrl: './order-type-form.component.html',
    styleUrls: ['./order-type-form.component.scss'],
    standalone: false
})
export class OrderTypeFormComponent {
    @ViewChild(XcFormDirective, { static: false })
    xcFormDirective: XcFormDirective;

    @Output() readonly selectedRuntimeContextChange = new EventEmitter<XoRuntimeContext>();
    @Output() readonly selectedOrderTypeChange = new EventEmitter<string>();
    @Output() readonly validationChange = new EventEmitter<boolean>();

    @Input() readonly masterWorkflowInfoText: boolean;
    /** Error key which gets translated */
    error: string;

    readonly runtimeContext = FM_RTC;

    orderTypeStringDataWrapper: XcAutocompleteDataWrapper;
    runtimeContextsDataWrapper: XcAutocompleteDataWrapper;

    private _selectedRTC: XoRuntimeContext;
    private _selectedOrderType = '';

    @Input()
    get selectedRuntimeContext(): XoRuntimeContext {
        return this._selectedRTC;
    }

    set selectedRuntimeContext(value: XoRuntimeContext) {
        this._selectedRTC = value;
        this.selectedRuntimeContextChange.emit(this._selectedRTC);
        this.validationChange.emit(this.isValid());
        if (value && value.rtc) {
            this.getOrderTypes();
        }
    }

    @Input()
    get selectedOrderType(): string {
        return this._selectedOrderType;
    }

    set selectedOrderType(value: string) {
        this._selectedOrderType = value;
        this.selectedOrderTypeChange.emit(this._selectedOrderType);
        this.validationChange.emit(this.isValid());
    }

    constructor(private readonly apiService: ApiService) {
        this.runtimeContextsDataWrapper = new XcAutocompleteDataWrapper(
            () => this.selectedRuntimeContext,
            (value: XoRuntimeContext) => {
                this.selectedRuntimeContext = value;
                this.error = '';
            }
        );

        this.orderTypeStringDataWrapper = new XcAutocompleteDataWrapper(
            () => this.selectedOrderType,
            (value: string) => {
                this.selectedOrderType = value;
                this.error = '';
            }
        );

        this.getRuntimeContexts();
    }

    private getRuntimeContexts() {
        this.apiService.getRuntimeContexts(false).subscribe(
            rtcArr => {
                if (rtcArr && rtcArr.length) {
                    this.runtimeContextsDataWrapper.values = rtcArr.map(rtc => ({ value: rtc, name: rtc.toString() }));
                    this.error = '';
                } else {
                    this.error = 'unexpectedError';
                }
            },
            error => {
                this.error = error;
            }
        );
    }

    private getOrderTypes() {
        if (!this.selectedRuntimeContext) {
            return false;
        }
        this.apiService.startOrder(this.runtimeContext, FM_WF_GET_ORDER_TYPES, this.selectedRuntimeContext, XoOrderTypeArray, StartOrderOptionsBuilder.defaultOptionsWithErrorMessage).subscribe(
            result => {
                if (result && !result.errorMessage) {
                    const orderTypeArray = result.output[0] as XoOrderTypeArray;
                    if (orderTypeArray instanceof XoArray) {
                        this.orderTypeStringDataWrapper.values = orderTypeArray.data.map(ot => ({ value: ot.name, name: ot.name }));
                        if (orderTypeArray.data.length === 0) {
                            this.error = 'error-emty';
                        }
                    }
                } else {
                    this.error = 'unexpectedError';
                }
            },
            error => {
                this.error = 'unexpectedError';
                this.orderTypeStringDataWrapper.values = [];
                console.error(error);
            }
        );
    }

    isValid(): boolean {
        return !!this.selectedRuntimeContext && !!this.selectedOrderType;
    }
}
