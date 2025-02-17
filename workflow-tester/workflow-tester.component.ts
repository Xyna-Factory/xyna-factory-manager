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
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Router } from '@angular/router';

import { ApiService, OrderTypeSignature, OrderTypeVariable, RuntimeContext, StartOrderOptionsBuilder, Xo, XoArray, XoObject, XoStartOrderExceptionResponse, XoStartOrderSuccessResponse, XoStructureArray, XoStructureObject, XynaMonitoringLevel, XynaPriority } from '@zeta/api';
import { I18nService } from '@zeta/i18n';
import { XcAutocompleteDataWrapper, XcDialogService, XcOptionItem, XcOptionItemUndefined, XcStructureTreeDataSource } from '@zeta/xc';

import { finalize } from 'rxjs/operators';


interface WorkflowTest {
    signatureKey?: string;
    runtimeContext?: RuntimeContext;
    orderType?: string;
    input?: Xo[];
    output?: Xo[];
    orderId?: string;
    error?: string;
    stack?: string;
    customField1?: string;
    customField2?: string;
    customField3?: string;
    customField4?: string;
    monitoringLevel?: XynaMonitoringLevel;
    priority?: XynaPriority;
}


@Component({
    selector: 'xfm-fman-workflow-tester',
    templateUrl: './workflow-tester.component.html',
    styleUrls: ['./workflow-tester.component.scss'],
    standalone: false
})
export class WorkflowTesterComponent {
    private static readonly history = new Map<string, WorkflowTest>();
    test: WorkflowTest;

    private _runtimeContext: RuntimeContext;
    private _orderType: string;
    private _input: Xo[];

    private inputTypes: (typeof XoStructureObject | typeof XoStructureArray)[];

    inputTree: XcStructureTreeDataSource;
    outputTree: XcStructureTreeDataSource;

    hideOutput = false;
    launching = false;
    customField1: string;
    customField2: string;
    customField3: string;
    customField4: string;

    private monitoringLevel: XynaMonitoringLevel = 20;
    private priority: XynaPriority;

    readonly monitoringLevelDataWrapper = new XcAutocompleteDataWrapper<XynaMonitoringLevel>(
        ()    => this.monitoringLevel,
        value => this.monitoringLevel = value,
        [XcOptionItemUndefined()].concat(
            [0, 5, 10, 15, 17, 18, 20].map(value => <XcOptionItem<XynaMonitoringLevel>>{name: '' + value, value})
        )
    );

