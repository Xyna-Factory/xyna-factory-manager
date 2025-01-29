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

import { ApiService, FullQualifiedName, OrderTypeVariable, RuntimeContext, Xo, XoArray, XoClassInterfaceFrom, XoJson, XoObject, XoRuntimeContext, XoStorable, XoStructureType } from '@zeta/api';
import { isArray } from '@zeta/base';
import { I18nService } from '@zeta/i18n';
import { XcStructureTreeDataSource } from '@zeta/xc';

import { Observable } from 'rxjs';
import { finalize, tap } from 'rxjs/operators';

import { XoOrderDestination } from '../../../xo/xo-orderdestination.model';


export interface InputParameter {
    treeDataSource: XcStructureTreeDataSource;
    fqn: FullQualifiedName;
    rtc: RuntimeContext;
    that: StorableInputParameterComponent;
    queryable?: boolean;
    _querySet?: boolean;
    checkBoxDisabled: boolean;
    querySet?: boolean;
}
@Component({
    selector: 'storable-input-parameter',
    templateUrl: './storable-input-parameter.component.html',
    styleUrls: ['./storable-input-parameter.component.scss'],
    standalone: false
})
export class StorableInputParameterComponent {
    @Output()
    private readonly querySelectionChange = new EventEmitter<InputParameter>();
    @Output()
    private readonly destinationChange = new EventEmitter<XoOrderDestination>();
    @Output()
    private readonly payloadChange = new EventEmitter<string>();

    private _destination: XoOrderDestination;
    private _querySelection;
    private renewCachedRTC = true;
    private storablesInCurrentRTC: XoStructureType[] = [];
    private currentCachedRTC: XoRuntimeContext;
    private hasQuery: boolean;
    private readonly restoredPayloads: any[] = [];
    private _storableFqn: string;

    inputParameters: InputParameter[];
    loadedPayload: boolean;

    @Input()
    get destination(): XoOrderDestination {
        return this._destination;
    }

    set destination(value: XoOrderDestination) {
        if ((this._destination ? this._destination.runtimeContext : null) !== value.runtimeContext && value.runtimeContext instanceof XoRuntimeContext) {
            this.renewCachedRTC = true;
        }
        this.hasQuery = false;
        this._destination = value;
        this.querySelectionChange.emit(null);
        if (value) {
            this.destinationChange.emit(value);
            this.getInputParameters();
        }
    }

    @Input()
    get payload(): string {
        return this.getPayload();
    }

    set payload(value: string) {
        if (value) {
            this.loadInputFromPayload(value);
            this.loadedPayload = true;
        }
        this.payloadChange.emit(this.payload);
    }

    @Input()
    get storableFqn(): string {
        return this._storableFqn;
    }
    set storableFqn(value: string) {
        this.hasQuery = !!value;
        this._storableFqn = value;
    }

    get querySelection() {
        return this._querySelection;
    }

    set querySelection(value: InputParameter) {
        this._querySelection = value;
        this.querySelectionChange.emit(value);
    }

    constructor(private readonly apiService: ApiService, private readonly i18n: I18nService) {}

    /**
     * @description For a OrderTypeVariable found for the selected workflow it will add a InputParameter to the inputParameters Array.
     */
    private addSignatureInputToDataSource(input: OrderTypeVariable): void {
        const item = input.isList ? new XoArray() : new XoObject();
        item.fqn = input.fqn;
        item.rtc = input.rtc;
        const container = new XoArray();
        container.fqn = FullQualifiedName.decode('base.AnyType');
        container.rtc = this.destination.runtimeContext.toRuntimeContext();

        // If payload is loaded determin if the current input was set as query during creation
        const restoredQueryFlag = input.fqn.encode() === this.storableFqn;

        // Fill the data if a payload was provided
        if (this.loadedPayload) {
            let index;
            if ((index = this.restoredPayloads.findIndex(xo => (xo as Xo).fqn.uniqueKey === input.fqn.uniqueKey)) !== -1) {
                container.data.push(this.restoredPayloads[index]);
            }
        } else {
            container.data.push(item);
        }

        const treeDataSource = new XcStructureTreeDataSource(this.apiService, this.i18n, input.rtc, [item], container);
        treeDataSource.refresh();
        const inputParameter = {
            treeDataSource,
            fqn: input.fqn,
            rtc: input.rtc,
            that: this,
            _querySet: restoredQueryFlag,
            get checkBoxDisabled() {
                if (this._querySet) {
                    return false;
                }
                return this.that.hasQuery;
            },
            get querySet(): boolean {
                return this._querySet;
            },
            set querySet(checkboxValue: boolean) {
                this.that.hasQuery = checkboxValue;
                this._querySet = checkboxValue;
                this.that.querySelection = this._querySet ? { ...this } : null;
                // this.treeDataSource.readonlyMode = this._querySet;
            }
        };

        if (restoredQueryFlag) {
            this.querySelection = inputParameter;
        }

        this.inputParameters.push(inputParameter);
    }

