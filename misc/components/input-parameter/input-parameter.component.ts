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
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';

import { ApiService, FullQualifiedName, RuntimeContext, XoArray, XoClassInterfaceFrom, XoDescriber, XoJson, XoObject } from '@zeta/api';
import { coerceBoolean, isArray } from '@zeta/base';
import { XcStructureTreeDataSource } from '@zeta/xc';

import { InputParameterRef } from './input-parameter-ref.class';


//#region - NOTE
/*
A programmatically way, which relies heavily on the ref-variable
-- <input-parameter
        [ref]="inputParameterRef"
    ></input-parameter>

    // component gets the necessary data through methods of the ref-variable
*/
//#endregion


export interface InputDataTypesTreeData {
    inputDescriberArray: XoDescriber[];
    respectiveContainer: XoArray;
}

@Component({
    selector: 'input-parameter',
    templateUrl: './input-parameter.component.html',
    styleUrls: ['./input-parameter.component.scss'],
    standalone: false
})
export class InputParameterComponent implements OnInit {

    private _collapsable = false;
    get collapsable(): boolean {
        return this._collapsable;
    }

    @Input('collapsable')
    set collapsed(value: boolean) {
        this._collapsable = coerceBoolean(value);
    }

    private _inputString: string;
    get inputString(): string {
        return this._inputString;
    }

    set inputString(value: string) {
        if (value !== this.inputString) {
            this._inputString = value;
        }
        this.updateComponentView();
    }

    get noInputData(): boolean {
        return !this.inputParamterTreeDataSource || !this.inputParamterTreeDataSource.container || this.inputParamterTreeDataSource.container.data.length === 0;
    }

    private _runtimeContext: RuntimeContext;
    get runtimeContext(): RuntimeContext {
        return this._runtimeContext;
    }

    set runtimeContext(value: RuntimeContext) {

        if (!value) {
            this._runtimeContext = value;
        }

        if (value instanceof RuntimeContext && !value.equals(this.runtimeContext)) {
            this._runtimeContext = value;
            this.updateComponentView();
        }
    }


    private _orderType: string;
    get orderType(): string {
        return this._orderType;
    }

    set orderType(value: string) {
        if (this.orderType !== value) {
            this._orderType = value;
        }
        this.updateComponentView();
    }

    @Input()
    ref: InputParameterRef;

    @Output()
    readonly markForChange = new EventEmitter<void>();

    inputParamterTreeDataSource: XcStructureTreeDataSource;

    constructor(private readonly apiService: ApiService) {

        this.inputParamterTreeDataSource = new XcStructureTreeDataSource(this.apiService, undefined, this.runtimeContext, null, null);
        this.inputParamterTreeDataSource.markForChange.subscribe(() => {
            this.markForChange.emit();
        });

    }

    ngOnInit() {

        if (this.ref) {
            this.ref.setComponent(this);
        } else {
            console.warn('No Reference set for InputParameterComponent');
        }
    }

    private clearTree() {
        this.inputParamterTreeDataSource.container = new XoArray();
        this.inputParamterTreeDataSource.describers = [];
        this.inputParamterTreeDataSource.refresh();
        this._inputString = this.getInputParameterString();
        this.markForChange.emit();

    }

    updateComponentView() {
        if (this.inputParamterTreeDataSource) {
            if (this.runtimeContext && this.orderType) {
                this.buildTree(this.inputString);
            } else {
                this.clearTree();
            }
        }
    }

    getInputParameterString() {
        if (this.inputParamterTreeDataSource && this.inputParamterTreeDataSource.container && this.inputParamterTreeDataSource.container.data && this.inputParamterTreeDataSource.container.data.length) {
            const params: string[] = [];
            this.inputParamterTreeDataSource.container.data.forEach(xo => {
                const param = xo.encode();
                params.push(JSON.stringify(param));
            });
            if (this.inputParamterTreeDataSource.container.data.length === 1) {
                // save in this._inputString so that it won't trigger the setter
                this._inputString = params[0];
                return this._inputString;
            }

            if (this.inputParamterTreeDataSource.container.data.length > 1) {
                this._inputString = '[' + params.join(',') + ']';
                return this._inputString;
            }
        }
        return null;
    }

    /**
     * if inputParameterJson is falsy or if it cannot be converted to objects then search for the
     * input signature of the selected order type
     */
    private buildTree(inputParameterJson?: string) {

        const descContainer: XoDescriber[] = [];
        const dataContainer = new XoArray();

        dataContainer.fqn = FullQualifiedName.decode('base.AnyType');
        dataContainer.rtc = this.runtimeContext;

        // if inputParameterJson is empty
        // sometimes GUI receives "[  ]" from the factory
        if (inputParameterJson) {

            const treeData: InputDataTypesTreeData = this.transformInputParameterJson(inputParameterJson);
            if (treeData) {
                descContainer.push(...treeData.inputDescriberArray);
                dataContainer.data.push(...treeData.respectiveContainer.data);
            }

            this.inputParamterTreeDataSource.rtc = this.runtimeContext;
            this.inputParamterTreeDataSource.describers = descContainer;
            this.inputParamterTreeDataSource.container = dataContainer;
            this.inputParamterTreeDataSource.refresh();
            this.markForChange.emit();

        } else if (this.orderType && this.runtimeContext) {
            this.apiService.getSignature(this.runtimeContext, this.orderType).subscribe(
                signature => {
                    if (signature && signature.inputs) {

                        signature.inputs.forEach(variable => {
                            const item = variable.isList ? new XoArray() : new XoObject();
                            item.fqn = variable.fqn;
                            item.rtc = variable.rtc;
                            dataContainer.data.push(item);

                            descContainer.push(item);
                        });

                        this.inputParamterTreeDataSource.rtc = this.runtimeContext;
                        this.inputParamterTreeDataSource.describers = descContainer;
                        this.inputParamterTreeDataSource.container = dataContainer;
                        this.inputParamterTreeDataSource.refresh();
                        this._inputString = this.getInputParameterString();
                        this.markForChange.emit();
                    }
                }, error => {
                    // console.log(error);
                }
            );
        }
    }

    private transformInputParameterJson(input: string): InputDataTypesTreeData {

        const object = JSON.parse(input);
        const objectArr: XoJson[] = isArray(object) ? object : [object];

        const treeData: InputDataTypesTreeData = {
            inputDescriberArray: [],
            respectiveContainer: new XoArray()
        };

        objectArr.forEach(inputJSON => {

            // usage is comparable to startOrder
            const xo = new (XoClassInterfaceFrom(inputJSON))().decode(inputJSON);
            xo.rtc = this.runtimeContext;
            treeData.respectiveContainer.data.push(xo);

            const desc: XoDescriber = {
                fqn: FullQualifiedName.decode(inputJSON.$meta.fqn),
                rtc: this.runtimeContext
            };
            treeData.inputDescriberArray.push(desc);
        });

        return treeData;
    }

    setDataSurpressed(inputParameterStr: string, rtc: RuntimeContext, ot: string) {
        this._runtimeContext = rtc;
        this._orderType = ot;
        this._inputString = inputParameterStr;
    }

}
