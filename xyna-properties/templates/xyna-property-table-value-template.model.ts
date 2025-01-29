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
import { Component, InjectionToken } from '@angular/core';

import { XC_COMPONENT_DATA, XcDynamicComponent } from '@zeta/xc';


export interface XynaPropertyTableValueTemplateData {
    value: string;
    isBold: boolean;
}

@Component({
    template: '<ng-container *ngIf="!isBold">{{value}}</ng-container><b *ngIf="isBold">{{value}}</b>',
    styles: [],
    standalone: false
})
export class XynaPropertyTableValueTemplateComponent extends XcDynamicComponent<XynaPropertyTableValueTemplateData> {

    get value(): string {
        return this.injectedData.value;
    }

    get isBold(): boolean {
        return this.injectedData.isBold;
    }

    protected getToken(): InjectionToken<string> {
        return XC_COMPONENT_DATA;
    }
}
