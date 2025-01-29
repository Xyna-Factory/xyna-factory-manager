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


@Component({
    template: `
        <div (click)="$event.preventDefault()">
            <xc-checkbox [checked]="from"></xc-checkbox>
            <xc-icon xc-icon-name="trending_flat" color="normal" xc-icon-material xc-icon-size="large"></xc-icon>
            <xc-checkbox [checked]="to" color="primary"></xc-checkbox>
        </div>
    `,
    styleUrls: ['change-template.component.scss'],
    standalone: false
})
export class ChangeTemplateComponent extends XcDynamicComponent<{dependency; XoDependencyType}> {

    protected getToken(): InjectionToken<string> {
        return XC_COMPONENT_DATA;
    }

    get from(): boolean {
        return this.injectedData.dependency.dependencyTypeInitial === this.injectedData.XoDependencyType.EXPLICIT;
    }

    get to(): boolean {
        return this.injectedData.dependency.dependencyType === this.injectedData.XoDependencyType.EXPLICIT;
    }
}
