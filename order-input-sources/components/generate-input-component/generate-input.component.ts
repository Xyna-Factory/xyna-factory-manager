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
import { ChangeDetectorRef, Component, EventEmitter, Input, Output } from '@angular/core';
import { Router } from '@angular/router';

import { ApiService, FullQualifiedName, RuntimeContext, StartOrderOptions, XoArray, XoClassInterfaceFrom, XoDescriber, XoJson, XoObject } from '@zeta/api';
import { AuthService } from '@zeta/auth';
import { isArray, isString } from '@zeta/base';
import { XcDialogService, XcStructureTreeDataSource } from '@zeta/xc';

import { finalize } from 'rxjs/operators';

import { ORDER_INPUT_SOURCE_TYPE_CONSTANT_NAME_PREFIX, ORDER_INPUT_SOURCE_TYPE_WORKFLOW_NAME_PREFIX, ORDER_INPUT_SOURCE_TYPE_XTF_NAME_PREFIX, OrderInputSourceParameterKey } from '../../restorable-order-input-sources.component';
import { XoOrderInputSource } from '../../xo/xo-order-input-source.model';


interface InputDataTypesTreeData {
    inputDescriberArray: XoDescriber[];
    respectiveContainer: XoArray;
}

@Component({
    selector: 'generate-input-component',
    templateUrl: './generate-input.component.html',
    styleUrls: ['./generate-input.component.scss'],
    standalone: false
})
export class GenerateInputComponent {

    startOrderBusy: boolean;
    rtc: RuntimeContext;

    processOrderId: string;
    processError: string;

    ois: XoOrderInputSource;

    get noInputData(): boolean {
        return !this.inputParamterTreeDataSource || !this.inputParamterTreeDataSource.container || this.inputParamterTreeDataSource.container.data.length === 0;
    }

    get isSourceTypeConstant(): boolean {
        return this.ois && this.ois.sourceType.name.indexOf(ORDER_INPUT_SOURCE_TYPE_CONSTANT_NAME_PREFIX) >= 0;
    }

    get isSourceTypeWorkflow(): boolean {
        return this.ois && this.ois.sourceType.name.indexOf(ORDER_INPUT_SOURCE_TYPE_WORKFLOW_NAME_PREFIX) >= 0;
    }

    get isSourceTypeXTF(): boolean {
        return this.ois && this.ois.sourceType.name.indexOf(ORDER_INPUT_SOURCE_TYPE_XTF_NAME_PREFIX) >= 0;
    }

    private lastStringContainerForXTF: string[];
    private lastInputSourceId: number;

    @Input()
    private set orderInputSource(value: XoOrderInputSource) {
        this.ois = value;
        this.resetComponent(true);
    }

    @Input()
    fmanRtc: RuntimeContext;

    @Input()
    disabled = false;

    @Output()
    readonly generatingErrorEmitter = new EventEmitter<any>();

    errorMsg: string;
    inputParamterTreeDataSource: XcStructureTreeDataSource;


    constructor(private readonly apiService: ApiService, private readonly dialogService: XcDialogService, private readonly authService: AuthService, private readonly router: Router, private readonly cdr: ChangeDetectorRef) {
    }


    generateInputHandler() {
        this.resetComponent();

        if (this.ois) {

            if (this.ois.applicationName) {
                this.rtc = RuntimeContext.fromApplicationVersion(this.ois.applicationName, this.ois.versionName);
            } else {
                this.rtc = RuntimeContext.fromWorkspace(this.ois.workspaceName);
            }

            if (this.isSourceTypeConstant) {
                //
                const inputData = this.ois.parameter.data
                    .find(para => para.key === OrderInputSourceParameterKey.ConstantInputData);
                const str = inputData ? inputData.value : '';
                this.buildTreeFromJson(this.rtc, str);
            }

            if (this.isSourceTypeWorkflow) {
                //
                const paramGenOrderType = this.ois.parameter.data
                    .find(para => para.key === OrderInputSourceParameterKey.WorkflowGeneratingOrderType);
                const genOrderType = paramGenOrderType.value;
                this.startGeneratingOrderAndBuildTree(this.rtc, genOrderType);
            }

            if (this.isSourceTypeXTF) {

                // const paramGenOrderType = this.ois.parameter.data
                //     .find(para => para.key === OrderInputSourceParameterKey.XTFOrderTypeOfGeneratingWorkflow);

                const paramCaseName = this.ois.parameter.data.find(
                    para => para.key === OrderInputSourceParameterKey.XTFTestCaseName
                );

                this.apiService.generateInput(this.rtc, paramCaseName.value, {withErrorMessage: true}).pipe(
                    finalize(() => this.cdr.markForCheck())
                ).subscribe(
                    result => {
                        if (result && !result.error) {
                            this.lastInputSourceId = result.inputSourceId;

                            // 3. cf must be the user who generated it
                            if (result.customStringContainer && result.customStringContainer.length) {
                                result.customStringContainer[2] = this.authService.username;
                            }

                            this.lastStringContainerForXTF = result.customStringContainer;

                            const output = new XoArray<XoObject>();
                            output.data.push(...(<XoObject[]>result.output));

                            if (output) {
                                this._buildTree(this.rtc, output, output.data);
                            }

                        } else {
                            this.generatingErrorEmitter.emit(result);
                        }
                    },
                    error => {
                        this.generatingErrorEmitter.emit(error);
                    }
                );
            }
        }
    }

