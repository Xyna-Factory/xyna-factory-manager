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


export interface DeploymentItemAttentionTemplateData {
    value: string;
    attention: boolean;
}

@Component({
    template: '<span>{{injectedData.value}}</span><xc-icon *ngIf="injectedData.attention" xc-icon-style="modeller" xc-icon-name="mini-catch"></xc-icon>',
    styleUrls: ['./deployment-item-attention-template.component.scss'],
    standalone: false
})
export class DeploymentItemAttentionTemplateComponent extends XcDynamicComponent<DeploymentItemAttentionTemplateData> {

    protected getToken(): InjectionToken<string> {
        return XC_COMPONENT_DATA;
    }
}
