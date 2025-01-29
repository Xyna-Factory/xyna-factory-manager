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
import { ActivatedRoute, Router } from '@angular/router';

import { ApiService, FullQualifiedName, RuntimeContext, StartOrderOptionsBuilder, XoApplication, XoArray, XoRuntimeContext, XoWorkspace } from '@zeta/api';
import { I18nService } from '@zeta/i18n';
import { XcAutocompleteDataWrapper, XcDialogService, XcFormDirective } from '@zeta/xc';

import { FM_RTC } from '../const';
import { InputParameterRef } from '../misc/components/input-parameter/input-parameter-ref.class';
import { FactoryManagerSettingsService } from '../misc/services/factory-manager-settings.service';
import { XoOrderTypeArray } from '../xo/xo-order-type.model';
import { ExecutionTimeBehaviorOnError } from './components/execution-time/execution-time.constant';
import { AddNewCronlikeOrderModalComponent, AddNewCronLikeOrderModalComponentData } from './modal/add-new-cronlike-order-modal/add-new-cronlike-order-modal.component';
import { CRONLIKE_ORDERS_ISWP, RestorableCronlikeOrdersComponent } from './restorable-cronlike-orders.component';
import { XoCronLikeOrderId } from './xo/xo-cronlike-order-id.model';
import { CronlikeOrderTableInfo, XoCronLikeOrder, XoCronLikeOrderArray } from './xo/xo-cronlike-order.model';


const ISWP = CRONLIKE_ORDERS_ISWP;


@Component({
    templateUrl: './cronlike-orders.component.html',
    styleUrls: ['./cronlike-orders.component.scss'],
    standalone: false
})
export class CronlikeOrdersComponent extends RestorableCronlikeOrdersComponent {

    @ViewChild(XcFormDirective, {static: false})
    xcFormDirective: XcFormDirective;

    executionTimeInvalid = false;

    get invalid(): boolean {
        return this.xcFormDirective ? (this.xcFormDirective.invalid || this.executionTimeInvalid) : false;
    }

    inputParameterRef = InputParameterRef.getInstance();

    //#region ############################################################ RUNTIME CONTEXT
    runtimeContextsDataWrapper: XcAutocompleteDataWrapper;

    private _selectedServerRuntimeContext: XoRuntimeContext;
    get selectedServerRuntimeContext(): XoRuntimeContext {
        if (this.detailsObject) {
            return this.detailsObject.destination.runtimeContext;
        }
        return this._selectedServerRuntimeContext;
    }

    set selectedServerRuntimeContext(value: XoRuntimeContext) {
        this._selectedServerRuntimeContext = value;
        if (this.detailsObject) {
            this.detailsObject.destination.runtimeContext = value;

            this.selectedGUIRuntimeContext =
                value instanceof XoWorkspace ? RuntimeContext.fromWorkspace(value.name)
                    : value instanceof XoApplication ? RuntimeContext.fromApplicationVersion(value.name, value.versionName)
                        : null;

            this.detailsObject.destination.orderType = '';
            this.detailsObject.payload = '';
            this.updateInputParameterTree();
            this._getOrderTypes();
        }
    }

    private _selectedGUIRuntimeContext: RuntimeContext;
    get selectedGUIRuntimeContext(): RuntimeContext {
        if (this.detailsObject) { // TODO: is this even necessary
            const rtc = this.detailsObject.destination.runtimeContext;
            if (rtc instanceof XoWorkspace) {
                return this.selectedGUIRuntimeContext = RuntimeContext.fromWorkspace(rtc.name);
            }
            if (rtc instanceof XoApplication) {
                return this.selectedGUIRuntimeContext = RuntimeContext.fromApplicationVersion(rtc.name, this.detailsObject.version);
            }
        }
        return this._selectedGUIRuntimeContext;
    }
    set selectedGUIRuntimeContext(value: RuntimeContext) {
        this._selectedGUIRuntimeContext = value;
    }
    //#endregion

    //#region ############################################################ ORDER TYPE
    orderTypeStringDataWrapper: XcAutocompleteDataWrapper;

    get selectedOrderType(): string {
        return this.detailsObject.destination.orderType;
    }

    set selectedOrderType(value: string) {
        this.detailsObject.destination.orderType = value;
        this.detailsObject.payload = '';
        this.updateInputParameterTree();
    }
    //#endregion

    behaviorOnErrorDataWrapper: XcAutocompleteDataWrapper;

