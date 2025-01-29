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
import { Component, InjectionToken, Input } from '@angular/core';

import { XC_COMPONENT_DATA, XcDynamicComponent } from '@zeta/xc';
import { XcColor } from '@zeta/xc/shared/xc-themeable.component';

import { XoRuntimeContextState } from '../xo/xo-runtime-context-state.model';


@Component({
    selector: 'runtime-context-icon',
    templateUrl: './runtime-context-icon.component.html',
    styleUrls: ['./runtime-context-icon.component.scss'],
    standalone: false
})
export class RuntimeContextIconComponent extends XcDynamicComponent<{state: string}> {

    @Input()
    state: string;


    protected getToken(): InjectionToken<string> {
        return XC_COMPONENT_DATA;
    }


    get internalState(): string {
        return this.state || this.injectedData.state;
    }


    get iconMaterial(): boolean {
        if (this.internalState === XoRuntimeContextState.RUNNING ||
            this.internalState === XoRuntimeContextState.STOPPED) {
            return true;
        }
        return false;
    }


    get iconStyle(): string {
        if (this.internalState === XoRuntimeContextState.WARNING ||
            this.internalState === XoRuntimeContextState.ERROR) {
            return 'modeller';
        }
        return '';
    }


    get iconName(): string {
        if (this.internalState === XoRuntimeContextState.WARNING) {
            return 'tb-exception';
        }
        if (this.internalState === XoRuntimeContextState.ERROR) {
            return 'tb-exception';
        }
        if (this.internalState === XoRuntimeContextState.RUNNING) {
            return 'play_arrow';
        }
        if (this.internalState === XoRuntimeContextState.STOPPED) {
            return 'stop';
        }
        return '';
    }


    get iconColor(): XcColor {
        if (this.internalState === XoRuntimeContextState.ERROR) {
            return 'warn';
        }
        return 'normal';
    }


    get iconTooltip(): string {
        return this.internalState;
    }
}