    readonly priorityDataWrapper = new XcAutocompleteDataWrapper<XynaPriority>(
        ()    => this.priority,
        value => this.priority = value,
        [XcOptionItemUndefined()].concat(
            [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(value => <XcOptionItem<XynaPriority>>{name: '' + value, value})
        )
    );

    @Output()
    readonly navigate = new EventEmitter<void>();


    constructor(
        private readonly router: Router,
        private readonly apiService: ApiService,
        private readonly dialogService: XcDialogService,
        private readonly i18n: I18nService
    ) {
        // create input tree
        this.inputTree = new XcStructureTreeDataSource(apiService, i18n, undefined, []);
        this.inputTree.structureFallbackFunction = idx => this.inputTypes[idx];
        // create output tree
        this.outputTree = new XcStructureTreeDataSource(apiService, i18n, undefined, []);
        this.outputTree.readonlyMode = true;
        this.outputTree.arrayTypesLimit = 20;
    }


    private computeVariableKey(variable: OrderTypeVariable): string {
        return '{' + variable.rtc.uniqueKey + '/' + variable.fqn.uniqueKey + '/' + (variable.isList ? 'L' : 'S') + '}';
    }


    private computeSignatureKey(signature: OrderTypeSignature): string {
        return signature.inputs.map(input => this.computeVariableKey(input)).join('') + '~' +
               signature.outputs.map(output => this.computeVariableKey(output)).join('');
    }


    private computeTestKey(): string {
        return this.runtimeContext.uniqueKey + '/' + this.orderType;
    }


    @Input()
    set runtimeContext(value: RuntimeContext) {
        this._runtimeContext = value;
        this.updateInputTree();
    }


    get runtimeContext(): RuntimeContext {
        return this._runtimeContext;
    }


    @Input()
    set orderType(value: string) {
        this._orderType = value;
        this.updateInputTree();
    }


    get orderType(): string {
        return this._orderType;
    }


    @Input()
    set input(value: Xo[]) {
        this._input = value;
    }


    get input(): Xo[] {
        return this._input;
    }


    get showOutputPanel(): boolean {
        return !!this.test?.orderId && !this.hideOutput;
    }


    launch(wait: boolean) {
        if (!this.launching && this.runtimeContext && this.orderType) {
            this.test.output = undefined;
            this.test.orderId = undefined;
            this.launching = wait;
            const payload = this.inputTree.container.data;
            const options = new StartOrderOptionsBuilder()
                .async(!wait)
                .monitoringLevel(this.monitoringLevel)
                .priority(this.priority)
                .customStringContainer([this.customField1, this.customField2, this.customField3, this.customField4])
                .withErrorMessage(true)
                .options;

            this.apiService.startOrder(this.runtimeContext, this.orderType, payload, null, options).pipe(
                finalize(() => {
                    this.hideOutput = false;
                    this.launching = false;
                    this.test.input = this.inputTree.container.data;
                    this.test.customField1 = this.customField1;
                    this.test.customField2 = this.customField2;
                    this.test.customField3 = this.customField3;
                    this.test.customField4 = this.customField4;
                    this.test.monitoringLevel = this.monitoringLevel;
                    this.test.priority = this.priority;
                })
            ).subscribe(
                result => {
                    this.test.orderId = result.orderId;
                    this.test.error = result.errorMessage;
                    this.test.stack = result.stackTrace?.join('\n');
                    if (result instanceof XoStartOrderSuccessResponse) {
                        this.test.output = result.output;
                    }
                    if (result instanceof XoStartOrderExceptionResponse) {
                        this.test.output = result.exceptions?.data;
                    }
                    this.updateOutputTree();
                },
                error => this.dialogService.error(error?.message ?? error)
            );
        }
    }


    updateInputTree() {
        if (this.runtimeContext && this.orderType) {
            this.inputTree.rtc = this.runtimeContext;
            this.inputTree.container = new XoArray();
            this.inputTree.describers = [];
            this.inputTree.refresh();

            this.apiService.getSignature(this.runtimeContext, this.orderType).subscribe(signature => {
                this.hideOutput = true;
                const testkey = this.computeTestKey();
                const signatureKey = this.computeSignatureKey(signature);
                // get test from history, if any
                this.test = WorkflowTesterComponent.history.get(testkey);
                // test does not match signature?
                if (!this.test || this.test.signatureKey !== signatureKey) {
                    this.test = {};
                    this.test.runtimeContext = this.runtimeContext;
                    this.test.orderType = this.orderType;
                    this.test.signatureKey = signatureKey;
                    WorkflowTesterComponent.history.set(testkey, this.test);
                } else if (!this.input) {
                    if (this.test.input) {
                        this.input = this.test.input;
                    }
                    if (this.test.output) {
                        this.updateOutputTree();
                    }
                    this.customField1 = this.test.customField1;
                    this.customField2 = this.test.customField2;
                    this.customField3 = this.test.customField3;
                    this.customField4 = this.test.customField4;
                    this.monitoringLevel = this.test.monitoringLevel;
                    this.monitoringLevelDataWrapper.update();
                    this.priority = this.test.priority;
                    this.priorityDataWrapper.update();
                    this.hideOutput = false;
                }
                // update tree container
                this.inputTypes = [];
                this.inputTree.container.clear();
                signature.inputs.forEach((variable, idx) => {
                    const item = variable.isList ? new XoArray() : new XoObject();
                    item.fqn = variable.fqn;
                    item.rtc = variable.rtc;
                    this.inputTypes.push(variable.isList ? XoStructureArray : XoStructureObject);
                    this.inputTree.describers.push(item);
                    this.inputTree.container.append(this.input?.[idx] ?? null);
                });
                this.inputTree.refresh();
            });
        }
    }


    updateOutputTree() {
        if (this.runtimeContext && this.orderType) {
            this.outputTree.rtc = this.runtimeContext;
            this.outputTree.container = new XoArray().append(...(this.test.output ?? []));
            this.outputTree.describers = this.outputTree.container.data;
            this.outputTree.refresh();
        }
    }


    openAudit() {
        void this.router.navigate(['xfm/Process-Monitor/'], {
            queryParams: {'order': this.test.orderId}
        });
        this.navigate.emit();
    }
}
