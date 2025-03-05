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
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter, Injector, Input, Output, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FM_RTC } from '@fman/const';
import { InputParameterRef } from '@fman/misc/components/input-parameter/input-parameter-ref.class';
import { FactoryManagerSettingsService } from '@fman/misc/services/factory-manager-settings.service';
import { XoOrderType, XoOrderTypeArray } from '@fman/xo/xo-order-type.model';
import { ApiService, RuntimeContext, StartOrderOptionsBuilder, XoApplication, XoArray, XoRuntimeContext, XoWorkspace } from '@zeta/api';
import { isNumber } from '@zeta/base';
import { I18nService } from '@zeta/i18n';
import { XcAutocompleteDataWrapper, XcDialogService, XcFormDirective, XcIntegerStringDataWrapper, XcStringFloatDataWrapper, XcStringIntegerDataWrapper } from '@zeta/xc';
import { OrderInputSourceParameterKey, ORDER_INPUT_SOURCE_ISWP, ORDER_INPUT_SOURCE_TYPE_CONSTANT_NAME_PREFIX, ORDER_INPUT_SOURCE_TYPE_WORKFLOW_NAME_PREFIX, ORDER_INPUT_SOURCE_TYPE_XTF_NAME_PREFIX, RestorableOrderInputSourcesComponent } from '../restorable-order-input-sources.component';
import { XoFrequencyControlledTaskId } from '../xo/xo-frequency-controlled-task-id.model';
import { XoGetOrderInputSourceRequest } from '../xo/xo-get-order-input-source-request.model';
import { XoOrderInputSource } from '../xo/xo-order-input-source.model';
import { XoParameter } from '../xo/xo-parameter.model';
import { XoSourceType, XoSourceTypeArray } from '../xo/xo-source-type.model';
import { XoStartFrequencyControlledTaskParameter } from '../xo/xo-start-frequency-controlled-task-parameter.model';


const ISWP = ORDER_INPUT_SOURCE_ISWP;


export interface OrderInputSourceCloseEvent {
    dataChanged: boolean;
}


export abstract class FrequencyControlledTaskPreset {
    abstract toFrequencyControlledTaskParameter(): XoStartFrequencyControlledTaskParameter;
    abstract getType(): string;
}

export class FrequencyControlledTaskRatePreset extends FrequencyControlledTaskPreset {
    rate: number;
    duration: number;

    constructor(rate: number, duration: number) {
        super();
        this.rate = rate;
        this.duration = duration;
    }

    toFrequencyControlledTaskParameter(): XoStartFrequencyControlledTaskParameter {
        const param = new XoStartFrequencyControlledTaskParameter();
        param.value = this.rate;
        param.numberOfOrders = this.rate * this.duration;
        return param;
    }

    getType(): string {
        return 'Rate';
    }
}

export class FrequencyControlledTaskLoadPreset extends FrequencyControlledTaskPreset {
    load: number;
    count: number;

    constructor(load: number, count: number) {
        super();
        this.load = load;
        this.count = count;
    }

    toFrequencyControlledTaskParameter(): XoStartFrequencyControlledTaskParameter {
        const param = new XoStartFrequencyControlledTaskParameter();
        param.value = this.load;
        param.numberOfOrders = this.count;
        return param;
    }

    getType(): string {
        return 'Load';
    }
}


