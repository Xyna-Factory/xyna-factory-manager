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
import { Observable, Subscription } from 'rxjs';
import { finalize } from 'rxjs/operators';

import { ChangeDetectionStrategy, Component, inject, input, OnDestroy, OnInit, output, viewChild } from '@angular/core';
import { FMAN_RTC } from '@fman/factory-manager.component';
import { ApiService, StartOrderOptionsBuilder } from '@zeta/api';
import { XcI18nContextDirective, XcI18nPipe, XcI18nTranslateDirective } from '@zeta/i18n';
import { XcCheckboxComponent, XcDialogService, XcFormDirective, XcFormInputComponent, XcFormValidatorRequiredDirective, XcPanelComponent, XcSelectionModel } from '@zeta/xc';

import { ExecutionTimeComponent } from '../../../cronlike-orders/components/execution-time/execution-time.component';
import { CustomInformationFormComponent } from '../../../reuseable-components/forms/custom-information-form/custom-information-form.component';
import { OrderTypeFormComponent } from '../../../reuseable-components/forms/order-type-form/order-type-form.component';
import { XoOrderDestination } from '../../../xo/xo-orderdestination.model';
import { XoTimeControlledOrderId } from '../../xo/xo-time-controlled-order-id.model';
import { XoTimeControlledOrderTableEntry } from '../../xo/xo-time-controlled-order-table-entry.model';
import { XoTimeControlledOrder } from '../../xo/xo-time-controlled-order.model';
import { InputParameter, StorableInputParameterComponent } from '../storable-input-parameter/storable-input-parameter.component';
import { TcoExecutionRestrictionComponent } from '../tco-execution-restriction/tco-execution-restriction.component';


@Component({
    changeDetection: ChangeDetectionStrategy.Eager,
    selector: 'tco-detail-section',
    templateUrl: './tco-detail-section.component.html',
    styleUrls: ['./tco-detail-section.component.scss'],
    imports: [XcCheckboxComponent, XcFormDirective, XcFormInputComponent, XcFormValidatorRequiredDirective, XcPanelComponent, XcI18nContextDirective, XcI18nTranslateDirective, XcI18nPipe, OrderTypeFormComponent, StorableInputParameterComponent, ExecutionTimeComponent, TcoExecutionRestrictionComponent, CustomInformationFormComponent]
})
export class TcoDetailSectionComponent implements OnInit, OnDestroy {
    private readonly apiService = inject(ApiService);
    private readonly dialogService = inject(XcDialogService);

    readonly xcFormDirective = viewChild(XcFormDirective);

    readonly storableInputComponent = viewChild(StorableInputParameterComponent);

    readonly WFP_GET_TCO_DETAILS = input(undefined);
    readonly WFP_UPDATE_TCO = input(undefined);
    readonly refresh = output<void>();
    readonly validationChange = output<boolean>();

    // @ts-expect-error(TODO:)
    readonly selectionObservable = input<Observable<XcSelectionModel<XoTimeControlledOrderTableEntry>>>(undefined);

    // @ts-expect-error(TODO:)
    selectionSubscription: Subscription;
    // @ts-expect-error(TODO:)
    querySelection: InputParameter;
    // @ts-expect-error(TODO:)
    hasQueryInput: boolean;
    // @ts-expect-error(TODO:)
    loading: boolean;

    executionRestrictionValid = true;
    executionTimeValid = true;
    orderTypeValid = true;

    // @ts-expect-error(TODO:)
    private _timeControlledOrderTableEntry: XoTimeControlledOrderTableEntry;
    // @ts-expect-error(TODO:)
    private _timeControlledOrder: XoTimeControlledOrder;
    // @ts-expect-error(TODO:)
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
        // @ts-expect-error(TODO:)
        return this.loading ? null : this._timeControlledOrder;
    }

    set timeControlledOrder(value: XoTimeControlledOrder) {
        this._timeControlledOrder = value;
    }

    ngOnInit() {
        this.selectionSubscription = this.selectionObservable().subscribe(selectionModel => {
            this.reset();
            this.timeControlledOrderTableEntry = selectionModel.selection[0];
        });
    }

    ngOnDestroy() {
        this.selectionSubscription.unsubscribe();
    }

    private reset() {
        this.hasQueryInput = false;
        // @ts-expect-error(TODO:)
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
        // @ts-expect-error(TODO:)
        this.apiService.startOrder(FMAN_RTC, this.WFP_GET_TCO_DETAILS(), id, XoTimeControlledOrder, StartOrderOptionsBuilder.defaultOptionsWithErrorMessage).pipe(
            finalize(() => this.loading = false)
        ).subscribe({
            next: result => {
                if (result.errorMessage) {
                    // @ts-expect-error(TODO:)
                    this.dialogService.error(result.errorMessage, null, result.stackTrace.join('\r\n'));
                    // @ts-expect-error(TODO:)
                    this.timeControlledOrder = null;
                } else {
                    // @ts-expect-error(TODO:)
                    this.hasQueryInput = !!(result.output[0] as XoTimeControlledOrder).storableFqn;
                    // @ts-expect-error(TODO:)
                    this.timeControlledOrder = result.output[0] as XoTimeControlledOrder;
                }
            },
            error: error => this.dialogService.error(error)
        });
    }

    saveChanges() {
        // @ts-expect-error(TODO:)
        this.timeControlledOrder.inputPayload = this.storableInputComponent().getPayload();
        this.apiService
            // @ts-expect-error(TODO:)
            .startOrder(FMAN_RTC, this.WFP_UPDATE_TCO(), this.timeControlledOrder, [], StartOrderOptionsBuilder.defaultOptionsWithErrorMessage)
            .subscribe({
                next: result => {
                    if (result.errorMessage) {
                        // @ts-expect-error(TODO:)
                        this.dialogService.error(result.errorMessage, null, result.stackTrace.join('\r\n'));
                    } else {
                        this.refresh.emit();
                    }
                },
                error: error => this.dialogService.error(error)
            });
    }
}
