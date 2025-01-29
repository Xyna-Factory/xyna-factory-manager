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
import { ChangeDetectorRef, Component, Injector, ViewChild } from '@angular/core';

import { ApiService, RuntimeContext, StartOrderOptionsBuilder, XoApplication, XoRuntimeContext, XoWorkspace } from '@zeta/api';
import { I18nService, LocaleService } from '@zeta/i18n';
import { XcAutocompleteDataWrapper, XcDialogComponent, XcFormDirective, XcOptionItemString } from '@zeta/xc';

import { finalize } from 'rxjs/operators';

import { InputParameterRef } from '../../../misc/components/input-parameter/input-parameter-ref.class';
import { FMFocusCandidateRef } from '../../../misc/directives/fm-focus-candidate.directive';
import { XoOrderType, XoOrderTypeArray } from '../../../xo/xo-order-type.model';
import { ORDER_INPUT_SOURCE_TYPE_CONSTANT_NAME_PREFIX, ORDER_INPUT_SOURCE_TYPE_WORKFLOW_NAME_PREFIX, ORDER_INPUT_SOURCE_TYPE_XTF_NAME_PREFIX, OrderInputSourceParameterKey } from '../../restorable-order-input-sources.component';
import { XoCreateOrderInputSourceRequest } from '../../xo/xo-create-order-input-source-request.model';
import { XoOrderInputSource } from '../../xo/xo-order-input-source.model';
import { XoParameter, XoParameterArray } from '../../xo/xo-parameter.model';
import { XoSourceType, XoSourceTypeArray } from '../../xo/xo-source-type.model';
import { addNewOrderInputSourceModal_translations_de_DE } from './locale/add-new-order-input-source-modal-translations.de-DE';
import { addNewOrderInputSourceModal_translations_en_US } from './locale/add-new-order-input-source-modal-translations.en-US';


export interface AddNewOrderInputSourceModalComponentData {
    addWorkflow: string;
    getOrderSourceTypesWorkflow: string;
    getOrderTypes: string;
    getGeneratingOrderTypes: string;
    rtc: RuntimeContext;
    i18nService: I18nService;
    duplicate: XoOrderInputSource;
    UNSPECIFIED_GET_RUNTIME_CONTEXTS_ERROR: string;
    GET_GENERATING_ORDER_TYPES_EMPTY_LIST_ERROR: (r: XoRuntimeContext) => string;
    GET_GENERATING_ORDER_TYPES_ERROR: string;
    GET_ORDER_TYPES_EMPTY_LIST_ERROR: (r: XoRuntimeContext) => string;
    UNSPECIFIED_GET_ORDER_TYPES_ERROR: string;
}


@Component({
    templateUrl: './add-new-order-input-source-modal.component.html',
    styleUrls: ['./add-new-order-input-source-modal.component.scss'],
    standalone: false
})
export class AddNewOrderInputSourceModalComponent extends XcDialogComponent<boolean, AddNewOrderInputSourceModalComponentData> {

    @ViewChild(XcFormDirective, {static: false})
    xcFormDirective: XcFormDirective;

    busy = false;

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

    orderInputSource: XoOrderInputSource;


    // ############################################################ RUNTIME CONTEXT


    runtimeContextsDataWrapper: XcAutocompleteDataWrapper;

    private _selectedServerRuntimeContext: XoRuntimeContext;

    get selectedServerRuntimeContext(): XoRuntimeContext {
        if (this.orderInputSource) {
            if (this.orderInputSource.workspaceName) {
                this.selectedGUIRuntimeContext = RuntimeContext.fromWorkspace(this.orderInputSource.workspaceName);
                return XoWorkspace.fromName(this.orderInputSource.workspaceName, this.orderInputSource.revision);
            }
            if (this.orderInputSource.applicationName && this.orderInputSource.versionName) {
                this.selectedGUIRuntimeContext = RuntimeContext.fromApplicationVersion(this.orderInputSource.applicationName, this.orderInputSource.versionName);
                return XoApplication.fromName(this.orderInputSource.applicationName, this.orderInputSource.versionName, this.orderInputSource.revision);
            }
        }
        return this._selectedServerRuntimeContext;
    }

    set selectedServerRuntimeContext(value: XoRuntimeContext) {
        this._selectedServerRuntimeContext = value;
        if (this.orderInputSource) {
            this.orderInputSource.revision = value ? value.revision : null;
            this.orderInputSource.workspaceName = (value instanceof XoWorkspace) ? value.name : null;
            this.orderInputSource.applicationName = (value instanceof XoApplication) ? value.name : null;
            this.orderInputSource.versionName = (value instanceof XoApplication) ? value.versionName : null;

            this.selectedGUIRuntimeContext = value instanceof XoWorkspace
                ? RuntimeContext.fromWorkspace(value.name)
                : value instanceof XoApplication
                    ? RuntimeContext.fromApplicationVersion(value.name, value.versionName)
                    : null;

            this.orderInputSource.orderType = null;
            this.inputParamterString = '';
            this.updateInputParameterTree();
            this._getOrderTypes();
        }
    }