    get behaviorOnError(): string {
        if (this.detailsObject) {
            switch (this.detailsObject.onerror) {
                case 'IGNORE':  return ExecutionTimeBehaviorOnError.IGNORE;
                case 'DROP':    return ExecutionTimeBehaviorOnError.DROP;
                case 'DISABLE': return ExecutionTimeBehaviorOnError.DISABLE;
            }
        }
        return '';
    }
    set behaviorOnError(value: string) {
        if (this.detailsObject) {
            switch (value) {
                case ExecutionTimeBehaviorOnError.IGNORE:  this.detailsObject.onerror = 'IGNORE'; break;
                case ExecutionTimeBehaviorOnError.DROP:    this.detailsObject.onerror = 'DROP'; break;
                case ExecutionTimeBehaviorOnError.DISABLE: this.detailsObject.onerror = 'DISABLE'; break;
            }
        }
    }

    constructor(
        apiService: ApiService,
        dialogService: XcDialogService,
        route: ActivatedRoute,
        router: Router,
        i18nService: I18nService,
        settings: FactoryManagerSettingsService,
        injector: Injector
    ) {
        super(apiService, dialogService, route, router, i18nService, injector, settings);

        this.initRemoteTableDataSource(XoCronLikeOrder, XoCronLikeOrderArray, FM_RTC, ISWP.List);

        this.remoteTableDataSource.tableInfoClass = CronlikeOrderTableInfo;

        this.selectedEntryChange.subscribe(
            selection => {
                if (selection && selection.length) {
                    this.getDetails(selection[0]);
                } else {
                    this.dismiss();
                }
            }
        );

        this.remoteTableDataSource.actionElements = [
            {
                class: 'delete-action-element',
                iconName: 'delete',
                tooltip: this.i18nService.translate('fman.cronlike-orders.delete'),
                onAction: this.delete.bind(this)
            },
            {
                class: 'copy-action-element',
                iconName: 'copy',
                tooltip: this.i18nService.translate('fman.cronlike-orders.duplicate'),
                onAction: this.duplicate.bind(this)
            }
        ];

        this.runtimeContextsDataWrapper = new XcAutocompleteDataWrapper(
            () => this.selectedServerRuntimeContext,
            (value: XoRuntimeContext) => this.selectedServerRuntimeContext = value
        );

        this.orderTypeStringDataWrapper = new XcAutocompleteDataWrapper(
            () => this.selectedOrderType,
            (value: string) => this.selectedOrderType = value
        );

        this.inputParameterRef.referenceIsEstablished.subscribe(() => this.updateInputParameterTree());

        this.behaviorOnErrorDataWrapper = new XcAutocompleteDataWrapper(
            () => this.behaviorOnError,
            (value: string) => this.behaviorOnError = value
        );

        this.behaviorOnErrorDataWrapper.values = Object.keys(ExecutionTimeBehaviorOnError).map(
            key => ({name: ExecutionTimeBehaviorOnError[key], value: ExecutionTimeBehaviorOnError[key]})
        );

    }

    private _getRuntimeContexts() {
        this.apiService.getRuntimeContexts(false).subscribe(
            rtcArr => {
                this.runtimeContextsDataWrapper.values = rtcArr.map(rtc => ({value: rtc, name: rtc.toString()}));
            },
            error => this.dialogService.error(error)
        );
    }

    private _getOrderTypes() {

        if (!this.selectedServerRuntimeContext) {
            return false;
        }

        const sub = this.apiService.startOrder(this.rtc, ISWP.GetOrderTypes, this.selectedServerRuntimeContext, XoOrderTypeArray, StartOrderOptionsBuilder.defaultOptionsWithErrorMessage);
        this.handleStartOrderResult(sub, output => {
            const otarr = output && output.length ? (output[0] as XoOrderTypeArray) : null;
            if (otarr instanceof XoArray) {
                this.orderTypeStringDataWrapper.values = otarr.data.map(ot => ({ value: ot.name, name: ot.name }));
                if (otarr.data.length === 0) {
                    const error = this.GET_ORDER_TYPES_EMPTY_LIST_ERROR(this.selectedServerRuntimeContext);
                    this.dialogService.error(error);
                }
            }
        }, this.UNSPECIFIED_GET_ORDER_TYPES_ERROR, null, () => this.orderTypeStringDataWrapper.values = []);
    }

