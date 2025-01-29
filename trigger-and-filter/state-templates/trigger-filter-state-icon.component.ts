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

export const TriggerFilterState = {
    OK: 'OK',
    EMPTY: 'EMPTY',
    ERROR: 'ERROR',
    ENABLED: 'ENABLED',
    DISABLED: 'DISABLED'
};


@Component({
    selector: 'trigger-filter-state-icon',
    templateUrl: './trigger-filter-state-icon.component.html',
    styleUrls: ['./trigger-filter-state-icon.component.scss'],
    standalone: false
})
export class TriggerFilterStateIconComponent extends XcDynamicComponent<{state: string}> {

    @Input()
    state: string;


    protected getToken(): InjectionToken<string> {
        return XC_COMPONENT_DATA;
    }


    get internalState(): string {
        return this.state || this.injectedData.state;
    }


    get iconMaterial(): boolean {
        if (this.internalState === TriggerFilterState.ENABLED ||
            this.internalState === TriggerFilterState.DISABLED) {
            return true;
        }
        return false;
    }


    get iconStyle(): string {
        if (this.internalState === TriggerFilterState.EMPTY ||
            this.internalState === TriggerFilterState.ERROR) {
            return 'modeller';
        }
        return '';
    }


    get iconName(): string {
        if (this.internalState === TriggerFilterState.EMPTY) {
            return 'tb-exception';
        }
        if (this.internalState === TriggerFilterState.ERROR) {
            return 'tb-exception';
        }
        if (this.internalState === TriggerFilterState.ENABLED) {
            return 'play_arrow';
        }
        if (this.internalState === TriggerFilterState.DISABLED) {
            return 'stop';
        }
        return '';
    }


    get iconColor(): XcColor {
        if (this.internalState === TriggerFilterState.ERROR) {
            return 'warn';
        }
        return 'normal';
    }


    get iconTooltip(): string {
        return this.internalState;
    }
}