    private _selectedGUIRuntimeContext: RuntimeContext;

    get selectedGUIRuntimeContext(): RuntimeContext {
        if (this.orderInputSource) {
            if (this.orderInputSource.workspaceName) {
                return this._selectedGUIRuntimeContext = RuntimeContext.fromWorkspace(this.orderInputSource.workspaceName);
            }
            if (this.orderInputSource.applicationName && this.orderInputSource.versionName) {
                return this._selectedGUIRuntimeContext = RuntimeContext.fromApplicationVersion(this.orderInputSource.applicationName, this.orderInputSource.versionName);
            }
        }
        return this._selectedGUIRuntimeContext;
    }

    set selectedGUIRuntimeContext(value: RuntimeContext) {
        this._selectedGUIRuntimeContext = value;
    }


    // ############################################################ ORDER TYPE


    orderTypeDataWrapper: XcAutocompleteDataWrapper;

    get noOrderTypes(): boolean {
        return this.orderTypeDataWrapper?.values.length === 0;
    }

    get selectedOrderType(): XoOrderType {
        return this.orderInputSource.orderType;
    }

    set selectedOrderType(value: XoOrderType) {
        this.orderInputSource.orderType = value;
        this.inputParamterString = null;
        this.updateInputParameterTree();
        this._getGeneratingOrderTypes();
    }


    // ############################################################ SOURCE TYPE


    sourceTypeDataWrapper: XcAutocompleteDataWrapper;

    get noSourceTypes(): boolean {
        return this.sourceTypeDataWrapper?.values.length === 0;
    }

    get selectedSourceType() {
        return this.orderInputSource ? this.orderInputSource.sourceType : null;
    }

    set selectedSourceType(value) {
        if (this.orderInputSource) {
            this.orderInputSource.sourceType = value;
        }
    }


    // ############################################################ INPUT PARAMETERS


    private _inputParamterString: string;

    get inputParamterString(): string {
        return this._inputParamterString;
    }

    set inputParamterString(value: string) {
        if (this._inputParamterString !== value) {
            this._inputParamterString = value;
            this.inputParameterRef.updateComponentView();
        }
    }

    inputParameterRef = InputParameterRef.getInstance();

    customField0 = '';
    customField1 = '';
    customField2 = '';
    customField3 = '';
    priority = 7;
    monitoringLevel = '20';

    monitoringLevelDataWrapper: XcAutocompleteDataWrapper;

    generatingOrderTypeDataWrapper: XcAutocompleteDataWrapper;
    selectedGeneratingOrderType: XoOrderType;

    xTFTestCaseID: string;
    xTFTestCaseName: string;


    constructor(injector: Injector, private readonly i18n: I18nService, private readonly cdr: ChangeDetectorRef, private readonly apiService: ApiService) {
        super(injector);

        this.i18n.setTranslations(LocaleService.DE_DE, addNewOrderInputSourceModal_translations_de_DE);
        this.i18n.setTranslations(LocaleService.EN_US, addNewOrderInputSourceModal_translations_en_US);

        this.runtimeContextsDataWrapper = new XcAutocompleteDataWrapper(
            ()    => this.selectedServerRuntimeContext,
            value => {
                this.error = '';
                this.selectedServerRuntimeContext = value;
            }
        );

        this._getRuntimeContexts();

        this.orderTypeDataWrapper = new XcAutocompleteDataWrapper(
            ()    => this.selectedOrderType,
            value => {
                this.error = '';
                this.selectedOrderType = value;
            }
        );

        this.sourceTypeDataWrapper = new XcAutocompleteDataWrapper(
            ()    => this.selectedSourceType,
            value => {
                this.error = '';
                this.selectedSourceType = value;
                this.inputParameterRef.updateComponentView();
                this._getGeneratingOrderTypes();
            }
        );

        this._getSourceTypes();

        this.inputParameterRef.referenceIsEstablished.subscribe(
            () => this.updateInputParameterTree()
        );

        this.monitoringLevelDataWrapper = new XcAutocompleteDataWrapper(
            ()    => this.monitoringLevel,
            value => {
                this.error = '';
                this.monitoringLevel = value;
            }, [
                XcOptionItemString('0'),
                XcOptionItemString('5'),
                XcOptionItemString('10'),
                XcOptionItemString('15'),
                XcOptionItemString('17'),
                XcOptionItemString('18'),
                XcOptionItemString('20')
            ]
        );

        this.generatingOrderTypeDataWrapper = new XcAutocompleteDataWrapper(
            ()    => this.selectedGeneratingOrderType,
            value => this.selectedGeneratingOrderType = value
        );

        if (this.injectedData.duplicate) {
            this._useDuplicate(this.injectedData.duplicate.clone());
        } else {
            this.orderInputSource = new XoOrderInputSource();
            this.orderInputSource.sourceType = new XoSourceType();
            this.orderInputSource.sourceType.name = '';
        }
    }