@Component({
    selector: 'order-input-source-details',
    templateUrl: './order-input-source-details.component.html',
    styleUrls: ['./order-input-source-details.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: false
})
export class OrderInputSourceDetailsComponent extends RestorableOrderInputSourcesComponent {

    // FIXME: USE CODE FROM ADD NEW ORDER INPUT SOURCE MODAL !!!!!

    @Input('order-input-source')
    set orderInputSource(value: XoOrderInputSource) {
        this.getDetails(value);
    }

    @Input('fct-preset')
    set fctPreset(preset: FrequencyControlledTaskPreset) {
        if (preset) {
            this.fctType = preset.getType();
            this.frequencyControlledTaskTypes.update();
            const params = preset.toFrequencyControlledTaskParameter();
            this.fctParameters.value = params.value;
            this.fctParameters.numberOfOrders = params.numberOfOrders;
        }
    }

    @Output('closed')
    readonly closed = new EventEmitter<OrderInputSourceCloseEvent>();

    @Output('navigated')
    readonly navigated = new EventEmitter<string>();


    @ViewChild(XcFormDirective, {static: false})
    xcFormDirective: XcFormDirective;

    get invalid(): boolean {
        return this.xcFormDirective ? (this.xcFormDirective.invalid || this.noOrderTypes) : false;
    }

    get isSourceTypeConstant(): boolean {
        return this.detailsObject && this.detailsObject.sourceType.name.indexOf(ORDER_INPUT_SOURCE_TYPE_CONSTANT_NAME_PREFIX) >= 0;
    }

    get isSourceTypeWorkflow(): boolean {
        return this.detailsObject && this.detailsObject.sourceType.name.indexOf(ORDER_INPUT_SOURCE_TYPE_WORKFLOW_NAME_PREFIX) >= 0;
    }

    get isSourceTypeXTF(): boolean {
        return this.detailsObject && this.detailsObject.sourceType.name.indexOf(ORDER_INPUT_SOURCE_TYPE_XTF_NAME_PREFIX) >= 0;
    }

    get fmanRTC(): RuntimeContext {
        return FM_RTC;
    }

    dateValid = true;


    // ############################################################ RUNTIME CONTEXT
    runtimeContextsDataWrapper: XcAutocompleteDataWrapper;

    private _selectedServerRuntimeContext: XoRuntimeContext;
    get selectedServerRuntimeContext(): XoRuntimeContext {
        if (this.detailsObject) {
            if (this.detailsObject.workspaceName) {
                this.selectedGUIRuntimeContext = RuntimeContext.fromWorkspace(this.detailsObject.workspaceName);
                return XoWorkspace.fromName(this.detailsObject.workspaceName, this.detailsObject.revision);
            }
            if (this.detailsObject.applicationName && this.detailsObject.versionName) {
                this.selectedGUIRuntimeContext = RuntimeContext.fromApplicationVersion(this.detailsObject.applicationName, this.detailsObject.versionName);
                return XoApplication.fromName(this.detailsObject.applicationName, this.detailsObject.versionName, this.detailsObject.revision);
            }
        }
        return this._selectedServerRuntimeContext;
    }
    set selectedServerRuntimeContext(value: XoRuntimeContext) {
        this._selectedServerRuntimeContext = value;
        if (this.detailsObject) {
            this.detailsObject.revision = value ? value.revision : null;
            this.detailsObject.workspaceName = (value instanceof XoWorkspace) ? value.name : null;
            this.detailsObject.applicationName = (value instanceof XoApplication) ? value.name : null;
            this.detailsObject.versionName = (value instanceof XoApplication) ? value.versionName : null;

            this.selectedGUIRuntimeContext =
                value instanceof XoWorkspace ? RuntimeContext.fromWorkspace(value.name)
                    : value instanceof XoApplication ? RuntimeContext.fromApplicationVersion(value.name, value.versionName)
                        : null;

            this.detailsObject.orderType = null;
            this.inputParamterString = '';
            this.updateInputParameterTree();
            this._getOrderTypes();
        }
    }

    private _selectedGUIRuntimeContext: RuntimeContext;
    get selectedGUIRuntimeContext(): RuntimeContext {
        if (this.detailsObject) {
            if (this.detailsObject.workspaceName) {
                return this._selectedGUIRuntimeContext = RuntimeContext.fromWorkspace(this.detailsObject.workspaceName);
            }
            if (this.detailsObject.applicationName && this.detailsObject.versionName) {
                return this._selectedGUIRuntimeContext = RuntimeContext.fromApplicationVersion(this.detailsObject.applicationName, this.detailsObject.versionName);
            }
        }
        return this._selectedGUIRuntimeContext;
    }
    set selectedGUIRuntimeContext(value: RuntimeContext) {
        this._selectedGUIRuntimeContext = value;
    }

    // ############################################################ ORDER TYPE
    orderTypeDataWrapper: XcAutocompleteDataWrapper;

    // this variable can turn from true to false after the startOrder to retrieve all ordertypes
    // if it turns asynchronally true it may cause: ExpressionChangedAfterItHasBeenCheckedError
    private _noOrderTypes = false;
    get noOrderTypes(): boolean {
        const res = this.orderTypeDataWrapper
            ? (this.orderTypeDataWrapper.values ? this.orderTypeDataWrapper.values.length === 0 : true)
            : true;
        if (res !== this._noOrderTypes) {
            this._noOrderTypes = res;
            this.cdr.detectChanges();
        }
        return res;
    }

    get selectedOrderType(): XoOrderType {
        return this.detailsObject ? this.detailsObject.orderType : null;
    }

    set selectedOrderType(value: XoOrderType) {
        this.detailsObject.orderType = value;
        this.inputParamterString = '';
        this.updateInputParameterTree();
        this._getGeneratingOrderTypes();
    }


    // ############################################################ SOURCE TYPE

    sourceTypeDataWrapper: XcAutocompleteDataWrapper;
    get selectedSourceType() {
        return this.detailsObject ? this.detailsObject.sourceType : null;
    }
    set selectedSourceType(value) {
        if (this.detailsObject) {
            this.detailsObject.sourceType = value;
        }
        this._getGeneratingOrderTypes();
    }

    private _inputParamterString: string;
    get inputParamterString(): string {
        return this._inputParamterString;
    }
    set inputParamterString(value: string) {
        if (this._inputParamterString !== value) {
            this._inputParamterString = value;
        }
    }
    inputParameterRef = InputParameterRef.getInstance();

    customField1 = '';
    customField2 = '';
    customField3 = '';
    customField0 = '';
    priority = 7;
    monitoringLevel = '20';

    monitoringLevelDataWrapper: XcAutocompleteDataWrapper;

    xTFTestCaseID: string;
    xTFTestCaseName: string;
    generatingOrderTypeDataWrapper: XcAutocompleteDataWrapper;
    selectedGeneratingOrderType: XoOrderType;

    // Frequency-Controlled Task
    frequencyControlledTaskTypes: XcAutocompleteDataWrapper;
    fctParameters: XoStartFrequencyControlledTaskParameter = new XoStartFrequencyControlledTaskParameter();
    fctType = '';
    frequencyId: XoFrequencyControlledTaskId;
    delayDataWrapper = new XcIntegerStringDataWrapper(
        () => this.fctParameters.delay,
        value => this.fctParameters.delay = this.startDelayed ? value : null
    );
    startDelayed = false;
    startingTask = false;

    fctNumberOfOdersDataWrapper = new XcStringIntegerDataWrapper(
        () => this.fctParameters.numberOfOrders,
        value => this.fctParameters.numberOfOrders = value
    );

    fctParameterValueDataWrapper = new XcStringFloatDataWrapper(
        () => this.fctParameters.value,
        value => this.fctParameters.value = value
    );
    fctDataPointCountDataWrapper = new XcStringIntegerDataWrapper(
        () => this.fctParameters.dataPointCount,
        value => this.fctParameters.dataPointCount = value
    );
    fctDataPointDistanceDataWrapper = new XcStringIntegerDataWrapper(
        () => this.fctParameters.dataPointDistance,
        value => this.fctParameters.dataPointDistance = value
    );

    constructor(
        apiService: ApiService,
        dialogService: XcDialogService,
        route: ActivatedRoute,
        router: Router,
        i18nService: I18nService,
        settings: FactoryManagerSettingsService,
        injector: Injector,
        private readonly cdr: ChangeDetectorRef
    ) {
        super(apiService, dialogService, route, router, i18nService, injector, settings);

        this.runtimeContextsDataWrapper = new XcAutocompleteDataWrapper(
            () => this.selectedServerRuntimeContext,
            (value: XoRuntimeContext) => this.selectedServerRuntimeContext = value
        );
        this._getRuntimeContexts();

        this.orderTypeDataWrapper = new XcAutocompleteDataWrapper(
            () => this.selectedOrderType,
            (value: XoOrderType) => this.selectedOrderType = value
        );

        this.sourceTypeDataWrapper = new XcAutocompleteDataWrapper(
            () => this.selectedSourceType,
            (value: XoSourceType) => this.selectedSourceType = value
        );
        this._getSourceTypes();

        this.inputParameterRef.referenceIsEstablished.subscribe(
            ref => this.updateInputParameterTree()
        );

        this.monitoringLevelDataWrapper = new XcAutocompleteDataWrapper(
            () => this.monitoringLevel,
            (value: string) => this.monitoringLevel = value
        );

        this.monitoringLevelDataWrapper.values = [
            { name: '0', value: '0' },
            { name: '5', value: '5' },
            { name: '10', value: '10' },
            { name: '15', value: '15' },
            { name: '17', value: '17' },
            { name: '18', value: '18' },
            { name: '20', value: '20' }
        ];

        this.frequencyControlledTaskTypes = new XcAutocompleteDataWrapper(
            () => this.fctType,
            (value: string) => this.fctType = value
        );

        this.frequencyControlledTaskTypes.values = [
            { name: 'Load', value: 'Load' },
            { name: 'Rate (in Hz)', value: 'Rate' }
        ];

        this.selectedGeneratingOrderType = new XoOrderType();
        this.generatingOrderTypeDataWrapper = new XcAutocompleteDataWrapper(
            () => this.selectedGeneratingOrderType,
            (value: XoOrderType) => this.selectedGeneratingOrderType = value
        );

        // preconfigure FCT parameters
        this.fctParameters.dataPointCount = 1000;
        this.fctParameters.dataPointDistance = 1;
        this.fctParameters.delay = (new Date().getTime()).toString();
    }


    private getDetails(entry: XoOrderInputSource) {
        const request = new XoGetOrderInputSourceRequest();
        request.inputSourceName = entry.name;
        request.revision = entry.revision;

        const obs = this.apiService.startOrder(FM_RTC, ISWP.Details, request, XoOrderInputSource, StartOrderOptionsBuilder.defaultOptionsWithErrorMessage);
        this.handleStartOrderResult(obs, output => {
            this.detailsObject = (output[0] || null) as XoOrderInputSource;

            this.runtimeContextsDataWrapper.update();
            this._getOrderTypes();
            this.sourceTypeDataWrapper.update();

            this._readFromDetailsObjectParameters();
            this.updateInputParameterTree();
            this.cdr.markForCheck();
        }, this.UNSPECIFIED_DETAILS_ERROR, null);

        // reset ID of last started task
        this.frequencyId = null;
        this.startingTask = false;
    }


    dismiss() {
        this.closed.emit({ dataChanged: false });
    }


    save() {
        this._writeToDetailsObjectParameters();

        const obs = this.apiService.startOrder(FM_RTC, ISWP.Save, this.detailsObject.clone(), null, StartOrderOptionsBuilder.defaultOptionsWithErrorMessage);
        this.handleStartOrderResult(obs, _ => {
            this.closed.emit({ dataChanged: true });
        }, this.UNSPECIFIED_SAVE_ERROR);
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
            this.orderTypeDataWrapper.values = [];
            // console.log('Selected RuntimeContext: ', this.selectedServerRuntimeContext);
            // Runtime Context is null or dropdown empty
            return false;
        }

        const sub = this.apiService.startOrder(FM_RTC, ISWP.GetOrderTypes, this.selectedServerRuntimeContext, XoOrderTypeArray, StartOrderOptionsBuilder.defaultOptionsWithErrorMessage);
        this.handleStartOrderResult(sub, output => {
            const otarr = output && output.length ? (output[0] as XoOrderTypeArray) : null;
            if (otarr instanceof XoArray) {
                this.orderTypeDataWrapper.values = otarr.data.map(ot => ({ value: ot, name: ot.name }));
            } else {
                this.orderTypeDataWrapper.values = [];
                let error: string;
                if (output && !output.length) {
                    error = this.isSourceTypeConstant
                        ? this.GET_ORDER_TYPES_EMPTY_LIST_ERROR(this.selectedServerRuntimeContext)
                        : '';
                } else {
                    error = this.isSourceTypeConstant
                        ? this.UNSPECIFIED_GET_ORDER_TYPES_ERROR
                        : '';
                }
                this.dialogService.error(error);
            }
            this.cdr.markForCheck();
        }, this.UNSPECIFIED_GET_ORDER_TYPES_ERROR);
    }

    private _getSourceTypes() {
        const sub = this.apiService.startOrder(FM_RTC, ISWP.GetOrderSourceTypes, [], XoSourceTypeArray, StartOrderOptionsBuilder.defaultOptionsWithErrorMessage);
        this.handleStartOrderResult(sub, output => {
            const stArr = output[0] as XoSourceTypeArray;
            this.sourceTypeDataWrapper.values = stArr.data.map(st => ({ name: st.label, value: st }));
            this.cdr.markForCheck();
        }, 'get Source Type Error');
    }

    private _readFromDetailsObjectParameters() {
        this.monitoringLevel = null;
        this.priority = null;
        this.customField0 = '';
        this.customField1 = '';
        this.customField2 = '';
        this.customField3 = '';
        this.inputParamterString = '';
        this.xTFTestCaseID = '';
        this.xTFTestCaseName = '';

        if (this.detailsObject) {
            this.detailsObject.parameter.data.forEach(
                parameter => {
                    switch (parameter.key) {
                        case OrderInputSourceParameterKey.ConstantMonitoringLevel
                            : this.monitoringLevel = parameter.value; this.monitoringLevelDataWrapper.update(); break;
                        case OrderInputSourceParameterKey.ConstantCustomField1
                            : this.customField1 = parameter.value; break;
                        case OrderInputSourceParameterKey.ConstantCustomField2
                            : this.customField2 = parameter.value; break;
                        case OrderInputSourceParameterKey.ConstantCustomField3
                            : this.customField3 = parameter.value; break;
                        case OrderInputSourceParameterKey.ConstantCustomField0
                            : this.customField0 = parameter.value; break;
                        case OrderInputSourceParameterKey.ConstantPriority
                            : this.priority = parseInt(parameter.value, 10); break;
                        case OrderInputSourceParameterKey.ConstantInputData
                            : this.inputParamterString = parameter.value; break;
                        case OrderInputSourceParameterKey.WorkflowGeneratingOrderType
                            : this.selectedGeneratingOrderType = new XoOrderType(); this.selectedGeneratingOrderType.name = parameter.value; this._getGeneratingOrderTypes(); break;
                        case OrderInputSourceParameterKey.XTFOrderTypeOfGeneratingWorkflow
                            : this.selectedGeneratingOrderType = new XoOrderType(); this.selectedGeneratingOrderType.name = parameter.value; this._getGeneratingOrderTypes(); break;
                        case OrderInputSourceParameterKey.XTFTestCaseID
                            : this.xTFTestCaseID = parameter.value; break;
                        case OrderInputSourceParameterKey.XTFTestCaseName
                            : this.xTFTestCaseName = parameter.value; break;
                    }
                }
            );
        }
    }

    private _writeToDetailsObjectParameters() {

        this.detailsObject.parameter.data.splice(0, this.detailsObject.parameter.data.length);

        const add = (p: XoParameter) => this.detailsObject.parameter.data.push(p);
        const getParameter = (key: string, value: string): XoParameter => {
            const p = new XoParameter(); p.key = key; p.value = value; return p;
        };

        if (this.isSourceTypeWorkflow) {
            add(getParameter(OrderInputSourceParameterKey.WorkflowGeneratingOrderType, this.selectedGeneratingOrderType.name));
        }

        if (this.isSourceTypeConstant) {
            add(getParameter(OrderInputSourceParameterKey.ConstantMonitoringLevel, this.monitoringLevel));
            add(getParameter(OrderInputSourceParameterKey.ConstantCustomField1, this.customField1));
            add(getParameter(OrderInputSourceParameterKey.ConstantCustomField2, this.customField2));
            add(getParameter(OrderInputSourceParameterKey.ConstantCustomField3, this.customField3));
            add(getParameter(OrderInputSourceParameterKey.ConstantCustomField0, this.customField0));
            add(getParameter(OrderInputSourceParameterKey.ConstantPriority, this.priority.toString()));
            // add Parameter only if the container has input data
            const inputData: string = this.inputParameterRef.inputParameter;
            if (inputData) {
                add(getParameter(OrderInputSourceParameterKey.ConstantInputData, inputData));
            }
        }


        if (this.isSourceTypeXTF) {
            add(getParameter(OrderInputSourceParameterKey.XTFOrderTypeOfGeneratingWorkflow, this.selectedGeneratingOrderType.name));
            add(getParameter(OrderInputSourceParameterKey.XTFTestCaseID, this.xTFTestCaseID));
            add(getParameter(OrderInputSourceParameterKey.XTFTestCaseName, this.xTFTestCaseName));
        }

    }

    private _getGeneratingOrderTypes() {

        this.generatingOrderTypeDataWrapper.values = [];

        if (!(this.isSourceTypeWorkflow || this.isSourceTypeXTF)) {
            return;
        }

        if (this.selectedServerRuntimeContext && this.selectedOrderType && !!this.selectedOrderType.name && this.selectedOrderType.name !== '') {
            const sub =
            this.apiService.startOrder(
                FM_RTC, ISWP.GetGeneratingOrderTypes, [this.selectedServerRuntimeContext, this.selectedOrderType], XoOrderTypeArray, StartOrderOptionsBuilder.defaultOptionsWithErrorMessage);

            this.handleStartOrderResult(sub, output => {
                const otArr = (output[0] || []) as XoOrderTypeArray;
                if (otArr) {
                    this.generatingOrderTypeDataWrapper.values = otArr.data.map(ot => ({ value: ot, name: ot.name }));
                }

                if (!otArr.length) {
                    const err = this.GET_GENERATING_ORDER_TYPES_EMPTY_LIST_ERROR(this.selectedServerRuntimeContext);
                    this.dialogService.error(err);
                }
                this.cdr.markForCheck();
            }, this.GET_GENERATING_ORDER_TYPES_ERROR);
        }
    }

    updateInputParameterTree() {
        const ot = this.selectedOrderType ? this.selectedOrderType.type : '';
        const rtc = this.selectedGUIRuntimeContext;
        const inputParameterStr = this.inputParamterString;

        if (this.inputParameterRef.isReferenceEstablished) {
            this.inputParameterRef.setNewData(inputParameterStr, rtc, ot);
        }

    }

    isAbleToStartTask(): boolean {

        let invalid = false;

        invalid = invalid || !this.detailsObject.name;
        invalid = invalid || !isNumber(this.fctParameters.numberOfOrders);
        invalid = invalid || !this.fctType; // not this.fctParameters.type!
        invalid = invalid || !isNumber(this.fctParameters.value);
        invalid = invalid || !isNumber(this.fctParameters.dataPointCount);
        invalid = invalid || !isNumber(this.fctParameters.dataPointDistance);
        invalid = invalid || (this.startDelayed ? !this.dateValid : false);

        return !invalid;
    }

    startTask() {
        this.fctParameters.type = this.fctType;
        this.fctParameters.orderInputSource = this.detailsObject;
        this.fctParameters.name = this.detailsObject.name;
        if (!this.startDelayed) {
            this.fctParameters.delay = null;
        }

        const obs = this.apiService.startOrder(FM_RTC, ISWP.StartFrequencyControlledTaskRequest, this.fctParameters, null, StartOrderOptionsBuilder.defaultOptionsWithErrorMessage);

        this.startingTask = true;
        this.frequencyId = null;
        this.handleStartOrderResult(obs,
            output => {
                this.frequencyId = output[0].data.id;
                this.cdr.markForCheck();
            },
            this.UNSPECIFIED_START_FREQUENCY_CONTROLLED_TASK_ERROR, // change error msg
            () => this.startingTask = false
        );
    }

    jumpToTask() {
        void this.router.navigate(['xfm/Process-Monitor/'], {
            queryParams: {'task': this.frequencyId}
        });
        this.navigated.emit('xfm/Process-Monitor/');
    }

    get fmRtc(): RuntimeContext {
        return FM_RTC;
    }

    onGeneratingError(error: any) {
        const msg = this.i18nService.translate('fman.ois.generating-error-message');
        this.dialogService.error(msg);
    }

    dateValidityChange(valid: boolean) {
        this.dateValid = valid;
    }
}