    startOrderHandler() {
        this.resetComponent(false);
        this.startOrderBusy = true;
        const orderType = this.ois.orderType.type;
        const input = this.inputParamterTreeDataSource.container.data;

        const opt: StartOrderOptions = {
            async: false,
            withErrorMessage: true
        };

        if (this.isSourceTypeXTF) {
            opt.inputSourceId = this.lastInputSourceId;

            // 3. cf must be the user who generated it
            if (this.lastStringContainerForXTF && this.lastStringContainerForXTF.length) {
                this.lastStringContainerForXTF[2] = this.authService.username;
            }
            opt.customStringContainer = this.lastStringContainerForXTF;
        }

        this.apiService.startOrder(this.rtc, orderType, input, null, opt).pipe(
            finalize(() => {
                this.startOrderBusy = false;
                this.cdr.markForCheck();
            })
        ).subscribe(
            result => {
                this.processOrderId = result.orderId;
                if (result && result.errorMessage) {
                    this.processError = result.errorMessage;
                }
            },
            error => {
                this.processError = isString(error) ? error : error.message;
            },
            () => this.startOrderBusy = false
        );
    }

    jumpToOrder() {
        void this.router.navigate(['xfm/Process-Monitor/'], {
            queryParams: { 'order': this.processOrderId }
        });
    }

    resetComponent(withTree = false) {
        if (withTree) {
            this.inputParamterTreeDataSource = null;
        }
        this.processError = '';
        this.processOrderId = '';
        this.errorMsg = '';
    }


    /**
     * If the Sourcetype of the OIS is constant than it delivers a JsonString of the input Parameters
     */
    buildTreeFromJson(rtc: RuntimeContext, inputParameterJson: string) {

        const descContainer: XoDescriber[] = [];
        const dataContainer = new XoArray();

        dataContainer.fqn = FullQualifiedName.decode('base.AnyType');
        dataContainer.rtc = rtc;

        if (inputParameterJson) {
            const treeData: InputDataTypesTreeData = this._transformInputParameterJson(rtc, inputParameterJson);
            if (treeData) {
                descContainer.push(...treeData.inputDescriberArray);
                dataContainer.data.push(...treeData.respectiveContainer.data);
            }
        }

        this._buildTree(rtc, dataContainer, descContainer);
    }

    private _transformInputParameterJson(rtc: RuntimeContext, input: string): InputDataTypesTreeData {

        const object = JSON.parse(input);
        const objectArr: XoJson[] = isArray(object) ? object : [object];

        const treeData: InputDataTypesTreeData = {
            inputDescriberArray: [],
            respectiveContainer: new XoArray()
        };

        objectArr.forEach(inputJSON => {

            // usage is comparable to startOrder
            const xo = new (XoClassInterfaceFrom(inputJSON))().decode(inputJSON);
            xo.rtc = rtc;
            treeData.respectiveContainer.data.push(xo);

            const desc: XoDescriber = {
                fqn: FullQualifiedName.decode(inputJSON.$meta.fqn),
                rtc: rtc
            };
            treeData.inputDescriberArray.push(desc);
        });

        return treeData;
    }

    startGeneratingOrderAndBuildTree(rtc: RuntimeContext, ordertype: string, cf0?: string, cf1?: string) {

        // getting the parameter signature of the generating ordertype
        this.apiService.getSignature(rtc, ordertype).subscribe(
            sig => {
                // if the generating ordertype has no input parameter
                // then
                // do startOrder and add its result output to the tree
                // else
                // add output parameter of the generating ordertype (which is the same of the input of the ois by design) to the tree

                const dataContainer = new XoArray();

                if (!sig.inputs.length) {

                    const optionsWithErrorAndCFs: StartOrderOptions = {
                        async: false,
                        withErrorMessage: true,
                        customStringContainer: [cf0, cf1, this.authService.username]
                    };

                    this.apiService.startOrder(rtc, ordertype, null, null, optionsWithErrorAndCFs).subscribe(result => {
                        if (result && !result.errorMessage) {
                            result.output.forEach(item => {
                                dataContainer.data.push(item);
                            });

                            this._buildTree(rtc, dataContainer, dataContainer.data);
                        } else {
                            this.dialogService.error(result.errorMessage);
                        }
                    });
                } else {
                    sig.outputs.forEach(variable => {
                        const item = variable.isList ? new XoArray() : new XoObject();
                        item.fqn = variable.fqn;
                        item.rtc = variable.rtc;
                        dataContainer.data.push(item);
                    });
                    this._buildTree(rtc, dataContainer, dataContainer.data);
                }
            },
            error => {
                this.generatingErrorEmitter.emit(error);
            }
        );

    }

    _buildTree(rtc: RuntimeContext, dataContainer: XoArray, descContainer: XoDescriber[]) {

        if (!this.inputParamterTreeDataSource) {
            this.inputParamterTreeDataSource = new XcStructureTreeDataSource(this.apiService, undefined, rtc, null, null);
        }

        this.inputParamterTreeDataSource.rtc = rtc;
        this.inputParamterTreeDataSource.describers = descContainer;
        this.inputParamterTreeDataSource.container = dataContainer;
        this.inputParamterTreeDataSource.refresh();
        this.cdr.markForCheck();
    }
}
