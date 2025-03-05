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


export interface CapacityTableInuseTemplateData {
    isValue: number;
    maxValue: number;
}

@Component({
    template: `
        <div class="capacity-box">
            <div class="progress-bar" [ngStyle]="{ right: 100 - inPercent + '%'}"></div>
            <div class="value">
                <div>{{isValue}} / {{maxValue}}<div>
            </div>
        </div>`,
    styleUrls: ['./capacity-table-inuse-template.model.scss'],
    standalone: false
})
export class CapacityTableInuseTemplateComponent extends XcDynamicComponent<CapacityTableInuseTemplateData> {

    get isValue(): number {
        return this.injectedData.isValue;
    }

    get maxValue(): number {
        return this.injectedData.maxValue;
    }

    get inPercent(): number {
        return 100 * this.isValue / this.maxValue;
    }

    protected getToken(): InjectionToken<string> {
        return XC_COMPONENT_DATA;
    }
}
