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
import { RuntimeContext, Xo, XoArray } from '@zeta/api';

import { Observable, Subject, Subscription } from 'rxjs';

import { InputParameterComponent } from './input-parameter.component';


export class InputParameterRef {

    static getInstance(): InputParameterRef {
        return new InputParameterRef();
    }

    private readonly _referenceIsEstablishedSubject = new Subject<InputParameterRef>();

    get referenceIsEstablished(): Observable<InputParameterRef> {
        return this._referenceIsEstablishedSubject.asObservable();
    }

    // @ts-expect-error(TODO:)
    private _updateSupscription: Subscription;

    get isReferenceEstablished(): boolean {
        return !!this.component;
    }

    // @ts-expect-error(TODO:)
    private _component: InputParameterComponent;
    private get component(): InputParameterComponent {
        return this._component;
    }
    private set component(value: InputParameterComponent) {
        this._component = value;
        if (value) {
            this._referenceIsEstablishedSubject.next(this);
        }
    }


    setComponent(instance: InputParameterComponent) {
        this.component = instance;
    }

    setRuntimeContext(rtc: RuntimeContext) {
        this.component.runtimeContext = rtc;
    }

    setOrdertype(ot: string) {
        this.component.orderType = ot;
    }

    setNewRuntimeContext(rtc: RuntimeContext) {
        this.setRuntimeContext(rtc);
        this.setOrdertype('');
        this.clear();
        this.updateComponentView();
    }

    setNewOrdertype(ot: string) {
        this.setOrdertype(ot);
        this.clear();
        this.updateComponentView();
    }

    setNewData(inputParameterStr: string, rtc: RuntimeContext, ot: string) {
        this.component.setDataSurpressed(inputParameterStr, rtc, ot);
        this.updateComponentView();
    }

    get inputParameter(): string {
        // @ts-expect-error(TODO:)
        return this.component ? this.component.getInputParameterString() : null;
    }

    getInputParameter(): XoArray<Xo> {
        if (this.isReferenceEstablished) {
            return this.component.inputParamterTreeDataSource.container;
        }
        return new XoArray<Xo>();
    }

    updateComponentView() {
        if (this._updateSupscription) {
            this._updateSupscription.unsubscribe();
        }
        if (this.component) {
            this.component.updateComponentView();
        } else {
            this._updateSupscription = this.referenceIsEstablished.subscribe(ref => ref.updateComponentView());
        }
    }

    clear() {
        this.component.inputString = '';
    }


}
