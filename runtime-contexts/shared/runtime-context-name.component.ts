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
import { Component, HostBinding, InjectionToken, Input } from '@angular/core';

import { repeat } from '@zeta/base';
import { XC_COMPONENT_DATA, XcDynamicComponent } from '@zeta/xc';


@Component({
    selector: 'runtime-context-name',
    templateUrl: './runtime-context-name.component.html',
    styleUrls: ['./runtime-context-name.component.scss'],
    standalone: false
})
export class RuntimeContextNameComponent extends XcDynamicComponent<{name: string; hierarchyLevel: number}> {

    @Input()
    name: string;

    @Input()
    hierarchyLevel: number;


    protected getToken(): InjectionToken<string> {
        return XC_COMPONENT_DATA;
    }


    get internalName(): string {
        return this.name || this.injectedData.name;
    }


    @HostBinding('attr.hierarchy-level')
    get internalHierarchyLevel(): number {
        return this.hierarchyLevel || this.injectedData.hierarchyLevel;
    }


    get label(): string {
        return this.internalName;
    }


    get indentation(): string {
        return repeat(' ', this.internalHierarchyLevel * 8);
    }
}