    /**
     * @description Returns an observer that emits each XoStructureType of a storable found in the current rtc.
     * @param finalFunction can be passed to be executed when all XoStructureTypes got emitted
     */
    private updateStorablesInCurrentRTC(): Observable<XoStructureType[]> {
        return this.apiService.getSubtypes(this.destination.runtimeContext.toRuntimeContext(), [XoStorable]).get(XoStorable).pipe(
            tap((structures: XoStructureType[]) => structures.filter(structure => !structure.typeAbstract))
        );
    }

    /**
     * @description Adds the "queryable" property to each inputParameter that is a storable or subtype of a storable.
     */
    private addQueryableToInputs() {
        if (this.storablesInCurrentRTC.length) {
            this.storablesInCurrentRTC.forEach((storableStrcuture: XoStructureType) => {
                this.inputParameters.forEach(inputParameter => {
                    if (inputParameter.fqn.uniqueKey === storableStrcuture.typeFqn.uniqueKey) {
                        inputParameter.queryable = true;
                    }
                });
            });
        }
    }

    /**
     * @description If the renewCachedRTC flag is set to true it will get the storable strctures in the current rtc.
     *              It will get the signature of the selected order type to get the input fields and add the
     *              "queryable" property to each inputParameter that is a storable or subtype of a storable.
     */
    private getInputParameters() {
        this.inputParameters = [];
        if (!this.destination.runtimeContext || !this.destination.orderType) {
            this.clearTreeDataSources();
        } else {
            const rtc = this.destination.runtimeContext.toRuntimeContext();
            const orderType = this.destination.orderType;
            if (this.renewCachedRTC) {
                this.updateStorablesInCurrentRTC().subscribe((structures: XoStructureType[]) => {
                    structures.forEach(structure =>
                        this.storablesInCurrentRTC.push(structure)
                    );

                    this.currentCachedRTC = this.destination.runtimeContext.clone();
                    this.renewCachedRTC = false;
                    this.apiService.getSignature(rtc, orderType).pipe(
                        finalize(() => {
                            this.addQueryableToInputs();
                        })
                    ).subscribe(signature => {
                        signature.inputs.forEach(input => this.addSignatureInputToDataSource(input));
                    });
                });
            } else {
                this.apiService.getSignature(rtc, orderType).pipe(
                    finalize(() => {
                        this.addQueryableToInputs();
                    })
                ).subscribe(signature => {
                    signature.inputs.forEach(input => this.addSignatureInputToDataSource(input));
                });
            }
        }
        this.updateTrees();
    }

    /**
     * @description Builds a inputParameterString (payload)
     */
    private getInputParameterString(dataSource: XcStructureTreeDataSource) {
        if (dataSource && dataSource.container && dataSource.container.data && dataSource.container.data.length) {
            const params: string[] = [];
            dataSource.container.data.forEach(xo => {
                if (xo) {
                    const param = xo.encode();
                    params.push(JSON.stringify(param));
                } else {
                    return null;
                }
            });
            if (dataSource.container.data.length === 1) {
                return params[0];
            }
            if (dataSource.container.data.length > 1) {
                return '[\n' + params.join(',\n') + '\n]';
            }
        }
        return null;
    }

    /**
     * @description Loads input parameters based of a given payload
     */
    private loadInputFromPayload(payload: string) {
        // restored payload
        const object = JSON.parse(payload);
        const objectArr: XoJson[] = isArray(object) ? object : [object];

        objectArr.forEach(inputJSON => {
            if (inputJSON) {
                const xo = new (XoClassInterfaceFrom(inputJSON))().decode(inputJSON);
                xo.rtc = this.destination.runtimeContext.toRuntimeContext();
                this.restoredPayloads.push(xo);
            }
        });
    }

    /**
     * @description Return the input parameters as JSON string
     */
    getPayload(): string {
        const payloadStrings: string[] = [];
        this.inputParameters?.forEach(inputParameter => {
            const inputString = this.getInputParameterString(inputParameter.treeDataSource);
            // Only add paylaod if the input was not set as query
            if (inputParameter.querySet) {
                const emptyObject = new XoObject();
                emptyObject.rtc = inputParameter.rtc;
                emptyObject.fqn = inputParameter.fqn;
                const emptyObjectString = JSON.stringify(emptyObject.encode());
                payloadStrings.push(emptyObjectString);
            } else if (inputString && !inputParameter.querySet) {
                payloadStrings.push(inputString);
            }
        });
        if (payloadStrings.length === 0) {
            return null;
        }
        if (payloadStrings.length === 1 && this.hasQuery) {
            return null;
        }
        if (payloadStrings.length === 1) {
            return payloadStrings[0];
        }
        return `[${payloadStrings.join(',')}]`;
    }

    clearTreeDataSources() {
        this.inputParameters = [];
        this.storablesInCurrentRTC = [];
        this.currentCachedRTC = null;
    }

    updateTrees() {
        this.inputParameters.forEach(inputParameter => {
            inputParameter.treeDataSource.refresh();
        });
    }
}
