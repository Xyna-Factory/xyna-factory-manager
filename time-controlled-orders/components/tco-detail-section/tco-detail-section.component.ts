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
import { Component, EventEmitter, Input, OnDestroy, OnInit, Output, ViewChild } from '@angular/core';

import { ApiService, StartOrderOptionsBuilder } from '@zeta/api';
import { XcDialogService, XcFormDirective, XcSelectionModel } from '@zeta/xc';

import { Observable, Subscription } from 'rxjs';
import { finalize } from 'rxjs/operators';

import { FM_RTC } from '../../../const';
import { XoOrderDestination } from '../../../xo/xo-orderdestination.model';
import { XoTimeControlledOrderId } from '../../xo/xo-time-controlled-order-id.model';
import { XoTimeControlledOrderTableEntry } from '../../xo/xo-time-controlled-order-table-entry.model';
import { XoTimeControlledOrder } from '../../xo/xo-time-controlled-order.model';
import { InputParameter, StorableInputParameterComponent } from '../storable-input-parameter/storable-input-parameter.component';


@Component({
    selector: 'tco-detail-section',
    templateUrl: './tco-detail-section.component.html',
    styleUrls: ['./tco-detail-section.component.scss'],
    standalone: false
})
export class TcoDetailSectionComponent implements OnInit, OnDestroy {
    @ViewChild(XcFormDirective, { static: false })
    xcFormDirective: XcFormDirective;

    @ViewChild(StorableInputParameterComponent, { static: false })
    storableInputComponent: StorableInputParameterComponent;

    @Input()
    readonly WFP_GET_TCO_DETAILS;
    @Input()
    readonly WFP_UPDATE_TCO;
    @Output()
    readonly refresh = new EventEmitter<void>();
    @Output()
    readonly validationChange = new EventEmitter<boolean>();

    @Input()
    selectionObservable: Observable<XcSelectionModel<XoTimeControlledOrderTableEntry>>;

    selectionSubscription: Subscription;
    querySelection: InputParameter;
    hasQueryInput: boolean;
    loading: boolean;

    executionRestrictionValid = true;
    executionTimeValid = true;
    orderTypeValid = true;

    private _timeControlledOrderTableEntry: XoTimeControlledOrderTableEntry;
    private _timeControlledOrder: XoTimeControlledOrder;
    private _orderDestination: XoOrderDestination;

    get valid() {
        return this.executionRestrictionValid && this.executionTimeValid && this.orderTypeValid && !!this.timeControlledOrder
            ? this.timeControlledOrder.name
            : false;
    }

    get orderDestination(): XoOrderDestination {
        return this._orderDestination;
    }

    set orderDestination(value: XoOrderDestination) {
        this.timeControlledOrder.orderDestination = value;
        this._orderDestination = value;
    }

    get timeControlledOrderTableEntry(): XoTimeControlledOrderTableEntry {
        return this._timeControlledOrderTableEntry;
    }

    set timeControlledOrderTableEntry(value: XoTimeControlledOrderTableEntry) {
        if (value && value.id) {
            this.getDetailsAboutTableEntry(value.id);
        }
        this._timeControlledOrderTableEntry = value;
    }

    get timeControlledOrder(): XoTimeControlledOrder {
        return this.loading ? null : this._timeControlledOrder;
    }

    set timeControlledOrder(value: XoTimeControlledOrder) {
        this._timeControlledOrder = value;
    }

    constructor(private readonly apiService: ApiService, private readonly dialogService: XcDialogService) {}

    ngOnInit() {
        this.selectionSubscription = this.selectionObservable.subscribe(selectionModel => {
            this.reset();
            this.timeControlledOrderTableEntry = selectionModel.selection[0];
        });
    }

    ngOnDestroy() {
        this.selectionSubscription.unsubscribe();
    }

    private reset() {
        this.hasQueryInput = false;
        this.querySelection = null;
    }

    orderTypeChange() {
        const tmp = new XoOrderDestination();
        tmp.runtimeContext = this.timeControlledOrder.orderDestination.runtimeContext;
        tmp.orderType = this.timeControlledOrder.orderDestination.orderType;
        this.orderDestination = tmp;
    }

    getDetailsAboutTableEntry(id: XoTimeControlledOrderId) {
        this.loading = true;
        this.apiService
            .startOrder(FM_RTC, this.WFP_GET_TCO_DETAILS, id, XoTimeControlledOrder, StartOrderOptionsBuilder.defaultOptionsWithErrorMessage)
            .pipe(
                finalize(() => {
                    this.loading = false;
                })
            )
            .subscribe(
                result => {
                    if (result.errorMessage) {
                        this.dialogService.error(result.errorMessage, null, result.stackTrace.join('\r\n'));
                        this.timeControlledOrder = null;
                    } else {
                        this.hasQueryInput = !!(result.output[0] as XoTimeControlledOrder).storableFqn;
                        this.timeControlledOrder = result.output[0] as XoTimeControlledOrder;
                    }
                },
                error => this.dialogService.error(error)
            );
    }

    saveChanges() {
        this.timeControlledOrder.inputPayload = this.storableInputComponent.getPayload();
        this.apiService
            .startOrder(FM_RTC, this.WFP_UPDATE_TCO, this.timeControlledOrder, [], StartOrderOptionsBuilder.defaultOptionsWithErrorMessage)
            .subscribe(
                result => {
                    if (result.errorMessage) {
                        this.dialogService.error(result.errorMessage, null, result.stackTrace.join('\r\n'));
                    } else {
                        this.refresh.emit();
                    }
                },
                error => this.dialogService.error(error)
            );
    }
}