    private _getRuntimeContexts() {
        this.apiService.getRuntimeContexts(false).subscribe(
            runtimeContexts => {
                if (runtimeContexts.length > 0) {
                    this.runtimeContextsDataWrapper.values = runtimeContexts.map(rtc => ({value: rtc, name: rtc.toString()}));
                    this.error = '';
                } else {
                    this.error = this.injectedData.UNSPECIFIED_GET_RUNTIME_CONTEXTS_ERROR;
                }
            },
            error => this.error = error
        );
    }


    private _getSourceTypes() {
        this.apiService.startOrder(
            this.injectedData.rtc,
            this.injectedData.getOrderSourceTypesWorkflow,
            [], XoSourceTypeArray,
            StartOrderOptionsBuilder.defaultOptionsWithErrorMessage
        ).subscribe(result => {
            if (!result.errorMessage) {
                const output = result.output[0] as XoSourceTypeArray;
                this.sourceTypeDataWrapper.values = output.data
                    .filter(sourceType => !this.isSourceTypeXTF(sourceType))
                    .map   (sourceType => ({name: sourceType.label, value: sourceType}));
            } else {
                this.error = this.injectedData.i18nService.translateErrorCode(result.errorMessage);
            }
        });
    }


    private _getGeneratingOrderTypes() {
        if (!this.isSourceTypeWorkflowSelected && !this.isSourceTypeXTFSelected) {
            this.generatingOrderTypeDataWrapper.values = [];
            return;
        }

        if (this.selectedServerRuntimeContext && this.selectedOrderType) {
            this.apiService.startOrder(
                this.injectedData.rtc, this.injectedData.getGeneratingOrderTypes,
                [this.selectedServerRuntimeContext, this.selectedOrderType],
                XoOrderTypeArray,
                StartOrderOptionsBuilder.defaultOptionsWithErrorMessage
            ).subscribe(result => {
                if (!result.errorMessage) {
                    const output = result.output[0] as XoOrderTypeArray;
                    if (output?.length > 0) {
                        this.error = '';
                        this.generatingOrderTypeDataWrapper.values = output.data.map(orderType => ({value: orderType, name: orderType.name}));
                    } else {
                        this.error = output
                            ? this.injectedData.GET_GENERATING_ORDER_TYPES_EMPTY_LIST_ERROR(this.selectedServerRuntimeContext)
                            : this.injectedData.GET_GENERATING_ORDER_TYPES_ERROR;
                    }
                } else {
                    this.error = this.injectedData.i18nService.translateErrorCode(result.errorMessage);
                }
            });
        }
    }


    private _getOrderTypes() {
        // runtime context is null or dropdown empty?
        if (!this.selectedServerRuntimeContext) {
            return false;
        }

        this.apiService.startOrder(
            this.injectedData.rtc,
            this.injectedData.getOrderTypes,
            this.selectedServerRuntimeContext,
            XoOrderTypeArray,
            StartOrderOptionsBuilder.defaultOptionsWithErrorMessage
        ).subscribe(result => {
            if (!result.errorMessage) {
                const output = result.output[0] as XoOrderTypeArray;
                if (output?.length > 0) {
                    this.error = '';
                    this.orderTypeDataWrapper.values = output.data.map(orderType => ({value: orderType, name: orderType.name}));
                } else if (this.isSourceTypeConstantSelected) {
                    this.error = output
                        ? this.injectedData.GET_ORDER_TYPES_EMPTY_LIST_ERROR(this.selectedServerRuntimeContext)
                        : this.injectedData.UNSPECIFIED_GET_ORDER_TYPES_ERROR;
                }
            } else {
                this.error = this.injectedData.i18nService.translateErrorCode(result.errorMessage);
            }
        });
    }