    delete(entry: XoCronLikeOrder) {
        this.dialogService.confirm(
            this.i18nService.translate(this.FM_DELETE_ENTRY_HEADER),
            this.i18nService.translate(this.CONFIRM_DELETE, { key: '$0', value: entry.name })
        ).afterDismissResult().subscribe(
            value => {
                if (value) {
                    if (entry instanceof XoCronLikeOrder) {
                        const id = new XoCronLikeOrderId();
                        id.id = entry.iD;
                        const obs = this.apiService.startOrder(FM_RTC, ISWP.Delete, id, null, StartOrderOptionsBuilder.defaultOptionsWithErrorMessage);
                        this.handleStartOrderResult(obs, () => {
                            this.detailsObject = null;
                            this.clearSelection();
                            this.refresh();
                        }, this.UNSPECIFIED_DETAILS_ERROR);
                    }
                }
            }
        );
    }

    duplicate(entry: XoCronLikeOrder) {

        const obs = this.apiService.startOrder(FM_RTC, ISWP.Details, entry, XoCronLikeOrder, StartOrderOptionsBuilder.defaultOptionsWithErrorMessage);
        this.handleStartOrderResult(obs, output => {
            const detailedEntry = (output[0] || null) as XoCronLikeOrder;
            this.add(detailedEntry);

        }, this.UNSPECIFIED_DETAILS_ERROR);
    }

    add(duplicated?: XoCronLikeOrder) {

        const data: AddNewCronLikeOrderModalComponentData = {
            addWorkflow: ISWP.Add,
            getOrderTypes: ISWP.GetOrderTypes,
            i18nService: this.i18nService,
            rtc: FM_RTC,
            duplicate: duplicated,
            // eslint-disable-next-line @typescript-eslint/unbound-method
            GET_ORDER_TYPES_EMPTY_LIST_ERROR: this.GET_ORDER_TYPES_EMPTY_LIST_ERROR,
            UNSPECIFIED_GET_ORDER_TYPES_ERROR: this.UNSPECIFIED_GET_ORDER_TYPES_ERROR,
            UNSPECIFIED_GET_RUNTIME_CONTEXTS_ERROR: this.UNSPECIFIED_GET_RUNTIME_CONTEXTS_ERROR
        };

        this.dialogService.custom(AddNewCronlikeOrderModalComponent, data).afterDismissResult(true).subscribe(
            () => this.refresh()
        );
    }

    dismiss() {
        this.detailsObject = null;
        this.clearSelection();
    }

    save() {
        this.detailsObject.payload = this.inputParameterRef.inputParameter;

        if (this.detailsObject.executionTime && this.detailsObject.executionTime.timeWindow) {
            const tw = this.detailsObject.executionTime.timeWindow;
            if (tw.fqn.name === 'TimeWindow') {
                tw.fqn = FullQualifiedName.decode(tw.fqn.path + '.RestrictionBasedTimeWindow');
            }
        }

        const obs = this.apiService.startOrder(FM_RTC, ISWP.Save, this.detailsObject, null, StartOrderOptionsBuilder.defaultOptionsWithErrorMessage);
        this.handleStartOrderResult(obs, () => {
            // console.log('save was successful?', output);
            this.dismiss();
            this.refresh();
        }, this.UNSPECIFIED_SAVE_ERROR);

    }

    private getDetails(entry: XoCronLikeOrder) {

        const obs = this.apiService.startOrder(FM_RTC, ISWP.Details, entry, XoCronLikeOrder, StartOrderOptionsBuilder.defaultOptionsWithErrorMessage);
        this.handleStartOrderResult(obs, output => {
            this.detailsObject = (output[0] || null) as XoCronLikeOrder;
            this._getRuntimeContexts();
            this._getOrderTypes();
            this.behaviorOnErrorDataWrapper.update();

            if (this.inputParameterRef.isReferenceEstablished) {
                this.updateInputParameterTree();
            } else {
                this.inputParameterRef.referenceIsEstablished.subscribe(() => this.updateInputParameterTree());
            }

        }, this.UNSPECIFIED_DETAILS_ERROR);

    }

    updateInputParameterTree() {
        const ot = this.selectedOrderType;
        const rtc = this.selectedGUIRuntimeContext;
        const inputParameterStr = this.detailsObject ? this.detailsObject.payload : '';

        if (this.inputParameterRef.isReferenceEstablished) {
            this.inputParameterRef.setNewData(inputParameterStr, rtc, ot);
        }

    }
}