    private _getParameter(): XoParameterArray {
        const parameterArray = new XoParameterArray();
        const addParameter = (key: string, value: string) => {
            const parameter = new XoParameter();
            parameter.key = key;
            parameter.value = value;
            parameterArray.data.push(parameter);
        };

        if (this.isSourceTypeWorkflowSelected) {
            addParameter(OrderInputSourceParameterKey.WorkflowGeneratingOrderType, this.selectedGeneratingOrderType.name);
        }

        if (this.isSourceTypeConstantSelected) {
            addParameter(OrderInputSourceParameterKey.ConstantMonitoringLevel, this.monitoringLevel);
            addParameter(OrderInputSourceParameterKey.ConstantCustomField1, this.customField1);
            addParameter(OrderInputSourceParameterKey.ConstantCustomField2, this.customField2);
            addParameter(OrderInputSourceParameterKey.ConstantCustomField3, this.customField3);
            addParameter(OrderInputSourceParameterKey.ConstantCustomField0, this.customField0);
            addParameter(OrderInputSourceParameterKey.ConstantPriority, this.priority.toString());
            // input parameter is optional
            if (this.inputParameterRef.inputParameter) {
                addParameter(OrderInputSourceParameterKey.ConstantInputData, this.inputParameterRef.inputParameter);
            }
        }

        if (this.isSourceTypeXTFSelected) {
            addParameter(OrderInputSourceParameterKey.XTFOrderTypeOfGeneratingWorkflow, this.selectedGeneratingOrderType.name);
            addParameter(OrderInputSourceParameterKey.XTFTestCaseID, this.xTFTestCaseID);
            addParameter(OrderInputSourceParameterKey.XTFTestCaseName, this.xTFTestCaseName);
        }

        return parameterArray;
    }


    private _useDuplicate(ois: XoOrderInputSource) {
        this.orderInputSource = ois;
        this._getOrderTypes();
        this._readFromDetailsObjectParameters();
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

        if (this.orderInputSource) {

            this.orderInputSource.parameter.data.forEach(parameter => {
                switch (parameter.key) {
                    case OrderInputSourceParameterKey.ConstantMonitoringLevel
                        : this.monitoringLevel = parameter.value;
                        if (this.monitoringLevelDataWrapper) {
                            this.monitoringLevelDataWrapper.update();
                        } break;
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
            });
        }
    }


    private isSourceTypeConstant(sourceType: XoSourceType): boolean {
        return sourceType?.name.indexOf(ORDER_INPUT_SOURCE_TYPE_CONSTANT_NAME_PREFIX) >= 0;
    }


    private isSourceTypeWorkflow(sourceType: XoSourceType): boolean {
        return sourceType?.name.indexOf(ORDER_INPUT_SOURCE_TYPE_WORKFLOW_NAME_PREFIX) >= 0;
    }


    private isSourceTypeXTF(sourceType: XoSourceType): boolean {
        return sourceType?.name.indexOf(ORDER_INPUT_SOURCE_TYPE_XTF_NAME_PREFIX) >= 0;
    }


    get isSourceTypeConstantSelected(): boolean {
        return this.isSourceTypeConstant(this.selectedSourceType);
    }


    get isSourceTypeWorkflowSelected(): boolean {
        return this.isSourceTypeWorkflow(this.selectedSourceType);
    }


    get isSourceTypeXTFSelected(): boolean {
        return this.isSourceTypeXTF(this.selectedSourceType);
    }


    get invalid(): boolean {
        return this.xcFormDirective?.invalid || this.noOrderTypes || this.noSourceTypes;
    }


    add() {
        const request = new XoCreateOrderInputSourceRequest();
        const parameter = this._getParameter();

        request.name = this.orderInputSource.name;
        request.orderType = this.orderInputSource.orderType.type;
        request.runtimeContext = this.selectedServerRuntimeContext;
        request.parameter = parameter;
        request.sourceType = this.selectedSourceType;
        request.documentation = this.orderInputSource.documentation;

        this.busy = true;
        this.apiService.startOrder(
            this.injectedData.rtc,
            this.injectedData.addWorkflow,
            request,
            null,
            StartOrderOptionsBuilder.defaultOptionsWithErrorMessage
        ).pipe(
            finalize(() => this.busy = false)
        ).subscribe(result => {
            if (result.errorMessage) {
                this.error = this.injectedData.i18nService.translateErrorCode(result.errorMessage);
            } else {
                this.dismiss(true);
            }
        });
    }


    updateInputParameterTree() {
        const ot = this.selectedOrderType?.type ?? '';
        const rtc = this.selectedGUIRuntimeContext;
        const inputParameterStr = this.inputParamterString;

        if (this.inputParameterRef.isReferenceEstablished) {
            this.inputParameterRef.setNewData(inputParameterStr, rtc, ot);
        }
    }
}
